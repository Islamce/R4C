# R4C Sales Before–After Visual Review

## Executive decision

The approved Sales composition is **conditionally accepted with Founder visual acceptance inherited** and is ready for frontend UI/UX freeze. The former form-wall problem is resolved. This pass applied only bounded presentation and interaction polish: a less dominant shell, a tighter operating title and top bar, a lighter Quick Actions toolbar, adaptive sparse Selected Context, and keyboard-safe contextual drawers. The backend, CRM domain, lifecycle states, authorization, Reservation authority, project hierarchy, and product scope remain unchanged.

The UI/UX/frontend candidate is **frozen for the accepted Sales surface** after fresh controlled Chromium evidence at 1440×900, 1024×768, and 390×844, Arabic/RTL captures, five-drawer focus checks, practical accessibility smoke, and reduced-motion verification. The separate legacy journey harness remains non-green only because it asserts an `/api/projects` API contract outside the current `/commercial` and `/sales` surface.

## Candidate and runtime boundary

| Item | Current truth |
|---|---|
| Repository | `/home/ubuntu/R4C` |
| Branch | `master` |
| Candidate identity | `cce16216e5b835959300de4d3537a10429320117` |
| Browser route | `http://127.0.0.1:3001/sales` in disposable local UAT |
| Runtime | Disposable PostgreSQL 16, Redis 7, synthetic Alomran tenant, CRM-enabled temporary UAT overlay |
| Synthetic data | Alomran Development; synthetic administrator; synthetic Contact, Opportunity, and Task |
| Production | Not used, not deployed, and not authorized by this review |

## Before → After comparison

The rejected BEFORE state was a permanent creation-form wall with weak hierarchy, excessive vertical length, a low-signal Opportunity presentation, and heavy card treatment. The AFTER state preserves the approved operating canvas: Command Center header, Signal Strip, contextual Quick Actions, My Work, active Opportunity panel, selected context, timeline, task workload, and contextual drawers.

| Criterion | BEFORE | AFTER | Result |
|---|---|---|---|
| Modern CRM UX | Permanent forms dominated the workspace | Contextual creation drawers keep actions available without occupying the canvas | PASS at controlled populated viewports |
| Hierarchy | Oversized/low-signal composition | Reduced shell dominance, smaller operating title, signal-first layout, My Work first | PASS at controlled populated viewports |
| Quick Actions | Creation controls were part of the wall | Compact contextual toolbar with existing actions only | PASS |
| Selected Context | Empty values could create a large visual block | Sparse state collapses to a quiet message; populated values remain visible | PASS by source and populated sparse render |
| Opportunity | Weak stage emphasis | Actual lifecycle stages, current/completed/future states, stage actions preserved, quotation action reachable from selected context | PASS at controlled populated viewports |
| My Work | Giant empty or form-adjacent area | Prioritized task queue with due, priority, context, and completion action | PASS with synthetic populated task |
| KYNOX grammar | Weak identity and excessive outline noise | Graphite focus surface, mineral-neutral canvas, teal verified flow, restrained amber attention, reduced depth | PASS at controlled populated viewports |
| Arabic/RTL | Not accepted | Populated translation, RTL sidebar relocation, RTL drawer direction, enum display mappings | PASS at controlled desktop and mobile viewports |
| Drawer accessibility | Not verified | Initial focus enters dialog, Tab remains contained, Escape closes, focus returns to trigger, named close control and dialog semantics present | PASS for practical smoke checks |
| Mobile operating UX | Not available | Controlled 390×844 populated capture preserves Quick Actions, My Work, Opportunity stages, quotation action, task queue, and no horizontal overflow | PASS |

## Evidence inventory

| Evidence | Classification | Result |
|---|---|---|
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_17-34-11_9518.webp` | Historical rejected BEFORE | Retained only as historical 404/infrastructure evidence |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-02-39_4793.webp` | Historical runtime blocker | Superseded; not current acceptance evidence |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-21-13_2636.webp` | Populated English/LTR BEFORE polish | Valid populated baseline for the approved reset before bounded polish |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-21-03_5166.webp` | Populated Arabic/RTL BEFORE polish | Valid available-viewport RTL baseline |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-21-25_5099.webp` | Contextual drawer BEFORE polish | Valid available-viewport drawer baseline |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-47-41_1386.webp` | Populated English/LTR AFTER polish | Compact shell/title/Signal Strip/Quick Actions and sparse context visible |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-47-54_9942.webp` | Contact drawer AFTER polish | Drawer overlay and consistent form rhythm visible |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-48-19_6901.webp` | Keyboard interaction AFTER polish | Focus visibly moved into First name after Tab |
| `/home/ubuntu/screenshots/127_0_0_1_2026-08-23_18-48-35_8214.webp` | Escape/focus-return AFTER polish | Drawer closed and originating New contact trigger regained focus |

## Accessibility and interaction checks

The practical rendered smoke check confirmed a dialog with `role=dialog`, `aria-modal=true`, and `aria-labelledby=sales-drawer-title`. The first focusable control was inside the drawer, Tab moved into the first form field without leaving the dialog, Escape closed the drawer, and focus returned to the originating trigger. Native labels and controls, visible focus styling, status/alert roles, and the existing reduced-motion CSS path remain in place. This is not a formal WCAG certification.

The rendered contrast smoke check returned ratios of 16.62 for the graphite Opportunity panel, 17.02 for the dark Signal intro, 5.83 for amber alert text, 5.62 for the primary button, and 4.80 for sparse-context heading text. The available browser could not be resized programmatically, so touch and controlled mobile layout results remain unverified.

## Qualification matrix

| Gate | Status |
|---|---|
| Frontend contract tests | PASS — fresh 5/5 |
| Web production build | PASS — fresh 12/12 static pages; `/api/locale`, `/projects`, and `/sales` present |
| Frontend type validation | PASS through production build type phase |
| Synthetic populated CRM journey | PASS — Contact, Opportunity, and Task drawer mutations succeeded |
| English desktop | PASS — controlled 1440×900 |
| Arabic desktop/RTL | PASS — controlled 1440×900, `lang=ar`, `dir=rtl` |
| Contextual drawers | PASS — Contact, Opportunity, Activity, Task, and Quotation opened; focus contained, Escape closed, focus returned |
| Tablet 1024×768 | PASS — populated capture with no horizontal overflow |
| Mobile 390×844 | PASS — populated capture with no horizontal overflow |
| Arabic mobile | PASS — populated RTL capture with no horizontal overflow |
| Reduced motion | PASS — reduced-motion Chromium context completed without workflow loss |
| Touch targets | PASS practical smoke — 18 controls inspected, zero rendered controls below 40px |
| Screen-reader smoke | PASS practical naming smoke — 18 controls, zero unnamed controls; formal assistive-technology certification out of scope |
| Negative browser paths | PASS server evidence — fresh disposable API security suite 13/13; legacy journey remains stale on `/api/projects` |
| Backend freeze | PRESERVED |
| Scope drift | PASS |
| R4C standalone isolation | PASS |
| Production | NO-GO; separate release authorization required |

## Resolved issues

The missing frontend `/api/locale` route was restored using the established `r4c_locale` cookie contract. The invalid base Signal Strip grid declaration was corrected so the KPI band renders horizontally. The earlier API-checkout mismatch was resolved for synthetic UAT through a temporary, non-committed CRM-enabled runtime overlay and synthetic-only permission bootstrap; no backend source was changed.

## Final status

**DESKTOP VISUAL:** PASS — controlled 1440×900
**TABLET VISUAL:** PASS — controlled 1024×768
**MOBILE OPERATIONAL UX:** PASS — controlled 390×844
**ARABIC DESKTOP:** PASS — controlled 1440×900, `lang=ar`, `dir=rtl`
**ARABIC MOBILE:** PASS — controlled 390×844, `lang=ar`, `dir=rtl`
**DRAWERS:** PASS — all five drawers with focus containment, Escape close, and focus return
**OPPORTUNITY VISUALIZATION:** PASS — controlled populated viewports
**KYNOX VISUAL ALIGNMENT:** PASS — Founder visual acceptance inherited; controlled evidence current
**MODERN CRM UX:** PASS — controlled populated viewports
**ACCESSIBILITY:** PASS practical smoke; no formal WCAG certification claim
**NEGATIVE PATHS:** PASS by fresh server evidence; stale legacy frontend journey documented
**UI/UX/FRONTEND FREEZE:** READY TO FREEZE at canonical SHA `cce16216e5b835959300de4d3537a10429320117`
**PRODUCTION:** NO-GO
**DEADLINE BEFORE 25 AUGUST 2026:** GREEN — final Sales evidence gates closed
