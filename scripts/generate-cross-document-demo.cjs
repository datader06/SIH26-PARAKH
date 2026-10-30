/** Generate original, clearly labelled PNG fixtures for the existing cross-document workflow. */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const directory = path.resolve(__dirname, "../tests/fixtures/cross-document");
const specimens = [
  {
    file: "01-eoa-matching.png",
    title: "PREVIOUS EOA - DEMO EVIDENCE",
    id: "1-12345678",
    detail: "Previous approval reference: DEMO-EOA-2026",
  },
  {
    file: "02-affidavit-matching.png",
    title: "AFFIDAVIT - DEMO EVIDENCE",
    id: "1-12345678",
    detail: "Declaration reference: DEMO-AFFIDAVIT-2026",
  },
  {
    file: "03-affidavit-mismatch.png",
    title: "AFFIDAVIT - MISMATCH TEST",
    id: "1-87654321",
    detail: "Intentional Permanent ID mismatch for demonstration",
  },
];
async function generate() {
  fs.mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 900 },
      deviceScaleFactor: 1,
    });
    for (const s of specimens) {
      await page.setContent(
        `<html><head><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#152c30;font:32px monospace;padding:75px}.notice{font-size:24px;color:#9c432d;border-bottom:3px solid #9c432d;padding-bottom:25px}h1{font-size:38px;margin:60px 0 45px}p{line-height:1.6;margin:18px 0}footer{margin-top:65px;font-size:23px;color:#53666a}</style></head><body><div class="notice">SYNTHETIC DEMO - NOT AN OFFICIAL DOCUMENT</div><h1>${s.title}</h1><p>PARAKH DEMO INSTITUTE</p><p>AICTE Permanent ID: ${s.id}</p><p>Academic Year: 2026-2027</p><p>${s.detail}</p><footer>For PARAKH workflow demonstration only.<br>No government approval, stamp or signature is claimed.</footer></body></html>`,
      );
      await page.screenshot({ path: path.join(directory, s.file) });
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Generated 3 synthetic PNG fixtures in tests/fixtures/cross-document",
  );
}
if (require.main === module)
  generate().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
module.exports = { generate, directory };
