# Project context

## Current implementation — 2026-10-30

The full UI redesign is implemented. APIs/domain engines/schema remain unchanged. Added shared SessionProvider/AppProviders, Radix Dialog, reusable feedback/loading components, keyboard navigation and new isolated browser smoke tests. The following architecture audit is the historical 2026-10-29 baseline; its UI/current-validation statements are superseded by UI_REDESIGN_RESEARCH.md and the current section in UI_REDESIGN_CONTEXT.md. New runtime dependency: @radix-ui/react-dialog 1.1.15; ESLint tooling/config added. Build, lint, types, eight domain assertions and isolated browser workflow checks passed. Backend gaps below remain unresolved.


Verified from local source on 2026-10-29. Static repository audit; no runtime certification or external regulatory validation.

## Audit scope

Four independent reviews covered frontend, backend, workflows and UI. The main agent inspected critical configuration, schema, session/login, roles, application CRUD/validation/review/upload/source-check/report, screening ingestion/detail/reveal/face/dispatch, storage, auditing and shell/navigation, and cross-checked findings. Combined coverage included all 78 tracked src files, Prisma schema, scripts, tests, README and project configuration.

Excluded dependency trees, lockfile contents, generated/build output, Git internals, database contents and secret files. Environment names below come from source references, never credential values. No dependencies are installed in this checkout. No app, browser, build or tests were run, and no application/database/deployment changes were made. README and test comments are secondary evidence, not proof of behavior.

## Product and structure

PARAKH combines AICTE institutional application scrutiny (the README's stated SIH26261 deliverable) with a legacy identity-document intelligence workspace. Both share infrastructure but have separate records, scores and workflows.

This is one Next.js App Router app. Client pages call same-origin route handlers, which call Prisma/domain libraries directly. No separate backend, middleware auth guard, central client query store or background queue process is implemented.

| Location | Responsibility |
| --- | --- |
| src/app | 16 client page entry points; layout/template; API handlers |
| src/app/dashboard/_components | Operator, Investigator, Reviewer, Administrator dashboards |
| src/components/layout | AppShell, Navbar, Sidebar/mobile drawer |
| src/components/ui | Badge, Button, Card/CardHeader |
| src/components/charts/Charts.tsx | Hand-built shared charts, Panel, StatCard, palettes |
| src/lib/aicte | Types, checklists/rules, document storage and source adapters |
| src/lib/ocr | Provider interface/factory, Tesseract, Cloud Vision REST |
| src/lib/classifier, extractors | OCR text classification; five identity parsers |
| src/lib/forensics, risk, biometrics | Heuristic quality/anomaly/risk signals; unconfigured face engine |
| src/lib/auth, audit | Cookie JWT sessions, permission map, audit insertion |
| src/lib/db.ts, seed.ts | Prisma connection and automatic demo seed |
| prisma/schema.prisma | SQLite datasource, 18 models |
| scripts, tests, .github/workflows | Build, assertion/integration scripts, keep-alive |

## Tech stack and dependencies

Declared versions, not installed-version verification:

- Next 14.2.24, React/React DOM ^18.3.1, TypeScript ^5.7.3, Node APIs.
- Prisma/client ^5.22.0; SQLite.
- Tailwind ^3.4.17, PostCSS ^8.5.1, Autoprefixer ^10.4.20.
- Framer Motion ^14.6.0, Lucide React ^0.475.0, clsx ^2.1.1, tailwind-merge ^2.6.0.
- Tesseract.js ^5.1.1; optional Cloud Vision through fetch, no Google SDK.
- html2canvas ^1.4.1 and jspdf ^2.5.2 declared; implemented exports use browser print or JSON.
- Dev: Playwright ^1.64.1, @types/node ^20.17.19, @types/react ^18.3.18, @types/react-dom ^18.3.5.

TypeScript is strict/noEmit with bundler resolution and @/* -> src/*. next.config.mjs enables strict React, unoptimized images, server-external Tesseract/Prisma and SQLite/schema output tracing. Client fallbacks disable fs/path/crypto. No external chart library, form framework or auth SDK is implemented.

## Data model and persistence

Organization owns User, ApiKey, AuditLog, ScreeningSession and InstitutionApplication records.

ScreeningSession owns Document, OCRResult, ExtractedField[], DocumentAnalysis, ForensicAnomaly[], FaceVerification, RiskAssessment and ParakhHandoff. InstitutionApplication owns ApplicationDocument[], ValidationFinding[], SourceVerificationRecord[] and InfrastructureReview[].

Roles/categories/statuses are database strings, not Prisma enums. Several reference-like IDs are plain strings without enforced relations. Evidence bytes are base64 in SQLite; storageKey is metadata, not object storage.

src/lib/db.ts replaces local file URLs with an absolute prisma/dev.db path. Vercel/AWS copy a bundled database into ephemeral /tmp/dev.db. Passing through a non-file DATABASE_URL does not change the SQLite Prisma provider; external PostgreSQL/MySQL support is not configured. The tracked DB was not opened.

## Authentication and roles

Evidence: src/lib/auth/{session,roles}.ts, src/app/api/auth/*/route.ts, src/lib/seed.ts.

Login normalizes email, checks password and derives role from DB. Password hashing uses SHA-256 plus fixed application salt, not a password KDF. Custom HS256 JWT sessions last 12 hours in an HttpOnly, SameSite=Lax cookie, Secure in production. Session claims are trusted until expiration without DB role refresh/revocation lookup. No signup/reset/MFA/rate limiter was found.

Configured JWT_SECRET is accepted at 16 characters despite error text saying 32+. Non-Vercel production rejects missing secrets, but Vercel has a hardcoded fallback. Login auto-seeds demo users/data: ordinary production requires ALLOW_DEMO_SEED=true; Vercel bypasses that guard. README claims about universal production fail-closed auth/seeding are inaccurate. No credential values are reproduced here.

| Role | Declared permissions |
| --- | --- |
| OPERATOR | Screening create/read, scanner, report view/export |
| INVESTIGATOR | Screening create/read, forensics, biometrics, reports, dispatch |
| REVIEWER | Investigator abilities plus screening review and PII unmask |
| ADMINISTRATOR | Review abilities plus purge, configuration, API keys, audit/settings/team management |

Handlers sometimes use explicit roles instead of ROLE_PERMISSIONS. Audit API admits reviewers although the map gives audit_logs:read only to admin. Ordinary AICTE CRUD/upload/validate/automated source/report endpoints require session/organization membership; manual verification and review require investigator/reviewer/admin, closure admin only. AppShell renders unauthenticated children with a preview banner; API enforcement is the security boundary.

## AICTE workflow

1. Create DRAFT case with institution, permanent ID, fee, intake/faculty and prior approval metadata. Categories: EXTENSION_OF_APPROVAL, NEW_PROGRAMME, INTAKE_CHANGE, APPROVAL_CHANGE.
2. Upload JSON/base64 PDF/PNG/JPEG with category/metadata. Declared size limit is 15 MB. SHA-256 duplicate lookup spans organization. Images receive OCR; PDFs explicitly require manual review. Infrastructure evidence creates a pending review record and sets infrastructureSubmitted.
3. evaluateRegulatoryRules (src/lib/aicte/ruleset.ts) has 11 numbered groups, rather than README's claimed 13: mandatory documents, expiry, prior approval reference, TER status, faculty/intake, institutional status, infrastructure, duplicates, OCR-versus-record, cross-document identifiers and date metadata. Category checklists have 5/7/6/3 mandatory entries. APH-2024-27-V1 and clause references are hardcoded code labels, not externally verified regulatory coverage.
4. Compliance starts at 100: failed critical/high/other deduct 25/15/8, warning 8, manual review 5; clamp 0-100. Higher is better. Findings are deleted/recreated transactionally with score/version/date.
5. Only DRAFT/VALIDATION_PENDING automatically change after validation: failure -> RECTIFICATION_REQUESTED; warning/manual review -> OFFICIAL_REVIEW_REQUIRED; otherwise READY_FOR_OFFICIAL_SCRUTINY. Other current states remain.
6. Source-check runs institution and TER; supplied target is ignored. Institution adapter conditionally calls a configured HTTP endpoint, otherwise unavailable. Configured TER returns PENDING without network activity. Repository accreditation/NoC/EoA methods always return unavailable. Authorized manual decisions create separate records.
7. Review actions: REQUEST_RECTIFICATION, ESCALATE_FOR_SCRUTINY, MARK_UNDER_REVIEW, RECORD_OBSERVATION, admin CLOSE_CASE. Notes append to text, without an enforced state-transition matrix.
8. Export JSON dossier with manifest, findings, sources, infrastructure, latest 25 case-number-matching audit events and advisory disclaimer. SHA-256 seal covers selected metadata/hashes, not PKI signing.

All outputs remain preliminary decision support; preserve final human scrutiny authority and disclaimer.

## Identity workflow

src/app/api/screenings/route.ts: multipart document or JSON image -> SHA-256 -> OCR -> keyword/regex classification -> extraction -> heuristic quality/forensics -> risk -> nested Prisma persistence -> audit.

Types: AADHAAR_CARD, PAN_CARD, PASSPORT, DRIVING_LICENCE, VOTER_ID, UNKNOWN. Tesseract uses English/Hindi sparse text, creates/terminates a worker per image, and returns empty/zero-confidence OCR on failure. Optional GOOGLE_CLOUD_VISION uses REST document text detection; missing key falls back locally, configured request failure throws. Cloud confidence is fixed at 94.

Aadhaar uses Verhoeff; passport checks MRZ components; PAN/DL/EPIC use format heuristics. Passport compositeValid is not a full composite-digit calculation. Quality/anomalies are OCR/field heuristics with fixed boxes, not pixel forensics; ingestion uses hardcoded 1920x1080 dimensions.

Risk starts at 10, adds penalties, clamps 0-100: LOW_RISK <26, REVIEW_REQUIRED 26-65, HIGH_RISK >=66. Higher is worse, unlike compliance. Type override re-extracts fields without recalculating risk/forensics. Face engine has no model: supplied images produce zero similarity and REVIEW_REQUIRED; presence flags are not actual detection.

PARAKH client attempts HTTP with a three-second timeout, persisting DELIVERED/QUEUED receipt metadata. No durable payload queue/retry worker exists. Integrity is unkeyed SHA-256, not signing. DELETE screening purges original document bytes only; OCR/fields/selfie/metadata remain, with no automatic retention worker.

## API inventory

Local source routes, not proof of deployed availability. Usually success/data or error JSON, but envelopes vary. Most dynamic lookups accept internal ID or public reference; AICTE PATCH requires internal ID. All require session except login/logout/session semantics, the Bearer endpoint, and the dispatch gap noted below.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | /api/auth/login | email/password; user/cookie; may seed |
| POST | /api/auth/logout | Delete cookie |
| GET | /api/auth/session | authenticated/user/permissions; unauthenticated HTTP 200 |
| GET | /api/dashboard | Role-selected data; operator user-scoped, others org-scoped |
| GET | /api/metrics | Org screening aggregates/config-derived health |
| GET, POST | /api/screenings | search/documentType/riskTier/status/page/limit; upload pipeline |
| GET, DELETE | /api/screenings/[id] | Full detail; admin original-image purge |
| POST | /api/screenings/[id]/override-type | Session/tenant; re-extract fields/type |
| POST | /api/screenings/[id]/reveal | Reviewer/admin pii:unmask; reason >=5 chars; audit |
| POST | /api/screenings/[id]/face-verify | Session/tenant; selfieImage; manual-review result |
| POST | /api/screenings/[id]/parakh-dispatch | External dispatch; auth/tenant gap |
| GET, POST | /api/institution-applications | search/category/status/page/limit; create |
| GET, PATCH | /api/institution-applications/[id] | Detail without bytes; metadata/status updates |
| POST | /api/institution-applications/[id]/documents | category/fileName/mimeType/base64Data plus metadata |
| POST | /api/institution-applications/[id]/validate | Replace findings; score/status |
| POST | /api/institution-applications/[id]/source-check | Institution/TER or manualDecision |
| POST | /api/institution-applications/[id]/review | Role-gated action/actionType + notes |
| GET | /api/institution-applications/[id]/report | JSON dossier |
| GET | /api/institution-applications/insights | Org portfolio aggregates/triage |
| GET | /api/audit-logs | Admin/reviewer; search/action/page/limit |
| GET, POST, DELETE | /api/api-keys | Admin list/create/revoke via query id; secret once |
| POST | /api/v1/screening/analyze | Active Bearer key; JSON image; masked analysis |

Bearer analysis updates key usage but ignores stored scopes/quotas and returns a generated screening ID without screening/audit persistence.

## Verified implementation gaps

- src/app/api/screenings/[id]/parakh-dispatch/route.ts globally locates and dispatches a record before optional session lookup: no mandatory auth, permission or tenant check.
- Screening list/detail/create/override expose rawValue; detail also returns OCR and original bytes. UI masking and separate reveal gate do not protect server responses.
- AICTE PATCH admits any authenticated tenant user to update validationStatus/reviewerNotes, bypassing review action gates. Face/type handlers omit declared specialized permission checks.
- src/lib/audit/logger.ts performs best-effort ordinary inserts and catches failure. No hash chain/immutable enforcement exists despite README claims.
- Identity lacks explicit backend MIME/size checks; base64 truncates to 1,000,000 chars, selfies to 150,000, potentially corrupting images. AICTE validation trusts declared fileSize/MIME rather than decoded size/content.
- AICTE detail omits bytes, with no evidence-view/download endpoint. Pending infrastructure records have no dedicated review-update API.
- Rules check OCR text length without checking status; explanatory PDF/failure placeholder text may enter cross-check logic. Findings history is replaced rather than versioned.
- Dossier audit query misses document/source events keyed by other resource IDs. Random short references lack collision retry; case numbering hardcodes 2026.
- Session defaults, Vercel seeding and ephemeral SQLite persistence limit stronger production claims. UI placeholders/stale contracts are documented in UI_REDESIGN_CONTEXT.md.

## Configuration, development and validation

Source-referenced names: DATABASE_URL, JWT_SECRET, OCR_PROVIDER, GOOGLE_CLOUD_VISION_API_KEY, AICTE_PORTAL_API_URL, AICTE_PORTAL_CLIENT_ID, AICTE_PORTAL_CLIENT_SECRET, VERIFICATION_GATEWAY_URL, VERIFICATION_GATEWAY_KEY, PARAKH_CENTRAL_ENDPOINT, PARAKH_API_KEY, PARAKH_ORGANIZATION_ID, ALLOW_DEMO_SEED. Branches also use NODE_ENV, VERCEL, AWS_LAMBDA_FUNCTION_NAME. Never copy actual values into docs.

package scripts: dev=next dev; start=next start; lint=next lint; postinstall=prisma generate; test=npx tsx tests/aicte-rules.test.ts; build=node scripts/build.js. Build runs Prisma generation, prisma db push --accept-data-loss, then next build. It can modify/delete data and was deliberately not run.

README local setup is install/schema push/dev; these were not executed. tests/aicte-rules.test.ts has eight assertion groups for category checklists, missing/expired evidence, faculty deficit, duplicates, unavailable adapter, score/disclaimer and token tampering. Direct cross-document/date-rule tests are absent. It assumes unconfigured connectors. tsx is invoked via npx but undeclared.

tests/e2e-workflow-verification.js calls local and hardcoded remote hosts and creates local records. Its synthetic text property is ignored by the OCR API, weakening assertions. tests/deployed-verification.js mutates a hardcoded remote deployment. Both inspect HTTP/HTML rather than browser workflows; no Playwright UI suite/config exists despite the dependency. Historical deployment claims in test comments were not verified.

.github/workflows/keep-alive.yml schedules a ten-minute curl to a placeholder Render URL; no test/lint/build CI. Runtime rendering, OCR availability, current deployment and test outcomes remain unverified.

UI refinement on 2026-10-30: light sage/ivory palette and input-aware motion live in src/app/motion.css and AppProviders; command/keyboard navigation and chart values remain immediate. Dependencies and API contracts unchanged. See UI_REDESIGN_CONTEXT.md for current motion behavior and successful isolated validation.
