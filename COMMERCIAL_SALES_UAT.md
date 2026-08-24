# Commercial Sales Workspace UAT

Date: 2026-08-24  
Market context: Saudi real-estate sales organization  
Route: `/design-preview` (production route remains `/commercial`)

## Acceptance results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Arabic-first RTL workspace and typography | Passed | Full shell rendered in Arabic using local Noto Kufi Arabic fonts. |
| KYNOX Portfolio branding and icon family | Passed | Blueprint-dark theme and Phosphor icons verified in browser. |
| General workspace without a forced project name | Passed | Project is selected only through `نطاق العرض`. |
| Correct Saudi sales terminology | Passed | Leads, interests, temporary reservations, and confirmed bookings use corrected Arabic labels. |
| Project-level operational lists | Passed | Project filter updates all four stage lists and their counts. |
| Cumulative customer ledger | Passed | Ledger includes customer, mobile, project/unit, owner, status, contact, next action, and value. |
| Search | Passed | Searching for `نورة` returned one correct ledger record. |
| Add lead | Passed | New lead appeared in the selected stage and cumulative ledger; total changed from 8 to 9. |
| Advance lifecycle status | Passed | New lead advanced from `عميل محتمل` to `اهتمام`; latest state and counts updated. |
| Customer intelligence panel | Passed | Selection updates identity, project, unit, source, owner, next action, value, and interaction history. |
| Full customer file | Passed | `فتح الملف الكامل` opens a modal dossier containing contact, project/unit, owner, value, current status, source, next action, and interaction history. |
| Customer follow-up from full file | Passed | `إنشاء مهمة متابعة` closes the dossier and displays a confirmation assigned to the current sales owner. |
| Modern account header | Passed | At 862 × 698 the account identity, ADMIN status, language action, and preview status render in a compact modern header. |
| KYNOX concept brand symbol | Passed | The legacy R4C text tile is replaced by a blueprint-building Phosphor mark consistent with the KYNOX icon system. |
| Project media repository | Passed | Each project exposes its own approved brochures, galleries, plans, presentations, and campaign designs through `مكتبة المشروع`. |
| Media project switching | Passed | Changing the project updates the available media cards and selected-material detail panel. |
| Customer email handoff | Passed | An approved material opens an Arabic email composer, validates the recipient, attaches the selected material, and adds the message to the sending queue with confirmation. |
| Team task assignment | Passed | A manager can enter a task, choose a team member, due date, and priority; submission adds the task and sends an assignment notification. |
| Task completion | Passed | A task can be closed from the team board and updates the assigned representative's evaluation feedback. |
| Operational alerts | Passed | The performance workspace highlights unattended customers, overdue tasks, and positive target exceptions. |
| Sales representative evaluation | Passed | The dashboard compares lead load, response time, conversion, bookings, value, team ownership, and weighted score for four representatives. |
| New module responsive layout | Passed | Media, task, alert, and performance views remain navigable at the annotated 862 × 698 viewport. |
| Arabic title-transfer queue | Passed | Project names, buyer names, values, blockers, handoff status, KPI captions, and selectors are Arabic in RTL mode. |
| Arabic transfer-file checklist | Passed | Seller/buyer identity, title deed, IBAN, tax reference, subdivision, mortgagee approval, contract, evidence, and readiness states are fully localized. |
| Transfer queue reconciliation | Passed | The queue contains 34 unique transfer files; the portfolio KPI is derived from the same collection and the project view explicitly shows its subset, e.g. `7 من أصل 34` for Riyadh Heights. |
| Transfer document upload | Passed | Every checklist item exposes a PDF/image upload or replacement control and retains the selected filename against the active customer transfer file. |
| Manager/supervisor review gate | Passed | A dedicated dialog presents all nine customer documents individually with review, approve, correction, note, role-separation, and final-readiness controls. |
| Deferred government integration blueprint | Passed | The integration contract, exchange method, authentication placeholder, endpoint, payload manifest, and audit data are defined while connection testing remains disabled pending authority agreement. |
| Reservation from unit layout | Passed | `إنشاء حجز` opens an Arabic customer/reservation form, changes the unit to `محجوزة`, creates an `RSV-*` reference, and displays confirmation. |
| Reservation synchronization | Passed | The new reservation appears in the sales pipeline and cumulative customer ledger with the unit and customer linked. |
| Responsive KYNOX navigation at 862 × 698 | Passed | Sidebar remains a compact 104px icon rail; the commercial tabs fit without the previous horizontal waste. |
| Selected-unit Arabic content | Passed | Status, type, areas, view, prices, construction, measurements, dates, buyer activity, and actions are Arabic. |
| Browser console | Passed | No console errors after filter, search, create, and advance actions. |
| Web TypeScript | Passed | `npm run typecheck`. |
| Commercial contract tests | Passed | 4/4 via `npm run test:commercial-workflow`. |
| API build | Passed | `pnpm build` in `apps/api`. |
| Web production build | Passed | `npm run build` in `apps/web`. |
| Legacy UX-loop E2E | Environment blocked | Test requires `JOURNEY_UAT_ADMIN_PASSWORD`; no credential was exposed or invented. |

## UAT conclusion

The modified commercial sales workspace passes its functional and visual acceptance scope, including the annotated 862 × 698 customer-file, header, brand, unit-control, media-library, team-task, and performance states. The credential-gated legacy E2E remains an environment prerequisite, not a product failure.
