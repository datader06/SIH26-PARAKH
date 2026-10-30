/** Real OCR/API verification. Creates records ONLY in an explicitly acknowledged isolated loopback app. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require("playwright");
const { directory } = require("../scripts/generate-video-demo-pack.cjs");
const baseURL = process.env.PARAKH_UI_TEST_URL;
assert.equal(process.env.PARAKH_UI_TEST_ISOLATED, "1");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname));
const manifest = JSON.parse(
  fs.readFileSync(path.join(directory, "MANIFEST.json"), "utf8"),
);
const password = fs
  .readFileSync(path.join(__dirname, "../src/lib/seed.ts"), "utf8")
  .match(/const defaultPassword = hashPassword\("([^"]+)"\)/)?.[1];
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = {
    verifiedAt: new Date().toISOString(),
    target: "Isolated temporary local app/database",
    engine: "Actual local Tesseract (no OCR stubs)",
    checks: [],
  };
  try {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    const login = await context.request.post("/api/auth/login", {
      data: { email: "admin@parakh-intel.org", password },
    });
    assert.equal(login.status(), 200);
    const create = await context.request.post("/api/institution-applications", {
      data: manifest.profile,
    });
    assert.equal(create.status(), 201);
    const app = (await create.json()).data;
    async function upload(d) {
      const bytes = fs.readFileSync(path.join(directory, d.file));
      assert.equal(
        crypto.createHash("sha256").update(bytes).digest("hex"),
        d.sha256,
      );
      const response = await context.request.post(
        `/api/institution-applications/${app.id}/documents`,
        {
          data: {
            category: d.category,
            fileName: path.basename(d.file),
            mimeType: "image/png",
            fileSize: bytes.length,
            base64Data: `data:image/png;base64,${bytes.toString("base64")}`,
            issueDate: d.issueDate,
            expiryDate: d.expiryDate,
            issuer: d.issuer,
            referenceNumber: d.referenceNumber,
          },
          timeout: 120000,
        },
      );
      assert.equal(response.status(), 201);
      const doc = (await response.json()).data;
      assert.equal(doc.ocrStatus, "EXTRACTED", d.file);
      assert.ok(
        doc.ocrTextPreview.includes(d.permanentId),
        `Actual OCR must read expected ID: ${d.file}`,
      );
      return doc;
    }
    async function validate() {
      const r = await context.request.post(
        `/api/institution-applications/${app.id}/validate`,
      );
      assert.equal(r.status(), 200);
      return (await r.json()).data;
    }
    const check = (name) => {
      results.checks.push({ name, status: "PASSED" });
      console.log("PASS " + name);
    };
    for (const d of manifest.documents.filter((d) => d.requiredForEOA))
      await upload(d);
    let summary = await validate();
    for (const category of [
      "PREVIOUS_EOA",
      "AFFIDAVIT",
      "FACULTY_DECLARATION",
      "TER_FEE_RECEIPT",
      "INFRASTRUCTURE_EVIDENCE",
    ])
      assert.ok(
        summary.findings.some(
          (f) =>
            f.ruleId ===
              `RULE_MANDATORY_${{ PREVIOUS_EOA: "PREVIOUS_EOA", AFFIDAVIT: "AFFIDAVIT", FACULTY_DECLARATION: "FACULTY_DECLARATION", TER_FEE_RECEIPT: "TER_FEE", INFRASTRUCTURE_EVIDENCE: "INFRA_EVIDENCE" }[category]}` &&
            f.status === "PASSED",
        ),
      );
    assert.equal(
      summary.findings.find(
        (f) => f.ruleId === "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
      )?.status,
      "PASSED",
    );
    assert.equal(summary.failedCount, 0);
    results.baseline = {
      complianceScore: summary.complianceScore,
      passedCount: summary.passedCount,
      failedCount: summary.failedCount,
      warningCount: summary.warningCount,
      manualReviewCount: summary.manualReviewCount,
    };
    check(
      "All five required PNGs are OCR-readable and declared ID/mandatory checks pass",
    );
    const page = await context.newPage();
    await page.goto(`/applications/${app.id}`);
    await page
      .getByText("Cross-Document Identifier Consistency Confirmed", {
        exact: true,
      })
      .waitFor();
    for (const d of manifest.documents.filter((d) =>
      d.file.startsWith("02-optional-support/"),
    ))
      await upload(d);
    summary = await validate();
    assert.equal(
      summary.findings.find(
        (f) => f.ruleId === "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
      )?.status,
      "PASSED",
    );
    check(
      "All five optional documents are OCR-readable and preserve ID consistency",
    );
    await upload(
      manifest.documents.find((d) =>
        d.file.includes("02-expired-accreditation"),
      ),
    );
    summary = await validate();
    assert.ok(
      summary.findings.some(
        (f) => f.ruleId === "RULE_DOC_EXPIRY" && f.status === "FAILED",
      ),
    );
    check("Expired metadata fixture produces document expiry failure");
    await upload(
      manifest.documents.find((d) => d.file.includes("03-invalid-date-noc")),
    );
    summary = await validate();
    assert.ok(
      summary.findings.some(
        (f) =>
          f.ruleId === "RULE_DOCUMENT_DATE_METADATA_INTEGRITY" &&
          f.status === "FAILED",
      ),
    );
    check("Issue-after-expiry fixture produces date metadata failure");
    const duplicate = await upload(
      manifest.documents.find((d) => d.duplicateOf),
    );
    assert.equal(duplicate.isDuplicate, true);
    summary = await validate();
    assert.ok(
      summary.findings.some(
        (f) => f.ruleId === "RULE_DUPLICATE_EVIDENCE" && f.status === "WARNING",
      ),
    );
    check(
      "Byte-identical fee receipt produces actual SHA-256 duplicate warning",
    );
    await upload(
      manifest.documents.find((d) => d.file.includes("01-affidavit-wrong-id")),
    );
    summary = await validate();
    const mismatch = summary.findings.find(
      (f) => f.ruleId === "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
    );
    assert.equal(mismatch?.status, "MANUAL_REVIEW_REQUIRED");
    assert.equal(mismatch?.severity, "HIGH");
    assert.ok(mismatch.reason.includes("1-87654321"));
    await page.reload();
    await page
      .getByText("Cross-Document Permanent ID Inconsistency Detected", {
        exact: true,
      })
      .waitFor();
    const report = await context.request.get(
      `/api/institution-applications/${app.id}/report`,
    );
    assert.equal(report.status(), 200);
    assert.ok(
      JSON.stringify(await report.json()).includes(
        "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
      ),
    );
    check(
      "Wrong-ID affidavit produces HIGH manual review, rendered finding and dossier export",
    );
    fs.writeFileSync(
      path.join(directory, "VERIFICATION-RESULTS.json"),
      JSON.stringify(results, null, 2) + "\n",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
