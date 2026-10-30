import type { ParsedField } from "../extractors/aadhaar";
import type { OCRResponse, OCRWord } from "./provider.interface";

export const OCR_ANALYSIS_VERSION = 2;
export interface FieldEvidence {
  key: string;
  confidence: number;
  confidenceSource: "OCR_WORDS" | "UNAVAILABLE";
  wordIndices: number[];
}
export interface StoredOCREvidence {
  version: number;
  words: OCRWord[];
  fields: FieldEvidence[];
  confidenceAvailable: boolean;
  imageDimensions?: { width: number; height: number };
}

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toUpperCase()
    .replace(new RegExp("[^\\p{L}\\p{M}\\p{N}]", "gu"), "");
export const roundConfidence = (value: number) =>
  Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;

export function averageWordConfidence(words: OCRWord[]): number | null {
  let total = 0;
  let weight = 0;
  for (const word of words) {
    if (
      typeof word.confidence !== "number" ||
      !Number.isFinite(word.confidence)
    )
      continue;
    const length = Math.max(1, normalize(word.text).length);
    total += Math.max(0, Math.min(100, word.confidence)) * length;
    weight += length;
  }
  return weight ? roundConfidence(total / weight) : null;
}

// Exact, contiguous OCR evidence only. An ambiguous/missing match is unavailable,
// never replaced with a parser constant or document-level average.
export function measureFieldEvidence(
  field: ParsedField,
  words: OCRWord[],
): FieldEvidence {
  const target = normalize(field.sourceText || field.rawValue);
  const unavailable: FieldEvidence = {
    key: field.key,
    confidence: 0,
    confidenceSource: "UNAVAILABLE",
    wordIndices: [],
  };
  if (!target) return unavailable;
  const matches: number[][] = [];
  for (let start = 0; start < words.length; start++) {
    if (!normalize(words[start].text)) continue;
    let combined = "";
    const indices: number[] = [];
    for (let end = start; end < words.length && end < start + 50; end++) {
      const part = normalize(words[end].text);
      if (!part) continue;
      combined += part;
      indices.push(end);
      if (combined === target) {
        matches.push([...indices]);
        break;
      }
      if (!target.startsWith(combined)) break;
    }
  }
  if (matches.length !== 1) return unavailable;
  const matched = matches[0].map((index) => words[index]);
  if (matched.some((word) => word.confidence === null)) return unavailable;
  const confidence = averageWordConfidence(matched);
  return confidence === null
    ? unavailable
    : {
        key: field.key,
        confidence,
        confidenceSource: "OCR_WORDS",
        wordIndices: matches[0],
      };
}

export function attachFieldEvidence(
  fields: ParsedField[],
  ocr?: OCRResponse,
): ParsedField[] {
  return fields.map((field) => ({
    ...field,
    ...measureFieldEvidence(field, ocr?.words || []),
  }));
}

export function serializeOCREvidence(
  ocr: OCRResponse,
  fields: ParsedField[],
): string {
  return JSON.stringify({
    version: OCR_ANALYSIS_VERSION,
    words: ocr.words || [],
    confidenceAvailable:
      ocr.confidenceAvailable ??
      averageWordConfidence(ocr.words || []) !== null,
    imageDimensions: ocr.imageDimensions,
    fields: fields.map((field) => measureFieldEvidence(field, ocr.words || [])),
  } satisfies StoredOCREvidence);
}

export function readOCREvidence(
  value?: string | null,
): StoredOCREvidence | null {
  try {
    const parsed = JSON.parse(value || "null");
    if (
      parsed?.version !== OCR_ANALYSIS_VERSION ||
      !Array.isArray(parsed.words) ||
      !Array.isArray(parsed.fields)
    )
      return null;
    return parsed as StoredOCREvidence;
  } catch {
    return null;
  }
}

export function getOCRError(ocr: OCRResponse) {
  if (ocr.status === "FAILED" || ocr.provider === "OCR_ENGINE_UNAVAILABLE") {
    return {
      status: 503,
      error:
        "The OCR engine could not process this image. Retry or check the OCR service configuration.",
      code: "OCR_ENGINE_FAILED",
      provider: ocr.provider,
    };
  }
  if (!ocr.fullText.trim())
    return {
      status: 422,
      error:
        "No readable text was detected. Upload a clearer image of the document.",
      code: "OCR_NO_TEXT",
      provider: ocr.provider,
    };
  return null;
}

export function restoreOCRResponse(stored: {
  provider: string;
  fullText: string;
  averageConfidence: number;
  wordsCount: number;
  linesCount: number;
  executionTimeMs: number;
  wordsJson: string | null;
}): OCRResponse {
  const evidence = readOCREvidence(stored.wordsJson);
  let words = evidence?.words || [];
  if (!evidence) {
    try {
      const legacy = JSON.parse(stored.wordsJson || "null");
      if (Array.isArray(legacy))
        words = legacy.filter(
          (word) =>
            typeof word.text === "string" &&
            (word.confidence === null || typeof word.confidence === "number"),
        );
    } catch {
      /* Legacy records without word evidence remain unscored. */
    }
  }
  const average = averageWordConfidence(words);
  return {
    ...stored,
    words,
    averageConfidence: average ?? 0,
    imageDimensions: evidence?.imageDimensions,
    confidenceAvailable: average !== null,
  };
}

// Read-side provenance also protects old records: old extractor constants and
// template boxes must never be relabeled as measured OCR or image forensics.
export function presentScreening<
  T extends {
    ocrResult?: { wordsJson: string | null } | null;
    extractedFields?: Array<{ fieldKey: string; confidence: number }>;
  },
>(session: T) {
  const evidence = readOCREvidence(session.ocrResult?.wordsJson);
  return {
    ...session,
    analysisVersion: evidence?.version || 1,
    ocrConfidenceAvailable: evidence?.confidenceAvailable ?? false,
    classificationMethod: "TEXT_PATTERN_HEURISTIC" as const,
    pixelForensicsAvailable: false,
    extractedFields: session.extractedFields?.map((field) => {
      const measured = evidence?.fields.find(
        (item) => item.key === field.fieldKey,
      );
      return {
        ...field,
        confidence: measured?.confidence ?? 0,
        confidenceSource: measured?.confidenceSource || "UNAVAILABLE",
      };
    }),
  };
}
