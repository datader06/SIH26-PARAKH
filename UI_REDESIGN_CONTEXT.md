# UI redesign context

## Scanner risk hierarchy — 2026-10-31

`src/app/scanner/page.tsx` places Risk Assessment at the top of the desktop right column, with a bold 20/24px heading, enlarged score/status and readable signal lists. OCR tabs and extracted details follow directly beneath; the document preview stays in the left column. On mobile/tablet the assessment and details precede the preview. This is a layout/typography adjustment only; existing risk values, OCR evidence, API behavior and advisory language are preserved. Real isolated Aadhaar OCR smoke and runtime geometry assertions passed at 390/768/1440px (risk before fields, top-right placement on desktop, prominent heading, no body overflow); screenshot reviewed. TypeScript and focused ESLint passed. The original user database was not accessed or modified by these checks.

## Supplied Aadhaar example — 2026-10-30

The AADHAAR demo button now processes `src/assets/demo/aadhaar-example.png`, the exact image supplied by the user. It no longer draws the old Aadhaar text specimen. The preview preserves the measured image aspect ratio; the sample has an invalid placeholder ID, so a text/checksum warning is expected. The input hash and actual OCR extraction were verified in the isolated browser test, including mobile/tablet/desktop result containment. A cross-document video kit is available under `tests/fixtures/cross-document/README.md`; that workflow is in Applications and does not imply an implemented Aadhaar/PAN name or DOB matching feature. See the latest PROJECT_CONTEXT.md section for test scope.

## OCR result truthfulness correction — 2026-10-30

`src/app/scanner/page.tsx` removes all template inspection-zone overlays. The preview metadata displays actual OCR confidence with availability; fields display evidence-backed `% OCR` or unavailable, never `% match`. A missing Aadhaar name has an explicit notice rather than borrowing the address. The forensics tab presents the OCR provider, recognized-word count, labeled type heuristic score and text format/checksum findings; pixel forensics, sharpness and glare are explicitly unavailable. VALID means implemented text checks passed, not verified identity or issuance. Raw OCR exposes the real engine, confidence and word count.

`src/app/reports/[id]/page.tsx` suppresses unsupported legacy risk explanations, marks old field confidence unavailable and displays a re-scan notice for legacy analysis. Stored historical risk scores are not rewritten. The version-2 evidence envelope and classifier/risk limitations are documented in PROJECT_CONTEXT.md. Actual Aadhaar and blank-image Tesseract flows, type override, screenshot review and 390/768/1440px result layouts passed in an isolated temporary app; the full UI smoke suite, types, lint, domain tests and direct production build passed. Cloud Vision was tested with response fixtures only. No real pixel-level tamper model or external identity verification was added.

## Current UI — implemented 2026-10-30

The redesign is complete across all 16 page entry points. Public: light sage/ivory document composition with copper accents, editorial typography, anchored storytelling, interactive workflow, accessible sign-in. Workspace: pale sage AICTE-first navigation, cool ivory canvas, white evidence panels, shared session state and command navigation. Shared Radix Dialog/Skeleton/feedback primitives and keyboard-accessible charts/tabs are in use. Static operational claims and fabricated scanner results were replaced with truthful states; unsupported settings remain explicitly local previews. See UI_REDESIGN_RESEARCH.md for sources, affected files, licensing, validation and remaining limits. The source-based inventory below is preserved as a historical pre-redesign baseline, not a description of the current UI.


Verified from local source on 2026-10-29. No redesign/application edits made. Code-level inventory only; no browser screenshots, measured contrast or interactive accessibility testing. See PROJECT_CONTEXT.md for domain/API/security details.

## Routes and information architecture

All 16 page entry points are client components. Root layout supplies fonts/global CSS; template animates route entry. Operational pages each mount AppShell. useEffect/fetch/local state recur without shared session/query provider.

| Route | Existing UI and implemented behavior |
| --- | --- |
| / | Identity-led marketing; sign-in modal posts email/password then dashboard; role picker changes demo email |
| /dashboard | Session-selected Operator/Investigator/Reviewer/Administrator views via /api/dashboard; unauthenticated fallback is operator |
| /applications | AICTE case metrics, search/category/status filters, table, create modal |
| /applications/[id] | Findings/documents/source/infrastructure/workflow tabs; upload, validate, automated/manual source checks, review, JSON export |
| /applications/insights | Portfolio categories/scores, deficiencies, source coverage, cross-document flags, triage |
| /scanner | Camera/upload/specimens, preview/workbench, fields/forensics/face/MRZ/raw tabs, PII reveal, override, dispatch |
| /documents | Screening registry with search/type/risk filters |
| /reports | Dossier cards requesting first 50 screenings |
| /reports/[id] | Screening report, browser print, dispatch and original-image purge |
| /activity | Audit search/action filters with API error display |
| /api-access | Admin key list/create/revoke, one-time secret copy, example API request |
| /verification | Static gateway cards; no verification request |
| /integrations | Local config; alert-only save; simulated handshake |
| /team | Static roster/permission descriptions; no team-management API |
| /security | Real manual image purge; local retention selector and alert-only save |
| /settings | Local settings; save shows success timer, no persistence |

Sidebar Operations: Overview, New Screening, Applications, Documents, Verification, Reports, Activity Logs. Governance: Integrations, API Access, Team & Roles, Security & Privacy, Settings. All links show for every role. AICTE is the stated primary deliverable but third in sidebar and absent from landing navigation.

Dashboard priorities: operator personal throughput/attention; investigator risk/anomalies/face coverage; reviewer AICTE triage/source/audit; administrator organization users/screenings/applications.

## Shell and responsive layout

src/components/layout/AppShell.tsx composes a sticky 64px Navbar, 256px desktop Sidebar at md+, animated mobile drawer, preview banner and responsive main padding. Each page mounts the shell. Navbar and AppShell independently fetch session; dashboard repeats it.

AppShell always renders children and shows unauthenticated preview state. Client navigation is not an access-control boundary. Preserve API enforcement when changing role affordances.

Existing screens use responsive grids, horizontal table/tab scrolling, modal max-height containers and a 5/7 scanner workbench at lg. body overflow-x:hidden can conceal layout overflow. Rendered small-screen verification remains necessary.

## Visual system

Evidence: tailwind.config.ts; src/app/{globals.css,layout.tsx,template.tsx}.

| Element | Existing definition |
| --- | --- |
| Background/surfaces | Cream #FBF7F0; white/warm surface levels |
| Text/border | Warm ink #2B2420 with soft/faint shades; #E9DFCC borders |
| Primary | Clay #C96F4A and scale |
| Semantics | Sage success/low risk, amber review, rose high risk, dusk information |
| Fonts | Inter body, Plus Jakarta Sans display via next/font/google; system/mono fallbacks |
| Shapes | Rounded cards/buttons/pills; soft/card/lift shadows |
| Motion | Framer routes/hover/modals/charts; fade/float/shimmer utilities |
| Global helpers | Paper grain, scrollbar styling, shimmer, print classes |

Class darkMode is configured but no complete dark token system or toggle exists. Hardcoded blue/dark/emerald styles coexist with warm tokens. Scanner inactive tabs use text-white/70 on near-white surface-100, a source-visible contrast concern that needs rendered testing.

Charts use separate STATUS/CATEGORICAL palettes in Charts.tsx. Keep semantic risk colors distinct from categorical colors. Comments claiming prior palette validation were not independently validated.

## Reusable components and patterns

| Component | Usage / opportunity |
| --- | --- |
| AppShell, Navbar, Sidebar | Shared navigation/shell; consolidate session and truthful status |
| Badge | Six tones, imported by four role dashboards |
| Button | primary/secondary/ghost/danger, sm/md, motion; no app imports found |
| Card, CardHeader | Existing primitives; no app imports found |
| HBarChart, DonutChart, TrendBars | Shared div/SVG/motion charts in dashboards/insights |
| Panel, StatCard | Shared dashboard/insights presentation |
| Checklists/status mappings | Domain source plus repeated page labels; preserve API identifiers |

Most pages recreate buttons/cards/inputs/tables/modals inline. Shared dialog, form field, filter toolbar, table, toast, confirmation and query-state primitives are absent. Scanner and application detail combine multiple responsibilities in large page files. Future decomposition can follow intake/evidence/findings/source/review boundaries.

## Incomplete and misleading UI

- Navbar notifications/operational indicators and Sidebar Hub Active/version/linkage claims are hardcoded, not live health.
- Navbar simulated role switch posts email/roleOverride without password; login requires password and derives role from DB. This is a stale client contract.
- Integration handshake waits 850ms then returns fixed success/latency/cluster/encryption. Save does not persist.
- Settings/retention save is local feedback. Team/verification are static.
- Scanner progress advances every 450ms, not from backend stage events.
- Scanner MRZ tab shows fixed sample text and valid/verified cards independent of extraction.
- Canvas-generated calibration specimens are fixtures, not real evidence.
- Face engine is unconfigured and requires manual review, not real matching.
- Screening Export PDF invokes window.print; AICTE export downloads JSON.
- Application detail actions lack client role gating; many failures only reach console/no visible feedback.
- Infrastructure tab shows records but has no dedicated review editor/API. Workflow shows appended reviewerNotes, not structured events.
- Metrics health strings include hardcoded/configuration signals, not live service probes.

Do not carry prototype claims forward as real capabilities. Distinguish fixtures, pending, unavailable, manual-review, queued and delivered states.

## Accessibility and interaction gaps

Source searches found no dialog roles/aria-modal, aria-current, htmlFor, useReducedMotion or prefers-reduced-motion. Inspected handwritten dialogs/drawers lack visible focus trapping/restoration and Escape handling. Some icon buttons have accessible labels but coverage is inconsistent.

Charts/tooltips are pointer-hover driven without equivalent keyboard interaction or accessible SVG titles. Native alert/confirm is common. Future work should address label association, active navigation semantics, feedback announcement, reduced motion and consistent focus states. This is a source review, not accessibility certification.

## Redesign opportunities (not implemented)

1. Clarify AICTE case scrutiny and identity-screening navigation while preserving both workflows.
2. Adopt consistent tokens/primitives and extract shared dialogs/forms/tables/filters/status/feedback.
3. Consolidate session state; show permission-aware actions while keeping server checks.
4. Define loading/empty/error/forbidden/unavailable/manual-review/success states around real APIs.
5. Replace fixed verification/health claims with accurate states or explicit prototype labels.
6. Improve dense evidence review for keyboard, assistive technology and small screens.
7. Decompose scanner/case detail while preserving payloads/statuses/scoring.
8. Preserve provenance, rule explanations, PII justification and advisory language.

## Constraints and later verification

- Compliance: higher is better. Identity risk: higher is worse. Avoid ambiguous shared score labels/colors.
- Keep raw API category/status identifiers; most dynamic routes accept internal/public IDs but AICTE PATCH needs internal ID.
- Keep PDF/manual-review and upload limits explicit. AICTE lacks evidence view/download API.
- Camera needs browser permission/secure context; maintain upload fallback.
- QUEUED is distinct from delivered; no background retry worker exists.
- UI masking does not remedy backend raw PII responses. Backend gaps need separately scoped work; do not silently change auth/API/domain logic in a visual redesign.
- Preserve final human scrutiny authority; hashes do not establish signatures or statutory verification.

Later implementation checks should cover four roles, loading/empty/errors/forbidden states, mobile/desktop, keyboard dialogs/navigation, capture/upload, document tabs, AICTE review/export and report print. None were runtime-tested during this pass.

## Skill-guided palette and motion refinement — 2026-10-30

Applied emil-design-eng, animate and animation-performance. Public hero/navigation/workflow/CTA/footer and desktop/mobile sidebar now use pale sage, ivory and copper with contrasting dark text. Hero documents fan into view once; marketing reveals use transform/opacity; pointer workflow changes transition in 200ms. Radix dialogs enter in 220ms and exit in 160ms, using transform/opacity. Mobile drawer uses a 240ms CSS transition with progressive @starting-style support. Pointer buttons have subtle press feedback; keyboard dialog/command navigation remains immediate. Reduced motion replaces dialog movement with a brief fade and skips the document fan. Repeated route movement and growing functional charts were removed to keep review data stable.

Validation passed: isolated production build, ESLint, TypeScript and loopback browser smoke suite covering all routes, four roles, demo credential autofill, OCR, forms, responsive containment, reduced motion and pointer-versus-keyboard dialog behavior. Rendered desktop/mobile palette reviewed. Real-device frame-rate profiling was not performed. Your existing repository database was not used for these tests.
