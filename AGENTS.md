# Repository instructions for future agents

## Context and scope

Read PROJECT_CONTEXT.md and UI_REDESIGN_CONTEXT.md before substantial work. They were verified against source on 2026-10-29; recheck relevant code. No existing AGENTS.md was found in checked project/ancestor paths during the initial audit, so no prior repository rules were replaced.

The initial analysis-only boundary was superseded by the user's full redesign mission on 2026-10-30. The redesign is implemented; read UI_REDESIGN_RESEARCH.md for current components, source/license decisions and validation. Preserve existing workflows and follow subsequent user scope. No production deployment has been performed.

## Project conventions

- One Next.js 14 App Router/React 18/strict TypeScript application. Prefer existing @/* imports, Tailwind tokens, Lucide icons and Framer Motion where appropriate.
- AICTE application scrutiny is the stated primary deliverable; identity screening is a separate existing workspace. Preserve both unless the user scopes a change.
- Pages are client components. Keep Prisma/Node/OCR logic on the server.
- Review shell, Badge/Button/Card and chart primitives before duplicating them. Chart semantic colors express risk/status, not decoration.
- Preserve API envelopes, category/status identifiers, tenant ownership, advisory disclaimers, human review and report/export behavior unless explicitly in scope.
- Higher compliance means more complete; higher identity risk means more concern. Label these distinctly.
- Do not describe fixtures, hardcoded statuses, OCR heuristics, unconfigured biometrics, hashes or queued handoffs as verified external capabilities.

## Safe inspection and edits

- Exclude node_modules, .next, out, build, coverage, Git internals, generated OCR data, DB contents, secret files and credentials from broad scans. Do not reproduce passwords/keys/tokens/document bytes/PII in docs or logs.
- Prefer rg/rg --files. If the local launcher is broken, use git ls-files and scoped PowerShell Get-Content/Select-String; use -LiteralPath for bracketed routes.
- Check git status and nested instructions before edits. Preserve user changes and existing rules.
- Spawn agents only when the user or applicable instructions explicitly request delegation.
- Keep documentation-only work free of application/schema/database/dependency edits.
- If requested root docs are outside current writable roots, use supported escalation; do not relocate them into application source to evade restrictions.

## Security and data boundaries

- Enforce authentication, authorization and organization scoping in handlers, not only navigation/UI.
- Dispatch auth/tenant enforcement, raw PII responses, permissive AICTE PATCH, session defaults and demo seeding have documented gaps. Do not claim they are fixed; resolve only within authorized scope.
- Roles originate from persisted users; never grant access via client roleOverride.
- Audit insertion is best effort, not immutable. SHA-256 seals are hashes, not PKI signatures.
- Purge currently removes original screening-image bytes only, not all personal data.
- Do not contact configured gateways/deployed apps during read-only local analysis.

## Validation and operational cautions

- The initial audit ran no checks; the later redesign passed build/lint/types, eight domain assertions and isolated browser checks. Read UI_REDESIGN_RESEARCH.md for exact scope; rerun focused checks for new changes.
- npm run build executes scripts/build.js, including prisma db push --accept-data-loss. Review/isolate DB side effects before using it; it is not a harmless check.
- npm install triggers Prisma generation. Do not install or change lockfiles without task need.
- npm test invokes npx tsx tests/aicte-rules.test.ts; tsx is undeclared. Review connector assumptions and possible downloads first.
- tests/e2e-workflow-verification.js creates local records and contacts a hardcoded remote host. tests/deployed-verification.js mutates a remote deployment. Neither is default validation for documentation/UI edits.
- Playwright is declared but no browser interaction suite is implemented. HTTP route checks do not prove UI/accessibility behavior.
- Run focused checks appropriate to authorized changes; report what passed/failed/remains unverified.
- For UI changes, verify roles, API errors, loading/empty states, manual/unavailable states, camera/upload, responsive layouts, keyboard access and print/export. Avoid unrelated backend changes.

## Maintaining context

Update context docs when architecture, contracts, workflows, reusable components or limitations change. Cite source paths and separate implemented behavior from plans. Preserve existing instructions when extending this file.

## Redesign maintenance

- Radix Dialog is adapted from shadcn; BorderBeam from Magic UI. Preserve full MIT notices in src/components/ui/THIRD_PARTY_NOTICES.md.
- Keep global MotionConfig reducedMotion=user, CSS reduced-motion guards, dialog focus/description behavior and scanner keyboard tab semantics.
- Use shared SessionProvider and the flat session organizationName contract.
- tests/ui-redesign-smoke.cjs requires explicit isolated-database acknowledgement and loopback URL. It creates cases and runs OCR; never target production data.
- For UI builds run Next directly or isolate data; the original build wrapper still performs a schema push with data-loss acceptance.
