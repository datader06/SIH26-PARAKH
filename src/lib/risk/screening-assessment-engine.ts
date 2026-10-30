import { DocumentType } from "../classifier/document-classifier";
import { ParsedField } from "../extractors/aadhaar";
import { QualityAssessment } from "../forensics/image-quality";
import { ForensicResult } from "../forensics/forensic-detector";
import { FaceComparisonResult } from "../biometrics/face-comparison";

export interface RiskAssessmentResult {
  compositeScore: number; // 0 (safest) to 100 (highest risk)
  riskTier: "LOW_RISK" | "REVIEW_REQUIRED" | "HIGH_RISK";
  positiveSignals: string[];
  reviewIndicators: string[];
  explainabilitySummary: string;
}

export class ScreeningAssessmentEngine {
  static evaluate(params: {
    documentType: DocumentType;
    classificationConfidence: number;
    ocrConfidence: number;
    quality: QualityAssessment;
    fields: ParsedField[];
    forensics: ForensicResult;
    face?: FaceComparisonResult | null;
  }): RiskAssessmentResult {
    let riskPoints = 10; // baseline operational baseline
    const positiveSignals: string[] = [];
    const reviewIndicators: string[] = [];

    // 1. Classification & Type Confidence
    if (
      params.documentType !== "UNKNOWN" &&
      params.classificationConfidence >= 75
    ) {
      positiveSignals.push(
        `Document type inferred as ${params.documentType.replace(/_/g, " ")} (text-pattern heuristic score ${params.classificationConfidence}/100; not OCR confidence)`,
      );
    } else {
      riskPoints += 25;
      reviewIndicators.push(
        "Ambiguous document type classification; manual document type verification required.",
      );
    }

    // 2. Optical Character Recognition Quality
    if (params.ocrConfidence >= 80) {
      positiveSignals.push(
        `High optical character recognition fidelity (${params.ocrConfidence}% OCR confidence)`,
      );
    } else if (params.ocrConfidence < 65) {
      riskPoints += 20;
      reviewIndicators.push(
        `Low OCR recognition confidence (${params.ocrConfidence}%); review the extracted text`,
      );
    }

    reviewIndicators.push(
      "Image tampering, font consistency, sharpness and glare were not measured. Review the original document.",
    );

    // 4. Mandatory Field Presence & Checksum Validation
    const hasSensitivePrimary = params.fields.some(
      (f) =>
        [
          "aadhaar_number",
          "pan_number",
          "passport_number",
          "dl_number",
          "epic_number",
        ].includes(f.key) && f.validationStatus === "VALID",
    );
    const warningFields = params.fields.filter(
      (f) => f.validationStatus === "WARNING",
    );

    if (hasSensitivePrimary) {
      positiveSignals.push(
        "Primary identifier passed the implemented format/checksum checks; this does not verify issuance or authenticity",
      );
    } else {
      riskPoints += 20;
      reviewIndicators.push(
        "Primary identification number missing or failed statutory format check",
      );
    }

    if (warningFields.length > 0) {
      riskPoints += 10 * warningFields.length;
      reviewIndicators.push(
        `${warningFields.length} field(s) require manual review due to formatting variance`,
      );
    }

    // Text validation findings are already counted above. Do not count them a
    // second time as unimplemented pixel-level forensic evidence.

    // 6. Optional Biometric Face Comparison
    if (params.face) {
      if (params.face.matchStatus === "MATCH") {
        positiveSignals.push(
          `Biometric facial similarity confirmed (${params.face.similarityScore}% match score)`,
        );
        riskPoints = Math.max(0, riskPoints - 10);
      } else if (params.face.matchStatus === "REVIEW_REQUIRED") {
        riskPoints += 15;
        reviewIndicators.push(
          `Biometric face similarity in review zone (${params.face.similarityScore}%)`,
        );
      } else if (params.face.matchStatus === "NO_MATCH") {
        riskPoints += 30;
        reviewIndicators.push(
          `Biometric face comparison failed: portrait mismatch (${params.face.similarityScore}%)`,
        );
      }
    }

    // Clamp score
    const compositeScore = Math.min(100, Math.max(0, riskPoints));

    let riskTier: "LOW_RISK" | "REVIEW_REQUIRED" | "HIGH_RISK" = "LOW_RISK";
    if (compositeScore >= 66) {
      riskTier = "HIGH_RISK";
    } else if (compositeScore >= 26) {
      riskTier = "REVIEW_REQUIRED";
    }

    const explainabilitySummary =
      riskTier === "LOW_RISK"
        ? "Low heuristic triage score from OCR and implemented text checks. Image authenticity and issuer records remain unverified."
        : riskTier === "REVIEW_REQUIRED"
          ? "Screening indicators identify specific text fields requiring human reviewer evaluation before operational acceptance."
          : "Elevated risk index triggered due to text-readability, missing-field or format/checksum concerns. Rigorous manual inspection or secondary identification mandatory.";

    return {
      compositeScore,
      riskTier,
      positiveSignals,
      reviewIndicators,
      explainabilitySummary,
    };
  }
}
