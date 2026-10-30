/** Isolated local DB only: PARAKH_UI_TEST_ISOLATED=1 PARAKH_UI_TEST_URL=http://127.0.0.1:3101 node tests/ocr-pipeline-smoke.cjs */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const baseURL = process.env.PARAKH_UI_TEST_URL;
assert.equal(process.env.PARAKH_UI_TEST_ISOLATED, "1");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname));
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
    const page = await context.newPage();
    await page.goto("/scanner");
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/screenings") &&
          r.request().method() === "POST",
        { timeout: 120000 },
      ),
      page.getByRole("button", { name: "AADHAAR", exact: true }).click(),
    ]);
    const json = await response.json();
    assert.equal(response.status(), 200, json.error);
    const s = json.data;
    assert.equal(s.ocrResult.provider, "TESSERACT_LOCAL");
    assert.equal(s.analysisVersion, 2);
    const evidence = JSON.parse(s.ocrResult.wordsJson);
    assert.ok(evidence.words.length > 10, "Real OCR word output exists");
    assert.equal(evidence.imageDimensions.width, 1200);
    assert.equal(evidence.imageDimensions.height, 1200);
    assert.equal(
      s.document.sha256Hash,
      require("node:crypto")
        .createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(__dirname, "../src/assets/demo/aadhaar-example.png"),
          ),
        )
        .digest("hex"),
      "The exact supplied image reaches OCR unchanged",
    );
    assert.equal(
      s.extractedFields.find((f) => f.fieldKey === "holder_name")?.rawValue,
      "RAHUL KUMAR",
    );
    assert.equal(
      s.extractedFields.find((f) => f.fieldKey === "dob")?.rawValue,
      "15-08-1994",
    );
    assert.equal(
      s.extractedFields.find((f) => f.fieldKey === "gender")?.rawValue,
      "MALE",
    );
    assert.equal(
      s.extractedFields.find((f) => f.fieldKey === "aadhaar_number")
        ?.validationStatus,
      "WARNING",
      "Illustrative placeholder identifier must not be certified valid",
    );
    assert.ok(
      s.forensicAnomalies.every((a) => !a.boundingBox),
      "No invented image regions",
    );
    const measured = s.extractedFields.filter(
      (f) => f.confidenceSource === "OCR_WORDS",
    );
    assert.ok(measured.length >= 3);
    for (const f of measured)
      assert.equal(
        f.confidence,
        evidence.fields.find((item) => item.key === f.fieldKey).confidence,
      );
    assert.ok(
      new Set(evidence.words.map((w) => w.confidence)).size > 2,
      "Confidence varies with actual OCR output",
    );
    await page.getByText("RAHUL KUMAR", { exact: true }).waitFor();
    assert.ok(!(await page.locator("main").innerText()).includes("% match"));
    assert.equal(
      await page.getByText("Inspection Zone", { exact: true }).count(),
      0,
    );
    await page.getByRole("tab", { name: "Raw OCR Text", exact: true }).click();
    assert.ok(
      (await page.getByRole("tabpanel").innerText()).includes(
        "TESSERACT_LOCAL",
      ),
    );
    console.log(
      `PASS real Tesseract image pipeline: ${evidence.words.length} words, ${measured.length} evidence-backed fields, exact supplied image, actual 1200x1200 dimensions, extracted name/DOB/gender, no fake regions`,
    );
    const override = await context.request.post(
      `/api/screenings/${s.id}/override-type`,
      { data: { documentType: "UNKNOWN" } },
    );
    assert.equal(override.status(), 200);
    const changed = (await override.json()).data;
    assert.equal(changed.documentType, "UNKNOWN");
    assert.equal(
      JSON.parse(changed.ocrResult.wordsJson).fields.length,
      changed.extractedFields.length,
    );
    assert.equal(changed.riskAssessment.compositeScore, changed.riskScore);
    const invalid = await context.request.post(
      `/api/screenings/${s.id}/override-type`,
      { data: { documentType: "MADE_UP" } },
    );
    assert.equal(invalid.status(), 400);
    console.log(
      "PASS document override recalculates evidence, findings and risk atomically",
    );
    const blank = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 1000;
      c.height = 630;
      const x = c.getContext("2d");
      x.fillStyle = "white";
      x.fillRect(0, 0, 1000, 630);
      return c.toDataURL("image/png");
    });
    const empty = await context.request.post("/api/screenings", {
      data: { image: blank, mimeType: "image/png" },
      timeout: 120000,
    });
    assert.equal(empty.status(), 422);
    assert.equal((await empty.json()).code, "OCR_NO_TEXT");
    console.log(
      "PASS real blank-image OCR returns 422 instead of a fabricated success",
    );
    await page.goto("/scanner");
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/screenings") &&
          r.request().method() === "POST",
        { timeout: 120000 },
      ),
      page.getByRole("button", { name: "AADHAAR", exact: true }).click(),
    ]);
    await page
      .getByRole("tab", { name: "Extracted Information", exact: true })
      .waitFor();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `Overflow at ${width}px`,
      );
    }
    await page.screenshot({
      path: path.join(require("node:os").tmpdir(), "parakh-ocr-fixed.png"),
      fullPage: true,
    });
    console.log(
      "PASS result UI responsive at 390/768/1440px; screenshot saved in temp",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
