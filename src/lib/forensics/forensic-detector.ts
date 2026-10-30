import { DocumentType } from "../classifier/document-classifier";
import { ParsedField } from "../extractors/aadhaar";

export interface AnomalyReport {
  anomalyType:
    | "FONT_INCONSISTENCY"
    | "EDGE_DISCONTINUITY"
    | "SUSPICIOUS_ARTIFACT"
    | "LAYOUT_DISCREPANCY"
    | "FIELD_SYNTAX_WARNING";
  severity: "INFO" | "MODERATE" | "HIGH";
  title: string;
  explanation: string;
  confidence: number;
  boundingBox?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number;
    height: number;
  };
}

export interface ForensicResult {
  overallAnomalyDetected: boolean;
  analysisConfidence: number;
  fontConsistencyScore: number;
  layoutAlignmentScore: number;
  anomalies: AnomalyReport[];
  findingsSummary: string;
}

export function analyzeForensics(
  docType: DocumentType,
  fields: ParsedField[],
  ocrConfidence: number,
  rawText: string,
): ForensicResult {
  const anomalies: AnomalyReport[] = [];
  for (const field of fields.filter(
    (field) => field.validationStatus !== "VALID",
  )) {
    anomalies.push({
      anomalyType: "FIELD_SYNTAX_WARNING",
      severity: "MODERATE",
      title: `Format / checksum review: ${field.label}`,
      explanation: `The extracted ${field.label} failed a parser format or checksum check. This is a text validation finding, not evidence of altered fonts or pixels.`,
      confidence: 0,
    }); // No calibrated probability or image location exists for this rule.
  }
  const requiredKey: Partial<Record<DocumentType, string>> = {
    AADHAAR_CARD: "aadhaar_number",
    PAN_CARD: "pan_number",
    PASSPORT: "passport_number",
    DRIVING_LICENCE: "dl_number",
    VOTER_ID: "epic_number",
  };
  const key = requiredKey[docType];
  if (key && !fields.some((field) => field.key === key))
    anomalies.push({
      anomalyType: "FIELD_SYNTAX_WARNING",
      severity: "HIGH",
      title: "Primary identifier not extracted",
      explanation:
        "The expected identifier was not found in OCR text. Check the image and selected document type; no visual location is inferred.",
      confidence: 0,
    });
  if (ocrConfidence < 70)
    anomalies.push({
      anomalyType: "FIELD_SYNTAX_WARNING",
      severity: "INFO",
      title: "OCR readability requires review",
      explanation:
        "The OCR engine reported low text-recognition confidence. Blur, glare and compression were not measured and cannot be inferred from this value alone.",
      confidence: 0,
    });
  return {
    overallAnomalyDetected: anomalies.some((item) => item.severity !== "INFO"),
    analysisConfidence: 0,
    fontConsistencyScore: 0,
    layoutAlignmentScore: 0,
    anomalies,
    findingsSummary:
      "Text format and checksum checks only. Pixel-level tampering, font, layout and compression analysis are not implemented.",
  };
}
