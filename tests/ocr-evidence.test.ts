import assert from "node:assert/strict";
import { extractFieldsForDocument } from "../src/lib/extractors";
import {
  extractAadhaarFields,
  isNameCandidate,
} from "../src/lib/extractors/aadhaar";
import {
  averageWordConfidence,
  measureFieldEvidence,
  serializeOCREvidence,
  presentScreening,
  getOCRError,
} from "../src/lib/ocr/evidence";
import { parseCloudVisionAnnotation } from "../src/lib/ocr/cloud-vision.provider";
import { analyzeForensics } from "../src/lib/forensics/forensic-detector";
import { assessImageQuality } from "../src/lib/forensics/image-quality";
import { DocumentClassifier } from "../src/lib/classifier/document-classifier";
import type { OCRResponse } from "../src/lib/ocr/provider.interface";
const sample =
  "GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY OF INDIA\nAddress: Flat 402, Green Valley Apartments, Bandra West, Mumbai 400050\nDOB: 14/08/1986\nMALE\n5482 9102 3841\nMera Aadhaar, Meri Pehchan";
const fields = extractAadhaarFields(sample);
assert.equal(
  fields.some((f) => f.key === "holder_name"),
  false,
  "Address is never inferred as a name",
);
assert.equal(
  fields.find((f) => f.key === "address")?.rawValue,
  "Flat 402, Green Valley Apartments, Bandra West, Mumbai 400050",
);
assert.equal(
  extractAadhaarFields("Name: PRIYA NAIR\nDOB: 14/08/1986").find(
    (f) => f.key === "holder_name",
  )?.rawValue,
  "PRIYA NAIR",
);
assert.equal(
  extractAadhaarFields("PRIYA NAIR\nDOB: 14/08/1986").find(
    (f) => f.key === "holder_name",
  )?.rawValue,
  "PRIYA NAIR",
);
assert.equal(isNameCandidate("GOVERNMENT OF INDIA"), false);
assert.equal(isNameCandidate("Address: Flat 402"), false);
assert.equal(
  extractAadhaarFields("Name: PRIYA NAIR\nDOB: 31/02/1986").find(
    (f) => f.key === "dob",
  )?.validationStatus,
  "WARNING",
);
console.log("PASS conservative Aadhaar name/address/calendar parsing");
const ocr: OCRResponse = {
  provider: "TESSERACT_LOCAL",
  fullText: sample,
  averageConfidence: 77,
  confidenceAvailable: true,
  wordsCount: 3,
  linesCount: 3,
  executionTimeMs: 10,
  words: [
    { text: "5482", confidence: 60 },
    { text: "9102", confidence: 80 },
    { text: "3841", confidence: 100 },
  ],
  imageDimensions: { width: 1000, height: 630 },
};
const id = fields.find((f) => f.key === "aadhaar_number")!;
assert.equal(measureFieldEvidence(id, ocr.words!).confidence, 80);
assert.equal(
  measureFieldEvidence(id, ocr.words!).confidenceSource,
  "OCR_WORDS",
);
assert.equal(
  averageWordConfidence([
    { text: "AB", confidence: 50 },
    { text: "LONGER", confidence: 90 },
  ]),
  80,
);
assert.equal(
  measureFieldEvidence(id, [...ocr.words!, ...ocr.words!]).confidenceSource,
  "UNAVAILABLE",
);
assert.equal(
  measureFieldEvidence(id, [
    ...ocr.words!.slice(0, 2),
    { text: "3841", confidence: null },
  ]).confidenceSource,
  "UNAVAILABLE",
);
assert.equal(
  measureFieldEvidence(fields.find((f) => f.key === "dob")!, ocr.words!)
    .confidenceSource,
  "UNAVAILABLE",
);
for (const type of [
  "AADHAAR_CARD",
  "PAN_CARD",
  "PASSPORT",
  "DRIVING_LICENCE",
  "VOTER_ID",
  "UNKNOWN",
] as const)
  assert.ok(
    extractFieldsForDocument(type, sample).fields.every(
      (f) => f.confidence === 0 && f.confidenceSource === "UNAVAILABLE",
    ),
  );
const extracted = extractFieldsForDocument("AADHAAR_CARD", sample, ocr).fields;
const stored = serializeOCREvidence(ocr, extracted);
assert.equal(JSON.parse(stored).words.length, 3);
assert.equal(
  presentScreening({
    ocrResult: { wordsJson: stored },
    extractedFields: [{ fieldKey: id.key, confidence: 95 }],
  }).extractedFields?.[0].confidence,
  80,
);
assert.equal(
  presentScreening({
    ocrResult: { wordsJson: "[]" },
    extractedFields: [{ fieldKey: id.key, confidence: 95 }],
  }).extractedFields?.[0].confidenceSource,
  "UNAVAILABLE",
);
console.log(
  "PASS measured, weighted, ambiguous, missing and legacy OCR evidence",
);
const cloud = parseCloudVisionAnnotation({
  text: "TEST",
  pages: [
    {
      width: 800,
      height: 600,
      blocks: [
        {
          paragraphs: [
            { words: [{ symbols: [{ text: "TEST" }], confidence: 0.731 }] },
          ],
        },
      ],
    },
  ],
});
assert.equal(cloud.averageConfidence, 73.1);
assert.equal(cloud.words![0].confidence, 73.1);
assert.equal(
  parseCloudVisionAnnotation({ text: "TEST" }).confidenceAvailable,
  false,
);
assert.equal(getOCRError({ ...ocr, status: "FAILED" })?.status, 503);
assert.equal(getOCRError({ ...ocr, fullText: "   " })?.status, 422);
assert.equal(getOCRError(ocr), null);
assert.equal(DocumentClassifier.classify("").confidence, 0);
const forensics = analyzeForensics("AADHAAR_CARD", fields, 77, sample);
assert.ok(
  forensics.anomalies.every(
    (a) => !a.boundingBox && a.anomalyType === "FIELD_SYNTAX_WARNING",
  ),
);
assert.equal(forensics.fontConsistencyScore, 0);
assert.equal(assessImageQuality().resolutionStatus, "UNKNOWN");
assert.equal(assessImageQuality(1000, 630, 77, 100).brightnessScore, 0);
assert.equal(assessImageQuality(1000, 630, 77, 100).width, 1000);
console.log(
  "PASS actual cloud confidence, failure/no-text guards and honest forensic limits",
);
