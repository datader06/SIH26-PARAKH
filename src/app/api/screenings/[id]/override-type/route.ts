import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { DocumentType } from "@/lib/classifier/document-classifier";
import { extractFieldsForDocument } from "@/lib/extractors";
import {
  restoreOCRResponse,
  serializeOCREvidence,
  presentScreening,
} from "@/lib/ocr/evidence";
import { assessImageQuality } from "@/lib/forensics/image-quality";
import { analyzeForensics } from "@/lib/forensics/forensic-detector";
import { ScreeningAssessmentEngine } from "@/lib/risk/screening-assessment-engine";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Session required." },
        { status: 401 },
      );
    }

    const { id } = params;
    const body = await req.json();
    const newDocType = body.documentType as DocumentType;

    if (
      ![
        "AADHAAR_CARD",
        "PAN_CARD",
        "PASSPORT",
        "DRIVING_LICENCE",
        "VOTER_ID",
        "UNKNOWN",
      ].includes(newDocType)
    ) {
      return NextResponse.json(
        { error: "Select a supported document type." },
        { status: 400 },
      );
    }

    const session = await prisma.screeningSession.findFirst({
      where: {
        OR: [{ id }, { screeningId: id }],
        organizationId: currentUser.organizationId,
      },
      include: { ocrResult: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Screening record not found." },
        { status: 404 },
      );
    }

    if (!session.ocrResult)
      return NextResponse.json(
        { error: "OCR evidence is unavailable. Re-scan the document." },
        { status: 422 },
      );
    const ocr = restoreOCRResponse(session.ocrResult);
    const extraction = extractFieldsForDocument(newDocType, ocr.fullText, ocr);
    const quality = assessImageQuality(
      ocr.imageDimensions?.width,
      ocr.imageDimensions?.height,
      ocr.averageConfidence,
      ocr.fullText.length,
    );
    const forensics = analyzeForensics(
      newDocType,
      extraction.fields,
      ocr.averageConfidence,
      ocr.fullText,
    );
    const risk = ScreeningAssessmentEngine.evaluate({
      documentType: newDocType,
      classificationConfidence:
        newDocType === session.detectedType
          ? session.classificationConfidence
          : 0,
      ocrConfidence: ocr.averageConfidence,
      quality,
      fields: extraction.fields,
      forensics,
    });
    const qualityData = {
      qualityScore: quality.qualityScore,
      blurIndex: quality.blurIndex,
      glareIndex: quality.glareIndex,
      brightnessScore: quality.brightnessScore,
      contrastScore: quality.contrastScore,
      resolutionStatus: quality.resolutionStatus,
      structuralIntegrity: quality.structuralIntegrity,
      fontConsistencyScore: forensics.fontConsistencyScore,
      layoutAlignmentScore: forensics.layoutAlignmentScore,
    };
    const riskData = {
      compositeScore: risk.compositeScore,
      riskTier: risk.riskTier,
      positiveSignalsJson: JSON.stringify(risk.positiveSignals),
      reviewIndicatorsJson: JSON.stringify(risk.reviewIndicators),
    };
    // One transaction keeps evidence, extracted fields and triage in sync.
    const updated = await prisma.screeningSession.update({
      where: { id: session.id },
      data: {
        documentType: newDocType,
        riskScore: risk.compositeScore,
        riskTier: risk.riskTier,
        status:
          risk.riskTier === "HIGH_RISK"
            ? "FLAGGED"
            : risk.riskTier === "REVIEW_REQUIRED"
              ? "REQUIRES_REVIEW"
              : "COMPLETED",
        ocrResult: {
          update: { wordsJson: serializeOCREvidence(ocr, extraction.fields) },
        },
        extractedFields: {
          deleteMany: {},
          create: extraction.fields.map((f) => ({
            fieldKey: f.key,
            fieldLabel: f.label,
            rawValue: f.rawValue,
            maskedValue: f.maskedValue,
            isSensitive: f.isSensitive,
            confidence: f.confidence,
            validationStatus: f.validationStatus,
          })),
        },
        forensicAnomalies: {
          deleteMany: {},
          create: forensics.anomalies.map((a) => ({
            anomalyType: a.anomalyType,
            severity: a.severity,
            title: a.title,
            explanation: a.explanation,
            confidence: a.confidence,
          })),
        },
        documentAnalysis: {
          upsert: { create: qualityData, update: qualityData },
        },
        riskAssessment: { upsert: { create: riskData, update: riskData } },
      },
      include: {
        document: true,
        ocrResult: true,
        extractedFields: true,
        documentAnalysis: true,
        forensicAnomalies: true,
        riskAssessment: true,
      },
    });

    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      action: "DOCUMENT_TYPE_OVERRIDDEN",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Operator changed classification from ${session.documentType} to ${newDocType}.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Document classification updated to ${newDocType}. Fields re-extracted.`,
      data: presentScreening(updated),
    });
  } catch (error: any) {
    console.error("[OVERRIDE_TYPE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to override document type." },
      { status: 500 },
    );
  }
}
