/** Mutates an isolated LOCAL database only. Run with PARAKH_UI_TEST_ISOLATED=1 and PARAKH_UI_TEST_URL. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { directory } = require("../scripts/generate-cross-document-demo.cjs");
const baseURL = process.env.PARAKH_UI_TEST_URL;
assert.equal(
  process.env.PARAKH_UI_TEST_ISOLATED,
  "1",
  "Isolated DB acknowledgement required",
);
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname),
  "Loopback URL required",
);
const password = fs
  .readFileSync(path.join(__dirname, "../src/lib/seed.ts"), "utf8")
  .match(/const defaultPassword = hashPassword\("([^"]+)"\)/)?.[1];
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    const login = await context.request.post("/api/auth/login", {
      data: { email: "admin@parakh-intel.org", password },
    });
    assert.equal(login.status(), 200);
    const created = await context.request.post(
      "/api/institution-applications",
      {
        data: {
          institutionName: "PARAKH DEMO INSTITUTE",
          permanentId: "1-12345678",
          applicationCategory: "EXTENSION_OF_APPROVAL",
          academicYear: "2026-2027",
        },
      },
    );
    assert.equal(created.status(), 201);
    const app = (await created.json()).data;
    const page = await context.newPage();
    async function upload(fileName, category) {
      const bytes = fs.readFileSync(path.join(directory, fileName));
      const response = await context.request.post(
        `/api/institution-applications/${app.id}/documents`,
        {
          data: {
            category,
            fileName,
            mimeType: "image/png",
            fileSize: bytes.length,
            base64Data: `data:image/png;base64,${bytes.toString("base64")}`,
          },
          timeout: 120000,
        },
      );
      assert.equal(response.status(), 201);
      assert.equal((await response.json()).data.ocrStatus, "EXTRACTED");
    }
    async function validate() {
      const response = await context.request.post(
        `/api/institution-applications/${app.id}/validate`,
      );
      assert.equal(response.status(), 200);
      return (await response.json()).data.findings.find(
        (f) => f.ruleId === "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
      );
    }
    await upload("01-eoa-matching.png", "PREVIOUS_EOA");
    assert.equal(
      await validate(),
      undefined,
      "One readable document is insufficient for comparison",
    );
    console.log(
      "PASS single-document comparison is not falsely reported as passed",
    );
    await upload("02-affidavit-matching.png", "AFFIDAVIT");
    assert.equal((await validate()).status, "PASSED");
    console.log("PASS two actual OCR uploads with matching IDs produce PASSED");
    await page.goto(`/applications/${app.id}`);
    await page
      .getByText("Cross-Document Identifier Consistency Confirmed", {
        exact: true,
      })
      .waitFor();
    await upload("03-affidavit-mismatch.png", "AFFIDAVIT");
    const mismatch = await validate();
    assert.equal(mismatch.status, "MANUAL_REVIEW_REQUIRED");
    assert.equal(mismatch.severity, "HIGH");
    assert.ok(mismatch.reason.includes("1-87654321"));
    await page.reload();
    await page
      .getByText("Cross-Document Permanent ID Inconsistency Detected", {
        exact: true,
      })
      .waitFor();
    await page
      .getByText("Cross-Document Permanent ID Inconsistency Detected", {
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(
        require("node:os").tmpdir(),
        "parakh-cross-document-demo.png",
      ),
      fullPage: true,
    });
    const insights = await (
      await context.request.get("/api/institution-applications/insights")
    ).json();
    assert.ok(insights.data.crossDocumentFlaggedCount > 0);
    console.log(
      "PASS mismatched actual OCR upload produces HIGH manual review; finding visible in UI and insights flag count",
    );
    const report = await context.request.get(
      `/api/institution-applications/${app.id}/report`,
    );
    assert.equal(report.status(), 200);
    assert.ok(
      JSON.stringify(await report.json()).includes(
        "RULE_CROSS_DOCUMENT_ID_CONSISTENCY",
      ),
    );
    console.log("PASS exported dossier includes cross-document finding");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
