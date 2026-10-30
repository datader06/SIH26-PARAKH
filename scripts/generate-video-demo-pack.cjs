const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require("playwright");
const directory = path.resolve(__dirname, "../tests/fixtures/video-demo-pack");
const profile = {
  institutionName: "PARAKH DEMO INSTITUTE",
  permanentId: "1-12345678",
  applicationCategory: "EXTENSION_OF_APPROVAL",
  academicYear: "2026-2027",
  previousApprovalRef: "DEMO-EOA-2025-001",
  previousApprovalStatus: "APPROVED",
  institutionRecordStatus: "ACTIVE",
  terFeeStatus: "PAID",
  terFeeReference: "DEMO-TER-2026-001",
  approvedIntake: 120,
  requestedIntake: 120,
  facultyCount: 6,
  requiredFacultyCount: 6,
  infrastructureSubmitted: false,
  reviewerNotes:
    "Synthetic video demonstration only. Declared statuses are not externally verified.",
};
const common = {
  permanentId: profile.permanentId,
  issueDate: "2026-06-01",
  expiryDate: "2027-05-31",
  issuer: "PARAKH DEMO INSTITUTE - synthetic fixture",
};
const documents = [
  {
    file: "01-previous-eoa",
    category: "PREVIOUS_EOA",
    title: "Previous Approval Reference Record",
    referenceNumber: profile.previousApprovalRef,
    issueDate: "2025-06-01",
    lines: [
      ["Reference academic year", "2025-2026"],
      ["Recorded reference", profile.previousApprovalRef],
      ["Application academic year", profile.academicYear],
      ["Recorded approved intake", "120 seats"],
      ["Reference status", "APPROVED - declared demo value"],
    ],
    paragraph:
      "This fictional archive summary supplies a previous approval reference for testing. It is not an AICTE approval order and conveys no approval.",
  },
  {
    file: "02-affidavit",
    category: "AFFIDAVIT",
    title: "Institutional Undertaking / Affidavit",
    referenceNumber: "DEMO-AFF-2026-001",
    lines: [
      ["Declaration reference", "DEMO-AFF-2026-001"],
      ["Authorized role", "Demo institutional representative"],
      ["Declared student intake", "120 seats"],
      ["Declared faculty strength", "6 faculty members"],
      ["Execution status", "UNEXECUTED DEMO - no notarization"],
    ],
    paragraph:
      "For this synthetic scenario, the representative declares that the institution name, Permanent ID, intake and faculty counts agree with the submitted application. This specimen is unsigned, unnotarized and not valid for legal submission.",
  },
  {
    file: "03-faculty-declaration",
    category: "FACULTY_DECLARATION",
    title: "Faculty Roster Declaration",
    referenceNumber: "DEMO-FAC-2026-001",
    lines: [
      ["Faculty count", "6"],
      ["Required faculty in application", "6"],
      ["Student intake", "120"],
      ["Demonstration ratio", "120 students / 6 faculty = 20:1"],
    ],
    roster: true,
    paragraph:
      "All roster entries are fictional labels. Credential verification, employment verification and any statutory eligibility determination remain outside this fixture.",
  },
  {
    file: "04-ter-fee-receipt",
    category: "TER_FEE_RECEIPT",
    title: "TER Fee Payment Record",
    referenceNumber: profile.terFeeReference,
    lines: [
      ["Transaction reference", profile.terFeeReference],
      ["Declared fee status", "PAID"],
      ["Illustrative amount", "INR 10,000 - arbitrary demo amount"],
      ["Payment date", "2026-06-01"],
      ["Reconciliation", "Not connected to a bank or payment gateway"],
    ],
    paragraph:
      "This is a fictional payment record for testing the receipt category. No money was transferred. The amount is not a statement of an official fee tariff.",
  },
  {
    file: "05-infrastructure-evidence",
    category: "INFRASTRUCTURE_EVIDENCE",
    title: "Infrastructure Evidence Schedule",
    referenceNumber: "DEMO-INFRA-2026-001",
    lines: [
      ["Classrooms", "4 demonstration rooms"],
      ["Laboratories", "2 demonstration labs"],
      ["Other facilities", "Library, accessible route and reception"],
      ["Evidence type", "Illustrative floor layout - not a site photograph"],
    ],
    plan: true,
    paragraph:
      "Schematic only. No geolocation, safety certification, physical inspection or facility capacity has been verified. The app can test attachment completeness; the diagram does not establish infrastructure compliance.",
  },
  {
    file: "06-noc-permission",
    category: "NOC_PERMISSION",
    title: "NOC / Affiliation Reference Specimen",
    referenceNumber: "DEMO-NOC-2026-001",
    optional: true,
    lines: [
      ["Reference", "DEMO-NOC-2026-001"],
      ["Requested programme", "B.Tech Computer Engineering - demo"],
      ["Proposed intake", "120 seats"],
      ["Authority response", "No external authority contacted"],
    ],
    paragraph:
      "Optional fictional reference for demonstrating NOC document intake in a New Programme case. This file does not issue permission or affiliation.",
  },
  {
    file: "07-programme-intake",
    category: "PROGRAMME_INTAKE_EVIDENCE",
    title: "Programme and Intake Statement",
    referenceNumber: "DEMO-INTAKE-2026-001",
    optional: true,
    lines: [
      ["Programme", "B.Tech Computer Engineering - demo"],
      ["Current approved intake", "120 - declared demo value"],
      ["Requested intake", "120"],
      ["Faculty available", "6"],
      ["Academic year", profile.academicYear],
    ],
    paragraph:
      "Optional intake evidence. The submitted figures are internally consistent with the demo profile and are not externally verified approval records.",
  },
  {
    file: "08-lease-property",
    category: "LEASE_PROPERTY_EVIDENCE",
    title: "Land / Property Reference Schedule",
    referenceNumber: "DEMO-LAND-2026-001",
    optional: true,
    lines: [
      ["Premises", "Demo Campus, Demonstration Road"],
      ["Reference", "DEMO-LAND-2026-001"],
      ["Use", "Educational premises - synthetic scenario"],
      ["Registration", "Not registered; no ownership is conveyed"],
    ],
    paragraph:
      "Optional fictional property-reference schedule for intake testing. This is not a lease, conveyance, registered deed or evidence of real ownership.",
  },
  {
    file: "09-accreditation",
    category: "ACCREDITATION_CERTIFICATE",
    title: "Accreditation Reference Specimen",
    referenceNumber: "DEMO-ACC-2026-001",
    optional: true,
    lines: [
      ["Reference", "DEMO-ACC-2026-001"],
      ["Accreditation status", "Not verified - fictional reference only"],
      ["Illustrative validity end", "2027-05-31"],
      ["Issuing authority", "No accreditation body contacted"],
    ],
    paragraph:
      "Optional intake fixture only. No accreditation grade, award or official certificate is claimed.",
  },
  {
    file: "10-application-cover",
    category: "OTHER",
    title: "Application Evidence Index",
    referenceNumber: "DEMO-COVER-2026-001",
    optional: true,
    lines: [
      ["Application category", "EXTENSION OF APPROVAL"],
      ["Previous reference", profile.previousApprovalRef],
      ["Fee reference", profile.terFeeReference],
      ["Approved / requested intake", "120 / 120"],
      ["Declared / required faculty", "6 / 6"],
    ],
    paragraph:
      "Evidence index: previous approval reference, affidavit, faculty roster, fee record and infrastructure schedule. Optional documents are included for other category demonstrations; they are not additional mandatory EoA requirements.",
  },
].map((d) => ({
  ...common,
  ...d,
  group: d.optional ? "02-optional-support" : "01-consistent-required",
}));
const negatives = [
  {
    ...documents[1],
    file: "01-affidavit-wrong-id",
    permanentId: "1-87654321",
    group: "03-negative-tests",
    title: "Affidavit - Intentional ID Conflict",
    referenceNumber: "DEMO-AFF-CONFLICT",
    paragraph:
      "Intentional mismatch fixture. All institution data except the Permanent ID follows the baseline. Upload after the matching pack to demonstrate a human-review flag.",
  },
  {
    ...documents[8],
    file: "02-expired-accreditation",
    group: "03-negative-tests",
    issueDate: "2024-06-01",
    expiryDate: "2025-05-31",
    referenceNumber: "DEMO-ACC-EXPIRED",
    title: "Accreditation - Expired Metadata Test",
    lines: [
      ["Recorded expiry", "2025-05-31"],
      ["Purpose", "Expired-document rule demonstration"],
      ["Status", "Fictional and intentionally expired"],
    ],
    paragraph:
      "Enter the issue and expiry dates from the manifest when uploading. The app checks entered expiry metadata; it does not prove those dates from OCR.",
  },
  {
    ...documents[5],
    file: "03-invalid-date-noc",
    group: "03-negative-tests",
    issueDate: "2032-01-01",
    expiryDate: "2031-01-01",
    referenceNumber: "DEMO-NOC-DATE-ERROR",
    title: "NOC - Impossible Date Range Test",
    lines: [
      ["Issue date", "2032-01-01"],
      ["Expiry date", "2031-01-01"],
      ["Purpose", "Issue date later than expiry date"],
    ],
    paragraph:
      "Intentional date-metadata error. Enter the same dates in the upload form. This does not demonstrate automatic date extraction or an authenticity decision.",
  },
];
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function render(d) {
  const rows = [
    ["Institution", profile.institutionName],
    ["Academic year", profile.academicYear],
    ["Issue date", d.issueDate],
    ["Expiry / review date", d.expiryDate],
    ...d.lines,
  ];
  const roster = d.roster
    ? '<table class="roster"><tr><th>Demo staff</th><th>Role</th></tr>' +
      Array.from(
        { length: 6 },
        (_, i) =>
          `<tr><td>Demo Faculty ${String(i + 1).padStart(2, "0")}</td><td>${i < 2 ? "Professor" : i < 4 ? "Associate Professor" : "Assistant Professor"}</td></tr>`,
      ).join("") +
      "</table>"
    : "";
  const plan = d.plan
    ? '<div class="plan"><div>CLASSROOM A</div><div>CLASSROOM B</div><div>CLASSROOM C</div><div>CLASSROOM D</div><div>LAB A</div><div>LAB B</div><div>LIBRARY</div><div>ACCESS ROUTE</div></div>'
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;width:1240px;background:#fff;color:#162d31;font-family:Arial,sans-serif}body{padding:66px 70px;min-height:1754px}.notice{font-size:23px;letter-spacing:1px;color:#aa4f31;border-bottom:4px solid #aa4f31;padding-bottom:21px;font-weight:700}.eyebrow{font-size:20px;margin-top:35px;color:#526a6c;letter-spacing:2px}h1{font-size:38px;line-height:1.2;margin:20px 0 30px}.pid{background:#edf2ed;padding:24px;font:700 41px monospace;margin-bottom:24px}.row{display:flex;padding:13px 0;border-bottom:1px solid #dde5e2;font-size:25px;line-height:1.35;gap:20px}.key{width:340px;flex-shrink:0;color:#526a6c}.value{font-weight:600;overflow-wrap:anywhere}p{font-size:25px;line-height:1.55;margin:30px 0}.roster{width:100%;border-collapse:collapse;margin-top:25px;font-size:23px}.roster th,.roster td{text-align:left;padding:10px 18px;border:1px solid #dbe3de}.plan{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:25px}.plan div{border:2px solid #667e79;padding:20px 5px;text-align:center;font-size:18px}footer{margin-top:32px;padding-top:19px;border-top:2px solid #dbe3de;font-size:21px;line-height:1.5;color:#526a6c}.execution{font-size:24px;font-weight:700;color:#aa4f31}</style></head><body><div class="notice">SYNTHETIC DEMO - NOT AN OFFICIAL DOCUMENT</div><div class="eyebrow">PARAKH VIDEO DEMONSTRATION / ${escape(d.category)}</div><h1>${escape(d.title)}</h1><div class="pid">AICTE Permanent ID: ${escape(d.permanentId)}</div>${rows.map(([k, v]) => `<div class="row"><div class="key">${escape(k)}</div><div class="value">${escape(v)}</div></div>`).join("")}${roster}${plan}<p>${escape(d.paragraph)}</p><div class="execution">DEMO ONLY - UNSIGNED - NO OFFICIAL SEAL</div><footer>Reference: ${escape(d.referenceNumber)}<br>Prepared for a fictional software demonstration on 2026-10-30.<br>Not valid for regulatory, legal, financial or identity submission.</footer></body></html>`;
}
async function generate() {
  fs.mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const manifest = {
    generatedOn: "2026-10-30",
    purpose: "Synthetic demonstration inputs; no official validity",
    primaryCategory: "EXTENSION_OF_APPROVAL",
    profile,
    documents: [],
  };
  try {
    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 1,
    });
    for (const d of [...documents, ...negatives]) {
      const group = path.join(directory, d.group);
      fs.mkdirSync(group, { recursive: true });
      await page.setContent(render(d));
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.body.scrollHeight > 1754,
      );
      if (overflow) throw new Error(`Demo page overflows: ${d.file}`);
      const png = path.join(group, d.file + ".png");
      await page.screenshot({ path: png });
      await page.pdf({
        path: path.join(group, d.file + ".pdf"),
        width: "1240px",
        height: "1754px",
        printBackground: true,
        pageRanges: "1",
        preferCSSPageSize: false,
      });
      manifest.documents.push({
        file: `${d.group}/${d.file}.png`,
        pdf: `${d.group}/${d.file}.pdf`,
        category: d.category,
        permanentId: d.permanentId,
        issueDate: d.issueDate,
        expiryDate: d.expiryDate,
        issuer: d.issuer,
        referenceNumber: d.referenceNumber,
        requiredForEOA: d.group === "01-consistent-required",
        sha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(png))
          .digest("hex"),
      });
    }
    // Duplicate fixture deliberately preserves the EXACT fee receipt bytes.
    const original = manifest.documents.find(
      (d) => d.category === "TER_FEE_RECEIPT",
    );
    const duplicate = "03-negative-tests/04-duplicate-fee-receipt.png";
    fs.copyFileSync(
      path.join(directory, original.file),
      path.join(directory, duplicate),
    );
    manifest.documents.push({
      ...original,
      file: duplicate,
      pdf: original.pdf,
      requiredForEOA: false,
      duplicateOf: original.file,
    });
    fs.writeFileSync(
      path.join(directory, "MANIFEST.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    fs.writeFileSync(
      path.join(directory, "APPLICATION-PROFILE.json"),
      JSON.stringify(profile, null, 2) + "\n",
    );
    const fields = [
      "file",
      "category",
      "issueDate",
      "expiryDate",
      "issuer",
      "referenceNumber",
    ];
    const csv = [
      fields.join(","),
      ...manifest.documents.map((d) =>
        fields
          .map((f) => '"' + String(d[f] ?? "").replace(/"/g, '""') + '"')
          .join(","),
      ),
    ].join("\r\n");
    fs.writeFileSync(path.join(directory, "UPLOAD-MAP.csv"), csv + "\r\n");
  } finally {
    await browser.close();
  }
  console.log(
    "Generated complete demo kit: 10 consistent documents (5 required + 5 optional), 4 negative tests, PNG/PDF and manifests.",
  );
  return manifest;
}
if (require.main === module)
  generate().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
module.exports = { generate, directory, profile };
