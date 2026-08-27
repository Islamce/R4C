# R4C Full UAT — Production Release `5a9e7396`

Date: 2026-08-27  
Target: `https://r4c.kynox.io` / `https://r4c-api.kynox.io`  
Verdict: **CONDITIONAL FAIL — production is healthy, but operational and visual acceptance is not complete**

## Evidence boundaries

- Public production health, readiness, authentication boundaries, login/recovery, mobile reflow, and production preview isolation were tested against the deployed URLs.
- The authenticated production session used earlier in this release confirmed projects, commercial sales, inventory, users/RBAC, customers and existing UAT records. That Chrome session disconnected before this expanded run; no password or secret was retrieved to recreate it.
- Detailed workflow/UI interaction evidence was captured from `/design-preview` locally on the exact deployed source SHA. This proves interaction and layout behavior, not persistence.
- Exact-head GitHub workflows all passed: CI, Security, KAAF, Auth session, Seed, Phase 5, Phase 6, Phase 6.5 and Phase 7 deployment rehearsal.
- Local source/contract suites passed 14/14 API tests and 9/9 commercial UI contracts. Database-backed E2E commands could not run locally because `DATABASE_URL` and UAT credentials are intentionally absent; this is an environment blocker, not a functional failure.

## Workflow results

| ID | Workflow | Result | Evidence / notes |
| --- | --- | --- | --- |
| UAT-001 | Web health | PASS | `/api/health` returned HTTP 200. |
| UAT-002 | API readiness and database | PASS | `/api/v1/health/ready` returned HTTP 200; database healthy. |
| UAT-003 | Login page | PASS WITH UX NOTE | Correct fields and mandatory-field focus. Mobile reflows without horizontal overflow. |
| UAT-004 | Password recovery entry | PASS | Clear email-only flow and 30-minute copy; SMTP delivery not submitted in this run. |
| UAT-005 | Expired/missing session | FAIL UX | Protected shell and data-load error can flash before redirecting to login. Redirect should be immediate. |
| UAT-006 | Production preview isolation | PASS | `/design-preview` returns 404 in production. |
| UAT-007 | Arabic shell/navigation | PASS | Unified KYNOX shell, RTL ordering, real navigation controls and Arabic operational labels. |
| UAT-008 | Desktop layout containment | PASS | No page-level horizontal overflow in audited states. |
| UAT-009 | Mobile 390×844 containment | PASS | `scrollWidth == clientWidth` on audited public/session state. |
| UAT-010 | Project portfolio list | PASS READ PATH | Authenticated production list previously loaded the UAT project; public unauthenticated access is blocked. |
| UAT-011 | Multiple project selector | PASS PREVIEW | Five projects are selectable; active-project summary changes are represented. |
| UAT-012 | Executive dashboard | PASS WITH COPY DEBT | KPIs, project cards and model area render. Some technical/accessibility labels remain English. |
| UAT-013 | Admin project model upload | PARTIAL / PREVIEW ONLY | GLB upload control exists in preview. No production API-backed upload proof. |
| UAT-014 | Project gallery/media repository | PARTIAL / PREVIEW ONLY | Project library concept exists; real object-storage upload/email reuse remains unverified. |
| UAT-015 | Building/floor navigation | PASS PREVIEW | Building and 18-floor selector respond; floor inventory context is clear. |
| UAT-016 | Floor layout hotspots | PASS PREVIEW | Clicking hotspot A-1201 selects the correct available unit and refreshes the detail drawer. |
| UAT-017 | Inventory filters/table | PASS PREVIEW | Type/status/view filters and six-unit table are present. Arabic view still exposes `1BR`, `2BR`, `3BR`, `Studio`. |
| UAT-018 | Interest form opens | PASS FUNCTION / FAIL VISUAL | Correct dialog semantics and fields. Desktop and mobile dialogs open partly outside the visible viewport after scrolling. |
| UAT-019 | Interest evidence upload | PARTIAL | File input exists; native chooser text remains English in Arabic UI; real upload persistence not verified. |
| UAT-020 | Reservation form opens | PASS FUNCTION / FAIL VISUAL | Available unit enables booking dialog. Dialog is clipped above the viewport after scrolling. |
| UAT-021 | Reservation persistence | BLOCKED | Exact production mutation not repeated after authenticated session disconnected; published price/payment-plan gate remains required. |
| UAT-022 | Customer cumulative ledger | PASS PREVIEW | Eight customers with project, unit, owner, status, next action and value. |
| UAT-023 | Customer full file | PASS FUNCTION / FAIL VISUAL | Button works and opens full interaction history. Modal top is clipped when opened from a scrolled page. |
| UAT-024 | Lead stage progression | PASS CONTRACT / PRIOR PROD | Governed API and prior production UAT advanced `NEW → CONTACTED`; current full browser mutation not repeated. |
| UAT-025 | Activity logging | PASS CONTRACT / PRIOR PROD | Prior production UAT persisted a governed activity; contract remains green. |
| UAT-026 | Bulk contacts/campaign import | PASS VISIBILITY / BLOCKED INGESTION | CSV mode, validation and preview contract pass. Real production file ingestion remains unverified. |
| UAT-027 | Transfer totals reconciliation | PASS | 14 ready + 20 awaiting documents = 34 active. Government review and stalled counts are clearly subsidiary states. |
| UAT-028 | Transfer file document list | PASS PREVIEW | Nine customer-specific document rows show status and upload/replace action. |
| UAT-029 | Manager review gate | PASS FUNCTION / FAIL VISUAL | Review dialog lists every document, correction actions, reviewer note and final approval. Dialog positioning/scrolling is awkward and top content can be clipped. |
| UAT-030 | Government channel | PASS AS DEFERRED | UI clearly says integration is deferred and R4C does not issue title deeds. |
| UAT-031 | Sales operations page | PASS FUNCTION / FAIL HIERARCHY | Inquiry, opportunity, activity and linked inventory controls exist. Hero title consumes most of the first viewport. |
| UAT-032 | Team/tasks/alerts/performance | PARTIAL PREVIEW | Navigation and designed surfaces exist; production persistence and role-specific dashboards are not proven. |
| UAT-033 | User directory | PASS READ PATH | Protected administrator retained; role/deactivation controls disabled for `islam@kynox.io`. |
| UAT-034 | RBAC matrix | PASS | ADMIN 88, SALES_AGENT 14, SALES_MANAGER 17, VIEWER 12. Exact-head auth/security workflows pass. |
| UAT-035 | BIM processing | DEFERRED SERVICE | Production preview is isolated and queue/service credentials are not claimed operational. |
| UAT-036 | Cost/progress/UX journeys | PASS CI / LOCAL ENV BLOCKED | Exact-head CI passed; local rerun requires absent DB/UAT environment contract. |

## UI and accessibility findings

### P1 — release-blocking for operational acceptance

1. **Dialogs are not viewport-safe after page scroll.** Interest, reservation, customer-file and manager-review dialogs can open with their header and first fields outside the visible viewport. On mobile the interest title becomes nearly invisible against the white panel. Evidence: `10`, `11`, `12`, `14`, `16` screenshots.
2. **Authenticated production UAT cannot be called complete.** The expanded run lost its authenticated browser session. Real CSV ingestion, pricing/payment-plan setup, hold/reservation confirmation, uploads, manager approval persistence and role-negative browser cases remain unexecuted on production.
3. **Several requested admin capabilities are still preview concepts.** Project-model upload, gallery/media repository, transfer-file uploads, team/task assignment and performance dashboards need authoritative API-backed production UI evidence.

### P2 — important usability defects

4. **Sales Operations hero is oversized.** It consumes most of a desktop viewport before operational controls, repeating context already shown by the shell and active-project selector.
5. **Session expiry causes a protected-shell flash.** Users briefly see the authenticated shell and a generic API error before redirection. This weakens trust and creates unnecessary recovery friction.
6. **Arabic mode still contains technical English.** Unit types (`1BR`, `2BR`, `3BR`, `Studio`), `SAR` in some figures, English accessible names such as the building/floor status-control label, and the native file chooser appear inside Arabic flows.
7. **Dense dark-on-dark secondary text.** Several KPI captions, descriptions and disabled states have low apparent contrast at normal desktop zoom.
8. **Navigation density remains high.** Header actions, sidebar, five dashboard tabs, five project pills and section-level tabs compete for attention before core work.

### Accessibility risks

- Dialog semantics are present, but focus trapping, initial focus, Escape handling and focus return were not proven.
- Clipped dialogs are a keyboard and zoom-resilience risk because the close control/header can start outside the viewport.
- Several icon-only controls rely on accessible names, but one important floor-status group name remains English in Arabic mode.
- Native file inputs do not maintain locale consistency.
- Screenshot evidence cannot establish complete WCAG compliance, screen-reader order or keyboard-only completion.

## Recommended release order

1. Fix all dialog containers: `position: fixed; inset: 0; overflow: auto; align-items: flex-start` at small heights, viewport padding, `max-height`, internal scroll, visible header, focus trap and focus return.
2. Reduce the Sales Operations hero by at least 45–55% and bring the first actionable cards above the fold.
3. Redirect missing/expired sessions before rendering authenticated chrome; replace the generic data error with a login transition.
4. Localize visible unit-type names, currency display and accessible labels; wrap the native file input in a fully localized custom control.
5. Connect admin media/model/document/task/performance surfaces to governed APIs and storage, then repeat production UAT with ADMIN, SALES_MANAGER, SALES_AGENT and VIEWER.
6. Complete one disposable end-to-end production scenario: customer → lead → consent → activity → unit → published price → payment plan → hold → manager-confirmed reservation → transfer documents → manager approval. Record and clean up all `UAT-*` artifacts through a controlled procedure.

## Evidence files

Screenshots `01`–`16` are stored beside this report. Production screenshots cover session handling, login/recovery and preview isolation. Local exact-SHA screenshots cover the detailed operational UI states.

## Local remediation rerun — 2026-08-27

The release-blocking visual defects identified above were corrected locally and the same high-risk states were rerun against `/design-preview` in Arabic.

| Area | Before | Rerun result |
| --- | --- | --- |
| Interest dialog, 390×844 after deep scroll | Opened above the viewport; title was clipped/low contrast | PASS — bounding box `top 8`, `bottom 836`, viewport `844`; internal scrolling retained and Arabic title uses `rgb(16, 47, 67)` on white. |
| Reservation and transfer-review overlays | Fixed overlays inherited the page position from animated/perspective ancestors | PASS — overlay now anchors to viewport; transfer review measured `top 16`, `bottom 884` in a 900px viewport. |
| Customer full-file dialog | Header clipped after opening from scrolled ledger | PASS — measured `top 16`, `bottom 560.75` in a 900px viewport. |
| Sales Operations hierarchy | Hero dominated the first viewport | PASS — compact hero is 136px, 15% of a 900px viewport. |
| Missing/expired session | Protected shell could render before session verification | FIXED IN SOURCE — authenticated children are gated behind the session check; production verification remains pending deployment. |
| Arabic unit/file controls | Raw bedroom codes, English floor ARIA name and native chooser chrome | PASS IN PREVIEW — localized bedroom display, Arabic floor-control name and localized file-selection control. |

Automated rerun: TypeScript PASS, commercial UI contracts 9/9 PASS, production build PASS. Remaining release gates are unchanged: authenticated production mutations, API-backed persistence for preview-only capabilities, focus trap/return automation, and role-specific production UAT.
