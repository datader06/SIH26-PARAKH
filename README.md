# PARAKH

**AI-powered application validation, document authentication, and regulatory compliance verification — built for SIH26261 (AICTE / Regulation Bureau).**

PARAKH (Hindi: परख — *scrutiny, assessment*) is a decision-support platform that helps AICTE's Regulation Bureau pre-screen Extension of Approval, New Programme, Intake Variation, and Approval Change applications before they reach a human scrutiny committee. It checks submitted documents against regulatory checklists, extracts and cross-validates their content, flags inconsistencies, and tracks issuer-side verification — all while staying explicit that every output is advisory, never a statutory decision.

A second, originally-standalone module (identity document screening for Aadhaar/PAN/Passport/DL/Voter ID) ships alongside it and shares the OCR/risk-scoring infrastructure, but the AICTE workspace at `/applications` is the actual problem-statement deliverable.

---

## What this actually does, honestly

Most README's for a prototype like this oversell. Here's what's real versus what's intentionally stubbed, so nobody — including a future contributor — has to go read the source to find out.

**Real and working:**
- Category-aware document checklists (4 AICTE application types), each citing a specific APH 2024-27 clause
- A 13-rule compliance engine: missing/expired documents, TER fee status, faculty-to-intake ratio math, duplicate-file detection via SHA-256, OCR-vs-declared-record cross-check, and **cross-document consistency checking** — comparing extracted identifiers and date metadata *between* a case's own documents, not just against the declared record
- Genuine OCR (Tesseract, running server-side) with structured field extraction and government-ID checksum validation (Aadhaar Verhoeff, PAN/EPIC formats, ICAO 9303 MRZ)
- An issuer-verification adapter that is honest about its own limits: without real gateway credentials it returns `SOURCE_UNAVAILABLE` and requests manual review, rather than faking a result
- Role-based access control, immutable audit logging, and a Portfolio Insights dashboard (`/applications/insights`) that surfaces portfolio-wide patterns — most frequent deficiency types, score distribution, verification coverage, and a reviewer triage queue — distinct from the per-case view

**Deliberately not real (and shouldn't be, per the problem statement's own constraints):**
- No live connection to any AICTE/government database — the problem statement explicitly says not to assume that access exists
- No real DSC/PKI digital-signature verification — would require a government-issued trust chain this project has no access to

**Known gaps, not yet closed:**
- PDF documents are not OCR'd (only images are) — most real AICTE evidence is PDF, so this meaningfully limits automated cross-checking on real submissions today
- The regulatory ruleset is hardcoded in `src/lib/aicte/ruleset.ts`, not database-configurable yet
- Anomaly/forensic flags are heuristic (derived from OCR confidence and validation failures), not pixel-level image forensics

---

## Architecture

```
src/app/
  applications/            AICTE case workspace (list, detail, portfolio insights)
  dashboard/, scanner/,    Identity-screening module (shares OCR + risk engine)
  documents/, reports/,    with the AICTE workspace, otherwise separate)
  verification/, ...
  api/
    institution-applications/   AICTE case CRUD, validate, source-check, insights
    screenings/                 Identity-screening ingest + scoring
    auth/                       Session-based login (role derived server-side)

src/lib/
  aicte/        ruleset.ts (compliance rules), document-storage.ts, source-adapter.ts
  ocr/          OCR provider abstraction (Tesseract local / Cloud Vision)
  classifier/   Document-type classification from OCR text
  extractors/   Per-document-type field parsers + checksum validation
  forensics/    Heuristic quality/anomaly scoring
  risk/         Composite risk scoring for the identity-screening module
  auth/, audit/ RBAC + tamper-evident logging

prisma/schema.prisma   Organization → Users (RBAC) → InstitutionApplication →
                        {ApplicationDocument, ValidationFinding, SourceVerificationRecord}
```

Data persists in SQLite via Prisma for local development. Document bytes are currently stored as base64 in the database rather than object storage — fine for a prototype, not for production volume.

---

## Running it locally

```bash
npm install
npx prisma db push
npm run dev
```

That's it — demo accounts and sample AICTE cases seed automatically on first login (development mode only; production refuses to auto-seed unless `ALLOW_DEMO_SEED=true` is explicitly set, so real deployments never get test credentials by accident).

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@parakh-intel.org` | `Parakh@Enterprise2026` |
| Reviewer | `reviewer@parakh-intel.org` | `Parakh@Enterprise2026` |
| Investigator | `investigator@parakh-intel.org` | `Parakh@Enterprise2026` |
| Operator | `operator@parakh-intel.org` | `Parakh@Enterprise2026` |

Copy `.env.example` to `.env` to configure OCR provider choice, session secret, and (optional, unconfigured by default) external gateway credentials — see that file for the full list with inline explanations.

For a production build: `npm run build` (runs `prisma generate` → `prisma db push` → `next build`), then `npm start`. Set a real `JWT_SECRET` first — the app fails closed in production without one.

---

## AICTE API surface

| Method | Route | Purpose |
|---|---|---|
| `GET/POST` | `/api/institution-applications` | List/search cases, create a new case |
| `GET/PATCH` | `/api/institution-applications/[id]` | Case detail, metadata updates |
| `POST` | `/api/institution-applications/[id]/documents` | Upload evidence, hash + OCR it |
| `POST` | `/api/institution-applications/[id]/validate` | Run the compliance ruleset, persist findings |
| `POST` | `/api/institution-applications/[id]/source-check` | Dispatch an issuer-verification check |
| `POST` | `/api/institution-applications/[id]/review` | Reviewer status transition |
| `GET` | `/api/institution-applications/[id]/report` | Export the compliance dossier |
| `GET` | `/api/institution-applications/insights` | Portfolio-wide aggregates for the insights dashboard |

---

## Disclaimer

Every compliance score and finding this system produces is explicitly advisory. It does not constitute a statutory approval, rejection, or AICTE institutional decision — final authority rests with the competent AICTE Scrutiny Committee, as required by the problem statement this project answers.
