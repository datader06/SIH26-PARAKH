export interface QualityAssessment {
  qualityScore: number; // 0 - 100
  blurIndex: number; // 0 - 100 (higher = sharper)
  glareIndex: number; // 0 - 100 (lower = less glare)
  brightnessScore: number; // 0 - 100 (optimal 45-65)
  contrastScore: number; // 0 - 100 (optimal > 50)
  resolutionStatus: "ADEQUATE" | "SUBOPTIMAL" | "HIGH_RESOLUTION" | "UNKNOWN";
  structuralIntegrity: "CONFIRMED" | "REVIEW_REQUIRED";
  width: number;
  height: number;
  recommendations: string[];
}

// Only dimensions and OCR confidence are available. These are not pixel metrics.
export function assessImageQuality(
  width = 0,
  height = 0,
  ocrConfidence = 0,
  textLength = 0,
): QualityAssessment {
  const hasDimensions =
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0;
  const resolutionStatus: QualityAssessment["resolutionStatus"] = !hasDimensions
    ? "UNKNOWN"
    : width * height >= 1200 * 800
      ? "HIGH_RESOLUTION"
      : width * height < 640 * 480
        ? "SUBOPTIMAL"
        : "ADEQUATE";
  const qualityScore =
    textLength > 0 ? Math.round(Math.max(0, Math.min(100, ocrConfidence))) : 0;
  return {
    qualityScore,
    blurIndex: 0,
    glareIndex: 0,
    brightnessScore: 0,
    contrastScore: 0,
    resolutionStatus,
    structuralIntegrity: "REVIEW_REQUIRED",
    width: hasDimensions ? width : 0,
    height: hasDimensions ? height : 0,
    recommendations: [
      "Quality score is an OCR-readability proxy only. Sharpness, glare, brightness, contrast and authenticity were not measured.",
    ],
  };
}
