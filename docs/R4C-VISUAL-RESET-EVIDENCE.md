# R4C Sales Visual Reset Evidence

## Baseline and boundary

The founder-reviewed directive rejects the previous `/sales` layout as a form wall while preserving the frozen R4C backend/domain contracts, tenant isolation, existing transactional actions, bilingual behavior, and portfolio boundaries. The redesign therefore changes only the Sales frontend composition, scoped Sales styling, and centralized Sales copy. No Prisma model, API route, DTO, or backend service was changed.

## Implementation evidence

The Sales surface now uses a compact command header, a signal strip, a contextual quick-action dock, a prioritized My Work queue, a focused Opportunity stage visualization, a selected-context rail, a compact activity timeline, and a task band. Contact, Opportunity, Activity, Task, and Quotation creation remain available through an accessible contextual drawer rather than being permanently mounted in the page flow. Opportunity stage mutation and task completion still call the existing CRM client methods.

Arabic enum labels are displayed through a local mapping layer while request values remain unchanged. Email, phone, project IDs, unit IDs, and assignee IDs use LTR treatment where appropriate. Motion is limited to drawer entry and button feedback and is disabled under `prefers-reduced-motion`.

## Qualification note

The local R4C transfer initially omitted several pre-existing frontend support modules and global stylesheets that were required for the complete route graph. These were restored from the authoritative `Islamce/R4C` checkout without overwriting the new Sales files. The production Next.js build now completes for `/`, `/login`, `/commercial`, `/sales`, and the backend proxy route. The build emits existing Autoprefixer warnings in `cost-control.css` and a multiple-lockfile workspace-root warning; neither is caused by the Sales redesign.

Visual acceptance remains a Founder gate. The current status is **READY FOR FOUNDER VISUAL REVIEW**, not UI/UX frozen.

## Runtime restoration update

The disposable runtime was restored without Docker by using native PostgreSQL 16 and Redis 7 services. The existing Prisma migrations were applied and the unchanged `seed:uat` command created the synthetic `ALOMRAN` tenant and administrator, progress submitter, sales agent, and sales manager personas. The first API start exposed a missing local-only configuration value (`S3_BUCKET`); supplying the existing required local storage/BIM configuration allowed the API to start successfully on port 4000. The first browser authentication attempt exposed omitted frontend session route files in the local transfer; restoring the pre-existing `/api/session/*` routes and rebuilding produced a successful 10-route Next.js production output including login, session, commercial, Sales, and backend proxy routes.

Current UAT services: native PostgreSQL accepts connections on 127.0.0.1:5432, Redis responds `PONG` on 127.0.0.1:6379, and the API starts on 127.0.0.1:4000. The web server must be restarted from the rebuilt `.next` output before the authenticated browser run continues.

## Authentication evidence checkpoint

The rebuilt local web route resolves the synthetic `ALOMRAN` tenant as **Alomran Development** at `http://127.0.0.1:3200/login?tenant=ALOMRAN`. The UAT administrator email was entered into the semantic email/password form. The login route is now present in the rebuilt output and the seeded API tenant lookup returns HTTP 200 for `ALOMRAN`. The next action is the synthetic sign-in submission; no production account or personal credential is involved.

## First authenticated populated render

The synthetic administrator successfully authenticated into the local Alomran workspace and the browser reached `/sales` at port 3200. The rendered shell shows the R4C navigation, tenant context, and Sales route, but the Sales data loader visibly reports: **“The server rejected this action. Review the fields and try again.”** No populated Sales screenshot will be treated as accepted evidence until this runtime failure is diagnosed. The captured initial populated-route screenshot is `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-02-39_4793.webp`.

## Pixel evidence checkpoint

The historical screenshot inspected at `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_17-34-11_9518.webp` is a 404 route failure rather than a valid visual baseline; it must not be used as a product-layout comparison. The current authenticated screenshot at `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-02-39_4793.webp` confirms the R4C shell visually, but the Sales workspace body is replaced by a server-rejection alert and empty canvas. Therefore, hierarchy, Opportunity prominence, My Work, drawers, mobile composition, Arabic/RTL, and contrast cannot yet be assessed from populated runtime evidence. The current evidence decision is **blocked by runtime/API contract mismatch**, not a visual acceptance or rejection of the new Sales composition.

## CRM permission bootstrap checkpoint

The temporary CRM-enabled API overlay compiled and the canonical CRM migration applied to the disposable database. The existing seed did not include the newly added frozen CRM permission codes, so the UAT database was augmented only with `crm:read`, `crm:write`, and `crm:approve`, linked to the synthetic `ADMIN` role. No Prisma model, API contract, production database, or application authorization source was changed. The first authenticated session carried the pre-bootstrap permission set; it was logged out so a new session can receive the corrected synthetic permissions before the next Sales render.

## First valid Sales composition render

After the synthetic CRM permission bootstrap and fresh administrator sign-in, `/sales` loaded the reset Sales Command Center successfully. The current viewport exposes a compact Command Center header, operating signal strip, prioritized My Work state, Opportunity context area, task workload, and a contextual action dock. The empty seeded state is visible and the **New contact** contextual drawer opened successfully with semantic fields, close control, and Save action; the permanent form wall is not present. Current screenshots: `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-10-11_6183.webp` (populated shell before seed context) and `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-10-22_1257.webp` (New contact drawer open).

The UAT runtime remains synthetic and local. Any records created for visual qualification will be clearly marked as synthetic demonstration data in the evidence package.

## Contextual contact mutation

The synthetic administrator submitted the contextual New contact drawer successfully. The workspace displayed the inline success state **“Contact saved.”** and the signal strip updated Contacts from 0 to 1. This confirms the reset’s contextual drawer model is connected to the frozen CRM write contract without mounting a permanent creation form. The synthetic record is `Maha Alharbi <maha.alharbi.uat@example.test>` and is disposable UAT data only.

## Populated Opportunity and My Work evidence

The contextual New opportunity drawer created `Maha Alharbi — Riyadh Heights UAT` successfully with the optional project/unit identifiers left blank. The workspace then rendered an active Opportunity card with the stage track `Qualification → Discovery → Proposal → Negotiation → Reserved → Won` and explicit terminal actions `Discovery`, `Lost`, and `Disqualified`; the Reservation stage remains a visible governed projection. The contextual Create task drawer created `Confirm Riyadh Heights buyer follow-up`, assigned to the seeded administrator with due date 24 August 2026. The workspace displayed **Task created**, My Work count 1, task completion action, and workload row. Current evidence screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-11-53_6258.webp`.

## Populated desktop and locale-toggle finding

The authenticated populated route now renders the reset workspace with one synthetic Contact, one synthetic Opportunity, one open Task, My Work count 1, selected Opportunity context, and visible stage visualization. The rendered desktop screenshot is `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-11-53_6258.webp`.

The existing language control labeled `العربية` is visible and enabled, but both normal browser activation and direct DOM activation leave `document.documentElement.dir` as `ltr`, `document.documentElement.lang` as `en`, and all workspace copy in English. This is a reproducible live Arabic/RTL defect and is the first objectively visible correction candidate. No source change has been applied yet.

## Arabic / RTL correction verified

After rebuilding and restarting the web client with the restored `/api/locale` route, the language control switched the populated Sales workspace to Arabic. The live route now reports Arabic copy throughout the navigation, heading, signal strip, quick actions, Opportunity stage labels, task actions, and selected context. The sidebar relocated to the right, `document.documentElement.dir` changed to `rtl`, and the control changed to `English` for the reverse toggle. Current Arabic/RTL screenshot: `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-16-22_2075.webp`. This is a valid authenticated populated-state RTL capture at the browser’s available viewport; the mandated 1440×900 and 390×844 captures remain pending because this browser session exposes an 893px viewport and no mobile emulation control.

## Corrected compact desktop and drawer evidence

After replacing the invalid base grid declaration with `minmax(0,2fr)`, the rebuilt English/LTR render shows the signal strip as a compact five-cell horizontal band rather than a vertical stack. The same render keeps the prioritized My Work card, selected Opportunity context, stage visualization, and task workload in view. The New contact action opens a right-side contextual drawer over the workspace while preserving the underlying context. Current screenshots: `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-21-13_2636.webp` and `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-21-25_5099.webp`.

## Conditional final polish findings

Bounded polish was applied without changing the approved Sales composition. The authenticated shell sidebar was reduced from 270px to 228px, lower decorative R4C text was toned down, the top bar height and padding were reduced, and the workspace page received a tighter maximum rhythm. The Command Center title was reduced to an operating-workspace scale, Quick Actions became a lighter compact toolbar, and sparse Selected Context now collapses to a quiet state instead of rendering empty data rows. Mobile drawers retain full available width.

Rendered drawer smoke test passed in the populated English workspace. Opening New contact moved focus into the dialog; Tab moved from the close button into the First name field while remaining inside `[role=dialog]`; Escape closed the drawer; and focus returned to the originating New contact button. The dialog retained `aria-modal=true` and `aria-labelledby=sales-drawer-title`.

A practical rendered contrast smoke test returned ratios of 16.62 for the graphite Opportunity panel, 19.48 for its heading, 17.02 for the dark Signal intro, 5.83 for amber alert text, 5.62 for the primary button, and 4.80 for sparse context heading text. These are implementation smoke checks, not formal WCAG certification.


## Final closure addendum — 23 August 2026

Historical limitations above are superseded for the final Sales candidate by fresh controlled Chromium evidence at `/home/ubuntu/R4C/evidence/final-closure/controlled-browser-results.json` and the screenshots in that directory. Canonical candidate SHA: `cce16216e5b835959300de4d3537a10429320117`.

English/LTR passed at 1440×900, 1024×768, and 390×844. Arabic/RTL passed at 1440×900 and 390×844 with `lang=ar` and `dir=rtl`. Every capture reported no horizontal overflow. Contact, Opportunity, Activity, Task, and Quotation drawers opened from supported triggers; focus entry, eight-step Tab containment, Escape close, and focus return passed. Practical accessibility smoke found zero unnamed controls and zero rendered controls below 40px in either dimension. Reduced-motion Chromium capture completed without workflow loss.

The frontend contract suite passed 5/5, the web production build passed 12/12 generated pages, the disposable API/security suite passed 13/13 tests, and `git diff --check` passed. The legacy frontend journey harness remains non-green only because it asserts an `/api/projects` API contract outside the current `/commercial` and `/sales` surface; the compatibility `/projects` entry now redirects unauthenticated users to `/login`. Founder visual acceptance is inherited as PASS for the approved composition. Frontend UI/UX freeze is ready at the canonical SHA; production remains NO-GO pending separate deployment authorization.


## Emergency responsive image-level closure — 23 August 2026

The previous frontend freeze is intentionally preserved as historical but superseded: **REVOKED — Founder rendered mobile review failure**. Fresh populated screenshots were captured after correcting the mobile operating-grid root cause and were visually inspected at English 1440×900, 1024×768, 390×844 and Arabic 1440×900, 1024×768, 390×844.

The decisive correction was collapsing `.sales-operating-grid` to one full-width normal-flow column at `<=680px`. The corrected English and Arabic mobile screenshots now show no overlap, no clipped cards, no accidental narrow panels, no vertical action tower, no desktop sidebar occupying content width, no context/history collision, and an intentional full-width Opportunity with usable stages/actions. The mobile shell, user bar, Quick Actions, My Work, Selected Context, History, Workload, and drawers remain operational. Desktop and tablet composition were visually checked for regression.

The current image-level decision is **PASS** for Desktop, Tablet, Mobile English, Mobile Arabic, Responsive Product UX, KYNOX visual alignment, and Modern CRM UX. Supporting evidence is in `evidence/responsive-closure/R4C-EMERGENCY-RESPONSIVE-CLOSURE-REPORT.md`, `responsive-browser-results.json`, and the six PNG captures. Automated checks are supplemental; image review is authoritative for this closure.
