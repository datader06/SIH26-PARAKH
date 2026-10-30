/** Run only against an isolated local database/server, never a deployed app.
 * PARAKH_UI_TEST_ISOLATED=1 PARAKH_UI_TEST_URL=http://127.0.0.1:3100 node tests/ui-redesign-smoke.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const baseURL = process.env.PARAKH_UI_TEST_URL || "http://127.0.0.1:3100";
const target = new URL(baseURL);
assert.equal(
  process.env.PARAKH_UI_TEST_ISOLATED,
  "1",
  "Explicit isolated-database acknowledgement required",
);
assert.ok(
  ["127.0.0.1", "localhost"].includes(target.hostname),
  "Only loopback test servers are allowed",
);
// Read the repository's demo fixture in memory; never log credentials/cookies.
const seed = fs.readFileSync(
  path.join(__dirname, "../src/lib/seed.ts"),
  "utf8",
);
const password = seed.match(
  /const defaultPassword = hashPassword\("([^"]+)"\)/,
)?.[1];
assert.ok(password, "Demo seed fixture must exist");
const findings = [];
async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => findings.push(error.message));
  page.on("console", (message) => {
    if (
      /hydration|Extra attributes from the server|cannot be a child|Missing.*Description|Each child.*key/.test(
        message.text(),
      )
    )
      findings.push(message.text().split("\n")[0]);
  });
  async function visit(route) {
    const response = await page.goto(route);
    assert.equal(response.status(), 200, route);
    await page
      .locator("h1")
      .first()
      .waitFor({ timeout: 10000 })
      .catch(() => {
        throw new Error(`Missing visible h1 on ${route}`);
      });
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `Overflow: ${route}`,
    );
  }
  try {
    await visit("/");
    await page.locator("#workflow-tab-0").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.locator("#workflow-tab-1").getAttribute("aria-selected"),
      "true",
    );
    await page.locator(".landing-signin").click();
    for (const role of [
      "operator",
      "investigator",
      "reviewer",
      "administrator",
    ]) {
      await page.locator("#login-role").selectOption(role);
      assert.equal(
        await page.locator("#login-email").inputValue(),
        `${role === "administrator" ? "admin" : role}@parakh-intel.org`,
      );
      assert.equal(
        await page.locator("#login-password").inputValue(),
        password,
        "Demo role fills in the existing demo password",
      );
    }
    await page.getByRole("dialog").waitFor();
    for (let i = 0; i < 9; i++) await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        Boolean(document.activeElement.closest('[role="dialog"]')),
      ),
      true,
      "Sign-in focus is trapped",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => document.activeElement?.matches(".landing-signin"),
      { timeout: 2000 },
    );
    assert.equal(
      await page
        .locator(".landing-signin")
        .evaluate((element) => element === document.activeElement),
      true,
      "Focus returns to opener",
    );
    await page.locator(".landing-signin").click();
    await page.getByLabel("Institutional email").fill("admin@parakh-intel.org");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await page.waitForURL("**/dashboard");
    await page
      .getByRole("heading", { name: "Organization Overview" })
      .waitFor();
    console.log("PASS landing tabs, dialog focus/Escape/return, real sign-in");

    const applications = await (
      await context.request.get("/api/institution-applications")
    ).json();
    const screenings = await (
      await context.request.get("/api/screenings")
    ).json();
    assert.ok(
      applications.data.length && screenings.data.length,
      "Isolated demo records were seeded",
    );
    const routes = [
      "/dashboard",
      "/applications",
      "/applications/insights",
      `/applications/${applications.data[0].id}`,
      "/scanner",
      "/documents",
      "/reports",
      `/reports/${screenings.data[0].id}`,
      "/activity",
      "/api-access",
      "/team",
      "/security",
      "/settings",
      "/integrations",
      "/verification",
    ];
    for (const route of routes) await visit(route);
    console.log(
      `PASS all ${routes.length} operational routes without page errors or body overflow`,
    );

    await visit("/applications");
    await page.getByRole("button", { name: "New application" }).click();
    await page
      .getByLabel("Institution Name", { exact: false })
      .fill("UI smoke test institution");
    await page
      .getByLabel("AICTE Permanent ID", { exact: false })
      .fill("1-UI-SMOKE");
    const [create] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/institution-applications") &&
          response.request().method() === "POST",
      ),
      page.getByRole("dialog").locator('button[type="submit"]').click(),
    ]);
    assert.equal(create.status(), 201, "Case created from accessible form");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    console.log("PASS institutional case creation retains real API contract");

    await page.route("**/api/institution-applications?**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Isolated test error" }),
      }),
    );
    await page.reload();
    await page
      .getByRole("alert")
      .filter({ hasText: "Isolated test error" })
      .waitFor();
    await page.unroute("**/api/institution-applications?**");
    console.log("PASS visible API error state (test-only network fixture)");

    await visit("/scanner");
    const [screening] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/screenings") &&
          response.request().method() === "POST",
        { timeout: 90000 },
      ),
      page.getByRole("button", { name: "PAN", exact: true }).click(),
    ]);
    assert.ok(
      screening.ok(),
      "Synthetic image completes real local OCR pipeline",
    );
    const fieldsTab = page.getByRole("tab", { name: "Extracted Information" });
    await fieldsTab.waitFor();
    await fieldsTab.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page
        .getByRole("tab", { name: "Document Forensics" })
        .getAttribute("aria-selected"),
      "true",
    );
    await page.getByRole("tab", { name: "Raw OCR Text" }).click();
    assert.equal(await page.getByRole("tabpanel").count(), 1);
    console.log(
      "PASS real synthetic-image OCR, readable inspection tabs and keyboard switching",
    );

    const roles = {
      operator: "My Workspace",
      investigator: "Investigation",
      reviewer: "Review",
    };
    for (const role of Object.keys(roles)) {
      const login = await context.request.post("/api/auth/login", {
        data: { email: `${role}@parakh-intel.org`, password },
      });
      assert.equal(login.status(), 200);
      await visit("/dashboard");
      const dashboard = await (
        await context.request.get("/api/dashboard")
      ).json();
      assert.equal(dashboard.data.role, role.toUpperCase());
      assert.ok((await page.locator("main h1").innerText()).length > 3);
      await visit(`/applications/${applications.data[0].id}`);
      if (role === "operator") {
        const reviewActions = page.getByRole("button", {
          name: /Reviewer Action|Record Manual/i,
        });
        for (const action of await reviewActions.all()) {
          assert.equal(
            await action.isDisabled(),
            true,
            "Operator review actions are disabled",
          );
        }
      }
    }
    console.log(
      "PASS four real role sessions, dashboard contracts and operator review affordances",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of [
      "/",
      "/dashboard",
      "/applications",
      "/scanner",
      "/settings",
    ])
      await visit(route);
    await page
      .getByRole("button", { name: "Open workspace navigation" })
      .click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 768, height: 1024 });
    for (const route of ["/dashboard", "/applications", "/scanner"])
      await visit(route);
    assert.deepEqual(
      findings,
      [],
      "No runtime/hydration/dialog description warnings",
    );
    console.log(
      "PASS mobile/tablet containment, mobile dialog, reduced-motion route rendering",
    );

    // Pointer-only dialog motion must not delay keyboard interactions.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await visit("/applications");
    const newCase = page.getByRole("button", { name: "New application" });
    await newCase.click();
    assert.equal(
      await page
        .locator(".dialog-panel")
        .evaluate((element) => getComputedStyle(element).animationName),
      "dialog-enter",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await newCase.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page
        .locator(".dialog-panel")
        .evaluate((element) => getComputedStyle(element).animationName),
      "none",
    );
    await page.keyboard.press("Escape");
    console.log(
      "PASS pointer dialog animation and instant keyboard dialog interaction",
    );
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
