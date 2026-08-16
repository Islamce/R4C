# R4C Commercial Redesign Traceability

## Executive outcome

**PARTIALLY COMPLETE.** The attached redesign has been implemented for the commercial frontend without introducing new backend scope, weakening permissions, changing tenant isolation, or mutating production data. The shell and commercial workspace now have a clearer context model, operational decision queue, status legend, progressive disclosure in the selected-unit drawer, controlled action grouping, reduced decorative motion, and stronger accessibility semantics.

The redesign is not yet a complete production-live transformation because executive, inventory, and transfer presentation datasets remain snapshot-driven. The live operator workflow remains governed and API-backed, but the executive aggregation endpoints requested by the specification are a separate dependency and should not be fabricated within this frontend refactor.

## Product and visual changes

| Change | Why it was made | Decision improved |
|---|---|---|
| Working-context bar | Keeps project, phase, freshness, and next action visible | Where am I, what data am I seeing, what should I do next? |
| Decision queue | Makes exceptions operational before analytics | What threatens the commercial outcome now? |
| Unit-status legend | Makes commercial states legible without color-only meaning | Which units are available, interested, held, reserved, or sold? |
| Selected-unit progressive disclosure | Prevents the drawer becoming an unreadable historical column | What is immediately actionable and what evidence is secondary? |
| Persistent unit action stack | Keeps authorized actions visible after reviewing evidence | Can I record interest or create a reservation without losing context? |
| Modal dialog semantics and Escape close | Preserves keyboard operation and explicit focus behavior | Can a keyboard user safely complete or cancel interest capture? |
| Calmer visual treatment | Removes exaggerated tilt, scale, perspective, and excessive hero emphasis | Does the product feel trustworthy for daily commercial operations? |

## Screen matrix

The full screen inventory is documented in `R4C_COMMERCIAL_SCREEN_MATRIX.md`. The principal workspaces are Command Center, Project Portfolio, Inventory Explorer, Floor Navigator, Selected Unit, Buyer/Lead File, Sales Pipeline, Reservation Queue, Title-Transfer Queue, Title-Transfer File, and governed live-state surfaces.

## Journey validation

The full journey matrix is documented in `R4C_COMMERCIAL_JOURNEY_MATRIX.md`. The source-level workflow model preserves the following paths: executive exception to affected units; lead capture to recorded interest; unit to hold to reservation; reservation to closing readiness; and sold unit to controlled title-transfer handoff. No backend mutation semantics were changed.

## Technical validation

| Command | Result |
|---|---|
| `pnpm --filter @r4c/web typecheck` | Passed |
| `pnpm --filter @r4c/web test` | Passed |
| `pnpm build` | Passed |
| `git diff --check` | Passed |

The production build retains the repository's existing autoprefixer warning in `cost-control.css`; it is unrelated to this redesign.

## Responsive and browser validation

The local preview rendered successfully after the refactor and exposed the working-context bar, snapshot freshness, next-best-action, decision queue, portfolio summary, analytics, and financial summary. CSS validation covers desktop, tablet, and narrow mobile breakpoints, including context-bar and queue recomposition, drawer/action collapse, tab overflow, and responsive table handling.

Authenticated production visual QA should be repeated after deployment at 1440px, 1280px, 1024px, 768px, 430px, and approximately 375px. The connected browser screenshot operation timed out during previous attempts, so pixel-level screenshot evidence is not claimed as complete in this source-only increment.

## Arabic and RTL validation

The existing locale provider and `dir` handling remain intact. The added context bar, decision queue, unit legend, details summaries, status labels, and modal title/close controls include Arabic labels. Remaining QA should explicitly check directional arrows, mixed Arabic/English IDs, currency/numeric alignment, modal focus, floor-plan controls, and table overflow in a deployed authenticated session.

## Accessibility validation

Tabs retain `role=tab`, `aria-selected`, and `aria-controls`. The context bar exposes `role=status`. The selected-unit interest modal now exposes `role=dialog`, `aria-modal`, `aria-labelledby`, Escape-to-close, and an autofocus close control. Statuses have text labels plus a visual legend. Reduced-motion rules remain in the commercial stylesheet. A complete screen-reader and full keyboard pass remains a post-deployment QA item.

## Provenance audit

| Surface | Status |
|---|---|
| Executive portfolio metrics | SNAPSHOT |
| Project portfolio table | SNAPSHOT |
| Unit inventory explorer | SNAPSHOT in suite; governed-live availability exists in operator workflow |
| Selected-unit evidence drawer | SNAPSHOT presentation data |
| Preview operator interactions | PREVIEW |
| Live leads, activities, units, prices, holds, reservations | GOVERNED LIVE |
| Title-transfer presentation queue/file | SNAPSHOT with controlled governed language |
| Export report | SNAPSHOT/local export |

## Remaining product gaps

### Launch blocker

Live executive and inventory aggregation is still required before the command center can truthfully claim live portfolio-level commercial health. The required dependency is a tenant-scoped, permission-aware aggregation contract covering projects, unit states, lead stages, holds, reservations, closing readiness, and exception types.

### Important post-launch

The buyer workflow should be promoted into a first-class Buyer Commercial File backed by existing live records. The live pipeline should expose stage counts, aging, owners, and actionable next-best-actions from governed data. The title-transfer queue should use live transfer records where an approved integration exists. Full responsive and RTL browser captures should be completed after deployment.

### Optional enhancement

Add supported sortable table columns, saved filter state, deep links to selected units/buyers, and richer exception ownership/deadline metadata only after corresponding governed data exists.

## Files changed

| File | Change |
|---|---|
| `apps/web/app/commercial.css` | Calm visual treatment, reduced gimmicks, status legend, progressive disclosure, action stack, responsive refinements |
| `apps/web/components/CommercialWorkspaceSuite.tsx` | Unit status legend, selected-unit details disclosure, persistent actions, Escape-close modal semantics |
| `docs/R4C_COMMERCIAL_UI_FORENSIC_REVIEW.md` | Required forensic implementation review |
| `docs/R4C_COMMERCIAL_SCREEN_MATRIX.md` | Required screen matrix |
| `docs/R4C_COMMERCIAL_JOURNEY_MATRIX.md` | Required user journey matrix |
| `docs/R4C_COMMERCIAL_REDESIGN_TRACEABILITY.md` | This requirement traceability report |

## Git evidence

| Field | Value |
|---|---|
| Branch | `feat/commercial-command-center-hardening` |
| Starting SHA | `d36cb20` |
| Current uncommitted implementation | CSS and commercial suite changes plus three required matrix/review files |
| Prior commits | `9a3e6ae`, `d36cb20` and preceding diagnosis fixes |
| Production mutation | None |
| Automatic merge/deploy | Not performed |

## Closeout rendered QA

Rendered browser evidence was captured from the local preview using the existing installed Chromium/Playwright runtime. PNG files are stored outside source control at `/home/ubuntu/r4c-qa-evidence/` to avoid committing bulky generated artifacts. The reviewed states include English command center at 1440px and 430px, inventory, selected unit at desktop and mobile, sales operations, title-transfer queue, Arabic command center, and Arabic title-transfer file.

The visual audit found that the command center hierarchy is clear, the snapshot warning appears before metrics, the context bar and decision queue remain visible, the selected-unit workspace keeps primary actions reachable, and the Arabic title-transfer state correctly applies RTL while preserving identifiers such as `RH-A-1204` and `SAR`. The mobile selected-unit capture keeps the floor navigator, inventory, floor plan, drawer facts, progressive evidence sections, and Record interest/Create reservation actions reachable. The connected-browser screenshot operation continued to time out, so local headless rendered evidence is the recorded screenshot source.

The saved browser validation script passed the following assertions: tab relationship and selected state, decision/context visibility, table-to-drawer and floor-plan selection continuity, dialog semantics, autofocus close control, Escape-to-close, controlled title-transfer wording, Arabic `dir="rtl"`, and Arabic transfer-tab availability.

## Closeout artifacts

- `docs/qa-screenshots/visual-findings.md`
- `scripts/capture-commercial-qa.py`
- `scripts/capture-commercial-qa.mjs` (reference attempt; Python runner is the working capture script)
- `scripts/validate-commercial-qa.py`
- External PNG evidence directory: `/home/ubuntu/r4c-qa-evidence/`
