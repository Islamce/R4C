# Production audit observations

## Initial route visit

**URL requested:** `https://r4c.kynox.io/commercial`

**Observed behavior:** The route redirected to `/login` and displayed a controlled-access login screen for the Alomran Development tenant. The page exposed email and password fields, a Sign in action, and a Forgot password link. No commercial dashboard content was accessible without credentials.

**Evidence:** Browser screenshot saved at `/home/ubuntu/screenshots/r4c_kynox_io_2026-08-16_22-14-59_9347.webp`; extracted page text saved at `/home/ubuntu/page_texts/r4c.kynox.io_login.md`.

**Audit implication:** Production interaction testing is blocked by authentication. Source-level and existing automated-test inspection can continue; production credentialed workflow validation requires a user-provided test account or connected authenticated browser session.


## Authenticated commercial command center

The user authenticated successfully in My Browser. The production `/commercial` route rendered the bilingual commercial workspace for the Alomran Development tenant. Visible navigation includes Developments and Commercial sales; the commercial workspace contains Executive overview, Project & unit control, Title transfer file, and Sales operations tabs. The executive overview displayed a project selector, Export report control, 3D development hero, portfolio KPIs, project portfolio table, sales-vs-construction area, lead conversion, financial analysis, and closing summary. The visible KPI values matched the static arrays observed in source (`Riyadh Heights`, 320 units, 196 sold, 78 available, 52 leads, SAR 412.6M), confirming the dashboard is currently snapshot/static rather than live aggregated from the authenticated tenant.

The screenshot from the authenticated page is available in the browser result for this task; the captured HTML is `/home/ubuntu/upload/r4c.kynox.io_commercial_1786919305476.html`.


## Project and unit control

The Project & unit control tab rendered successfully. It showed construction 62%, current phase Structure, 320 total units, 78 available, 46 held/reserved, 18 floors, Building A/B navigation, floor buttons, search, unit-type/status/view filters, a unit table, an interactive floor layout, selected-unit detail, price history, buyer activity evidence, Record interest, and Create reservation actions.

The selected unit table and hotspot/detail panel were internally consistent for A-1204. The page labels the inventory “live commercial status,” but the visible records still match the static source arrays and source-derived values; this should be treated as a production data-trust issue until verified against API responses. Attempting to change the project selector with the input helper failed because the control is a native select; the selector remained usable via direct browser interaction. No data mutation was performed.


## Arabic and RTL audit

The language switch successfully changed navigation, headings, controls, and overall layout to RTL. The sidebar moved to the right and the commercial tabs, header controls, KPI cards, unit table, and selected-unit panel remained visually aligned without obvious clipping at the observed desktop viewport.

The translation is incomplete. Several visible strings remained English in Arabic mode, including “Portfolio current view,” “Building A,” “Building B,” “All unit types,” “Studio,” “2BR,” “3BR,” “All statuses,” “Available,” “Reserved,” “Sold,” “All views,” “Park,” “City,” “live commercial status,” “Floor 12 layout,” “North,” “Interest,” “Type,” “Construction,” “Price history,” and buyer-activity evidence. Floor buttons also showed mixed Arabic and English (“الدور 18 6 units · 2 available”). This is a high-priority bilingual completeness and RTL-quality issue even though the layout direction itself worked.


## Title-transfer readiness

The Arabic title-transfer tab rendered a readiness dashboard with 34 transfers in progress, 19 ready for handoff, 3 awaiting documents, 5 in government review, 2 blocked, and SAR 84.6M in closing value. It exposed a project selector, export-list action, a transfer table, a selected RH-A-1204 readiness file, evidence checks, a missing RETT reference, an awaiting mortgagee approval item, document-request action, readiness approval action, and a government-channel submission action. The explanatory copy correctly states that final transfer occurs through an approved government service and that R4C prepares and governs the file rather than issuing title deeds. However, several KPI sublabels remained English (“Portfolio current view”), and the visible records match static source arrays.

The Arabic Sales operations tab initially displayed a loading state (“جارٍ تحميل مساحة العمل التجارية…”) after navigation. Further wait-state verification is required before judging the live lead/hold/reservation workflow.


## Sales operations workflow

After waiting, the authenticated Arabic Sales operations workspace loaded successfully. It showed the operator journey from lead to reservation, a refresh action, lead-capture form with name, phone, email, source, project, enquiry consent, and marketing consent, plus own/all lead filters. The current tenant returned an empty lead state: “No leads available.” Because no lead records were present, I did not create or mutate any data. The live workflow therefore loaded successfully, but hold, reservation, activity, unit drawer, and approval states could not be exercised without seeded records.

Switching back to English returned the executive overview. The English page was structurally complete at the observed desktop viewport, but the static KPI labels and values remained unchanged, reinforcing the data-provenance issue documented above.

