import assert from "node:assert/strict";
import {
  evaluateRegulatoryRules,
  type AppEvaluationContext,
} from "../src/lib/aicte/ruleset";
const base: AppEvaluationContext = {
  applicationNumber: "DEMO-CROSS-DOC",
  institutionName: "PARAKH DEMO INSTITUTE",
  permanentId: "1-12345678",
  applicationCategory: "EXTENSION_OF_APPROVAL",
  academicYear: "2026-2027",
  previousApprovalStatus: "APPROVED",
  institutionRecordStatus: "ACTIVE",
  terFeeStatus: "PAID",
  approvedIntake: 60,
  requestedIntake: 60,
  facultyCount: 10,
  requiredFacultyCount: 4,
  infrastructureSubmitted: true,
  documents: [],
};
const doc = (
  id: string,
  permanentId: string,
): AppEvaluationContext["documents"][number] => ({
  id,
  category: "AFFIDAVIT",
  fileName: `${id}.png`,
  sha256Hash: id,
  ocrStatus: "EXTRACTED",
  ocrText: `DEMO INSTITUTE DOCUMENT. AICTE Permanent ID: ${permanentId}`,
});
const cross = (documents: AppEvaluationContext["documents"]) =>
  evaluateRegulatoryRules({ ...base, documents }).findings.find(
    (f) => f.ruleId === "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
  );
assert.equal(cross([doc("one", "1-12345678")]), undefined);
assert.equal(
  cross([
    doc("one", "1-12345678"),
    {
      ...doc("two", ""),
      ocrText: "OCR text without any readable Permanent ID",
    },
  ]),
  undefined,
);
assert.equal(
  cross([doc("one", "1-12345678"), doc("two", "1-12345678")])?.status,
  "PASSED",
);
assert.equal(
  cross([doc("one", "1-12345678"), doc("two", "1-87654321")])?.status,
  "MANUAL_REVIEW_REQUIRED",
);
assert.equal(
  cross([doc("one", "1-87654321"), doc("two", "1-87654321")])?.status,
  "MANUAL_REVIEW_REQUIRED",
  "Comparison includes the declared application ID, not just mutual agreement",
);
const impossible = {
  ...doc("dates", "1-12345678"),
  issueDate: new Date("2031-01-01"),
  expiryDate: new Date("2030-01-01"),
};
assert.equal(
  evaluateRegulatoryRules({ ...base, documents: [impossible] }).findings.find(
    (f) => f.ruleId === "RULE_DOCUMENT_DATE_METADATA_INTEGRITY",
  )?.status,
  "FAILED",
);
console.log(
  "PASS cross-document matching, mismatching, insufficient IDs, declared-ID boundaries and impossible date metadata",
);
