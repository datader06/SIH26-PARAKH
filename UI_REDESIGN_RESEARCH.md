# UI redesign: research and delivery

Implemented 2026-10-30. Five specialized agents researched components, UI foundations, motion, Dribbble references and the repository. The main agent independently visited all nine requested resources and four specified shots using web retrieval and rendered Playwright previews, then owned integration and browser QA. No reference artwork was copied into the application.

## Main-agent inspection ledger

| Resource | Actual inspection and findings | Decision / limits |
| --- | --- | --- |
| [Aceternity](https://ui.aceternity.com/components/spotlight) | Rendered Spotlight: dark grid, focused light, oversized heading. [Bento](https://ui.aceternity.com/components/bento-grid) and [upload](https://ui.aceternity.com/components/file-upload) docs/source reviewed by research agent. | Lighting/composition inspiration only. Free-registry license grant was not established; Pro license is not universally MIT. Upload adds dropzone/Tabler and hundreds of decorative grid cells, so not adopted. |
| [Uiverse](https://uiverse.io/satyamchaudharydev/ugly-bulldog-75) | Rendered five-bar minimalist CSS loader and visible HTML/CSS editor; homepage/gallery retrieved. Agent checked author MIT notice. | Not copied: existing busy feedback avoids extra perpetual animation. Community source/a11y varies by component. |
| [shadcn/ui](https://ui.shadcn.com/docs/components/radix/sidebar) | Rendered sidebar demo; [Dialog](https://ui.shadcn.com/docs/components/radix/dialog), [Table](https://ui.shadcn.com/docs/components/radix/table), Skeleton docs and upstream source inspected across main/agent reviews. | Adopted adapted Dialog/Skeleton/Table source patterns, not a scaffold reset. Current v4 utilities deliberately adapted to Tailwind 3. Sidebar layout informed original shell. |
| [Magic UI](https://magicui.design/docs/components/border-beam) | Rendered moving border on form demo; main read complete upstream Border Beam source and MIT license. Agent reviewed Number Ticker and Animated Beam source. | Border Beam adapted with existing framer-motion imports, CSS masks/offset path, in-view rendering and reduced-motion bypass. Tickers not added to avoid unnecessary motion in operational data. |
| [21st](https://21st.dev/@shadcn/components/sidebar) | Rendered sidebar listing/preview and MIT label. Agent reviewed dashboard, striped grid and skeleton usage/dependencies. | Inspiration only; complete implementations often account-gated. Marketplace preview/media do not automatically inherit component license. Used primary shadcn source instead. |
| [React Bits](https://www.reactbits.dev/components/spotlight-card) | Rendered Spotlight Card gallery, controls and card preview. Agent retrieved SpotlightCard/BlurText TS sources. | Not copied. Current source license is MIT plus Commons Clause; visual effect not needed in dense review UI. Some sources import motion/react, while project already uses framer-motion. |
| [Jitter](https://jitter.video/) | Rendered oversized black type, white editorial canvas and lavender CTA. Agent explored template gallery/editor URLs. | Editorial hierarchy and restrained reveal principles only. No React source; template editor playback/timelines were not verified. No animation export used. |
| [Stitch](https://stitch.withgoogle.com/) | Rendered public dark dotted hero, large heading and grouped prompt workbench. | Visual grouping reference only. No login, generated screen, project source or source license inspected. |
| [Awwwards](https://www.awwwards.com/) | Rendered featured-site framing, oversized title and floating navigation. Agent reviewed category pages/terms. | Section rhythm and cinematic depth reference only. No featured-site code/assets reused; directory access grants no reuse rights. |

## Dribbble inspection

The main agent opened the actual rendered artwork/video previews; agents also inspected author descriptions and page-listed palettes. Video observations are selected frames, not a complete timeline analysis. A later ClMac revisit hit human verification; no challenge bypass was attempted.

- [ClMac / Outcrowd](https://dribbble.com/shots/16580851-ClMac-Dashboard-Design-for-Web-Application): visible monitoring area, pastel summary tiles, understated metrics and grouped scan actions on a light interface; used for data hierarchy rather than exact layout. Early video frames contain a blank entrance; a later populated preview was visible on the first visit.
- [Paulini / Outcrowd](https://dribbble.com/shots/14012516-Landing-Page-Paulini): large left-aligned light sans headline and restrained navigation balanced against oversized colorful dimensional illustration. Used asymmetric composition and editorial scale, not its illustration, copy or palette.
- [Ad Tracking / Shakuro](https://dribbble.com/shots/7191986-Landing-Page-Design-for-Ad-Tracking-Platform): dark navy, bright cyan/coral accents, isometric product art, separately grouped features/pricing, prominent headings. Used dark public framing and distinct story sections.
- [Maritime Fusion / Flexy](https://dribbble.com/shots/27154814-Website-Design-Webflow-Development-for-Maritime-Fusion-Reactor): cinematic dark presentation, ship/reactor visual, pale large type and deep spatial framing. Used depth and restraint; PARAKH's evidence sheets are original HTML/CSS.
- Supporting exploration: [compliance search](https://dribbble.com/search/compliance-documents), [Compliance Issues Dashboard](https://dribbble.com/shots/26354994--Compliance-Issues-Dashboard), and the agent's [approval-workspace concept](https://technine.io/en/design-explorations/approval-workspace). The compliance dashboard's rendered filters/tabs/table informed operational density. Technine was text-inspected only; its image fetch failed. No bulk processing/version-control feature was inferred or added.

Dribbble/Awwwards artwork remains its creators' property. No source/asset reuse grant was assumed.

## Unified implementation

Original direction: ink-and-copper public storytelling, cool ivory operational surfaces, white evidence panels, dark navigation, retained clay primary and clear teal/amber/rose semantic states. Inter and Plus Jakarta Sans remain. No WebGL, animation toolkit bundle, image asset download or secondary CSS framework added.

- Public landing: layered document composition, outlined brand wordmark, real section anchors, responsive navigation, one-time reveals, keyboard workflow tabs, sign-in/error handling, returning-session workspace action.
- Shared application: AICTE-first sidebar, route breadcrumbs, real organization/profile, functional command navigation, native mobile/search dialogs, shared session provider, global MotionConfig reducedMotion=user.
- All 16 page entry points and four dashboard variants updated; scanner, registry, reports, audit, API keys, applications/list/detail/insights and five governance pages retain their existing route/API contracts.
- Accessible Radix dialogs cover sign-in, application forms, PII reveal, type override and key creation. Shared loading/empty/feedback primitives, labeled filters/forms, readable tables and keyboard chart/tab controls improve operational consistency.
- Static gateway success, fake notifications, broken role switching, fabricated scanner progress/MRZ cards and invented numeric fallbacks were removed or replaced with honest states. Settings/config drafts remain explicitly local previews; team is an actual permission reference.
- Scope stayed in UI/providers/styles/tooling/tests. API handlers, domain engines, authentication implementation, Prisma schema and the repository database were not edited.

Actual source components: shadcn-derived Dialog, Skeleton and Table; Magic UI Border Beam. Full upstream MIT notices are retained in src/components/ui/THIRD_PARTY_NOTICES.md. Radix Dialog 1.1.15 is the only new runtime package; matching ESLint/Next config tooling was added for reproducible lint. Native tables retain API-driven search rather than adding TanStack version/dependency complexity.

Compatibility: React 18/Next 14 client boundaries maintained; v4-only source utilities replaced with Tailwind 3/CSS equivalents; existing Motion package reused. Dialog focus/description behavior was tested against installed Radix, not assumed from examples. Border Beam is decorative, pointer-inert and disabled for reduced motion/offscreen. Heavy shader/background/scroll-hijacking options were rejected.

## Files and verification

Key files: src/app/page.tsx; globals.css; layout.tsx; all operational page.tsx files; dashboard/_components; components/layout, charts, providers and ui; lib/utils.ts; tailwind.config.ts; package manifests; .eslintrc.json; tests/ui-redesign-smoke.cjs. See git diff for the complete reviewable change.

Passed:

- Direct production Next build, including lint/type validation and all route generation. Deliberately bypassed scripts/build.js so prisma db push --accept-data-loss never ran against repository data.
- Standalone TypeScript --noEmit --incremental false.
- ESLint with no warnings/errors.
- All eight existing AICTE/source/auth assertions.
- New loopback-only Playwright smoke suite: real sign-in; dialog trap/Escape/focus return; workflow keyboard tabs; all 15 operational routes; actual case creation; visible API error fixture; real synthetic PAN OCR and inspection-tab keys; four real role sessions; operator disabled review affordance; mobile/tablet containment and mobile dialog. Tested widths 390, 768 and 1440, with reduced-motion rendering.
- Main-agent rendered desktop/mobile review of landing, workflow section, dashboards, application list/detail and real scanner result. Returning-user CTA verified. Browser findings drove encoding/table-whitespace, chart-legend, dialog-description, report-heading and scanner-contrast fixes.
- git diff --check and protected-area diff audit.

Browser database seeding, OCR and created cases were confined to a separate temporary app/database. Smoke script requires PARAKH_UI_TEST_ISOLATED=1 and a loopback URL; never run it against production data. Existing deployed-verification/e2e scripts were not run.

Remaining limits: physical camera hardware, configured government gateways, live external handoff, biometric models, complete assistive-technology audit and all-browser/device performance were not certified. Existing backend security/data-lifecycle gaps remain as documented in PROJECT_CONTEXT.md. No production deployment was requested or performed.

## Subsequent palette and motion refinement — 2026-10-30

The user requested a lighter green palette and motion using the installed Emil Kowalski skills. Applied emil-design-eng, animate (including RECIPES.md), and animation-performance. No new packages. See UI_REDESIGN_CONTEXT.md for exact motion values and updated palette. New source: src/app/motion.css. Other edits: globals.css, page.tsx, template.tsx, layout.tsx, providers/AppProviders.tsx, layout/Sidebar.tsx, ui/Dialog.tsx, ui/Button.tsx and charts/Charts.tsx. Existing demo role credential autofill remains and is now checked for all roles in the smoke suite.

| Before | After | Why |
| --- | --- | --- |
| Dark green large surfaces | Pale sage/ivory surfaces, copper accents and dark text | Lighter atmosphere and readable contrast |
| Repeated route/card and width/height chart entrances | Immediate navigation/data, one-shot document fan and short pointer dialog transitions | Put motion where it explains state without slowing review |
| Shared handling for all input modes | Pointer feedback; instant keyboard openings; gentle reduced-motion fades | Preserve accessible, fast interaction |

Production build, lint, types and updated isolated browser suite passed. Browser verified 390/768/1440 widths and normal/reduced motion. Physical-device GPU/frame-rate performance remains unmeasured. No backend changes or repository-database operations were made for this refinement.
