# R4C Real-estate CRM UX/UI audit — 2026-09-08

## Executive readout

The product has a credible commercial-sales foundation: a dark KYNOX shell, lead worklist, saved views, activity logging, unit inventory, temporary holds, reservation approval, transfer files, tasks, Arabic/English copy, and a focused record drawer. The desktop 1440px composition is visually strong and information-dense.

The largest user-facing defect is responsive behavior. At 375px the web experience remains a clipped desktop canvas; at 768px and 1024px important controls and columns still compete for width. That is a release blocker for agents working between showings. The second major risk is capability coverage: the code and preview evidence do not demonstrate the external lead/MLS ingestion, client portal, transaction milestones, commission calculation, calendar sync, dialer, or native mobile capabilities requested in the brief.

**Design debt score: 68/100 (high).** Confidence is medium: the score is based on the live local preview and repository inspection, not production telemetry, connected MLS/lead providers, or a shipped iOS/Android build. The score is weighted toward the confirmed mobile breakage and unverified core workflows; it does not imply the product is unsafe or unusable on desktop.

## Scope, evidence, and limits

- Audited product: R4C commercial workspace in `R4C-internal-redesign`, route `/design-preview`, current local build.
- Current-run screenshots: 1440px desktop, 1024px tablet, 768px tablet, and 375px mobile. The attached `Photo 1.jpg` is a small scope mind-map, not an application screen, so it was used only to confirm the requested evaluation areas.
- Repository evidence reviewed: `SalesPipelineWorkspace.tsx`, `CommercialOperatorWorkspace.tsx`, `CommercialWorkspaceSuite.tsx`, `commercial-api.ts`, `commercial.controller.ts`, Prisma commercial models, and `sales-pipeline.css`.
- No connected Zillow, Realtor.com, Facebook, MLS, Google Calendar, Outlook, telephony, push-notification, camera, biometric, or native mobile test environment was available. Those items are therefore marked **not evidenced**, not declared absent.
- Preview records are hypothetical fixture data. No secrets or real customer records are included in this report.

## Audit steps and health

| Step | Evidence collected | General health |
|---|---|---|
| 1. Desktop pipeline at 1440px | Live screenshot and DOM snapshot of pipeline, KPIs, saved views, Kanban cards, and record drawer | Good visual baseline; dense but coherent |
| 2. Tablet at 1024px | Fresh screenshot of shell, toolbar, stage columns, and detail region | Needs responsive refinement; width pressure visible |
| 3. Tablet at 768px | Fresh screenshot and DOM snapshot | Poor; horizontal competition/cropping remains |
| 4. Mobile at 375px | Fresh screenshot | Critical; desktop canvas is clipped instead of reflowing |
| 5. Workflow/API inspection | React actions, API routes, and Prisma models | Partial foundation; many requested real-estate workflows not evidenced |
| 6. Native mobile capability check | Repository and available runtime inspection | Not evidenced; no native iOS/Android build in scope |
| 7. Competitive benchmark | Official vendor feature pages and Salesforce documentation | Clear parity gaps in integrations, automation, and client-facing surfaces |

## Findings

### P0 — release blockers

#### 1. Mobile web is a clipped desktop canvas

- **Severity:** Critical
- **Category:** Mobile / Visual
- **Issue:** At 375px, the sidebar/content relationship does not become a mobile information architecture. The pipeline toolbar, cards, and right-side record content are cropped or pushed outside the viewport; an agent cannot reliably scan a lead or complete an action one-handed.
- **Recommendation:** Introduce an explicit mobile shell below 720px: fixed bottom navigation or a hamburger drawer, `min-width: 0` on every grid child, no page-level horizontal overflow, and a lead-card list as the default view. Move record details and actions into a bottom sheet/full-screen route. Preserve horizontal scrolling only inside intentionally labelled tab strips or dense data tables. Test at 375px with keyboard and dynamic text scaling.
- **Reference:** `02-mobile-375.png`, pipeline canvas and sidebar; CSS shell rules in `apps/web/app/sales-pipeline.css:221`.

#### 2. Tablet breakpoints still expose width pressure

- **Severity:** High
- **Category:** Mobile / Visual
- **Issue:** At 1024px and 768px, the compact rail, command bar, stage grid, and record surface compete for width. Dense controls and table-like regions remain difficult to scan and some content is visibly truncated.
- **Recommendation:** Treat 1024px as a tablet layout, not a smaller desktop: collapse the rail to an icon drawer, stack search/actions into two rows, switch Kanban to a horizontally paged stage view, and convert ledger rows to cards below 900px. Add visual regression snapshots at 1440/1024/768/375 to CI.
- **Reference:** `03-tablet-1024.png` and `04-tablet-768.png`.

### P1 — workflow and parity gaps

#### 3. Lead-source ingestion is not demonstrated

- **Severity:** High
- **Category:** Workflow
- **Issue:** The UI/API supports manual lead creation, CSV-style bulk contacts/campaign import, assignment, qualification, activities, and saved views, but no Zillow, Realtor.com, Facebook Lead Ads, webhook adapter, source health, or deduplication flow is evidenced.
- **Recommendation:** Add a source-adapter layer with provider-specific webhooks, idempotency keys, consent/source metadata, duplicate merge review, routing rules, retry/dead-letter status, and a visible source badge on every lead. Provide a connection-health screen and a “last imported” timestamp.
- **Reference:** `CommercialOperatorWorkspace.tsx:10-22`, `CommercialWorkspaceSuite.tsx:440-455`; absence of provider adapters in the inspected API surface.

#### 4. Pipeline vocabulary is not the requested New → Qualified → Showing → Offer → Closed journey

- **Severity:** High
- **Category:** Workflow
- **Issue:** The current stage mapping is `lead → interest → hold → booking` (`QUALIFIED/CONTACTED → interest`, `APPOINTMENT/NEGOTIATION → hold`, `RESERVED/WON → booking`). It is understandable for unit reservations, but it hides Showing, Offer, Closed, lost reasons, and conversion history.
- **Recommendation:** Keep reservation stages as a specialized path, but add a configurable Opportunity stage path with explicit Showing, Offer, Closed-Won, Closed-Lost, and reason codes. Show a guided stage path on the record, required exit criteria, stage aging, and conversion timestamps.
- **Reference:** `SalesPipelineWorkspace.tsx:90-109`; current stage cards in `02-mobile-375.png` and `01-web-desktop-1440.png`.

#### 5. Record model is lead/customer-centric rather than CRM record-centric

- **Severity:** High
- **Category:** Workflow
- **Issue:** Inspected Prisma models include `Customer`, `Lead`, `SalesActivity`, `SavedLeadView`, `UnitHold`, `Reservation`, `SalesTask`, and `TransferCase`, but no explicit Account, Contact, Opportunity, Campaign, Quote, Forecast, Territory, or commission object. This makes brokerage reporting, household relationships, and multi-opportunity history difficult.
- **Recommendation:** Introduce Account/Household, Contact, Opportunity, Property/Listing, Campaign, Quote, CommissionPlan, and Forecast aggregates with tenant-safe relationships. Add a controlled lead-conversion flow that preserves the original source and activity history.
- **Reference:** `apps/api/prisma/schema.prisma:832-957`; the related-record strip in `SalesPipelineWorkspace.tsx:417`.

#### 6. MLS/property-search experience is not evidenced

- **Severity:** High
- **Category:** Workflow
- **Issue:** The preview contains project/unit inventory and media, but no MLS listing feed, map search, polygon drawing, filter chips, saved-search alerts, side-by-side property comparison, or property-card fields matching the brief (price, beds/baths, square footage, DOM, status).
- **Recommendation:** Build a listing search surface with map/list split, viewport/polygon search, debounced filters, chips, saved alerts, MLS attribution/freshness, and compare up to four listings. Standardize cards with price, bed/bath, area, DOM, status, photo count, and next action.
- **Reference:** `CommercialWorkspaceSuite.tsx` inventory tabs and `CommercialInventory.tsx`; no map/listing search route found in the inspected commercial code.

#### 7. Client portal and white-label readiness are not evidenced

- **Severity:** High
- **Category:** Workflow / Visual
- **Issue:** The audited workspace is agent/operator-facing. No buyer/seller portal evidence was found for saved searches, favorites, appointments, secure messaging, branded domain/theme, or brokerage-level white-label settings.
- **Recommendation:** Define a separate client shell with saved searches, favorites, appointment history, document requests, and status timeline. Make brand, domain, email/SMS sender, locale, and consent settings tenant-configurable; never expose internal notes or assignment data.
- **Reference:** Current route `/design-preview`; inspected commercial tabs are pipeline, portfolio, units, transfer, and operations.

#### 8. Transaction checklist and commission split are incomplete/not evidenced

- **Severity:** High
- **Category:** Workflow
- **Issue:** Holds, reservations, transfer cases, document rows, and tasks exist, but no milestone-based closing checklist (contract, disclosure, inspection, financing, appraisal, closing) or transparent agent/broker split calculator is evidenced.
- **Recommendation:** Add a transaction object with milestone templates, owner/due date/status, required document types, versioning, e-sign status, audit trail, and blocking rules. Add commission inputs for gross commission, sides, split %, cap/desk fees, referral, tax/adjustments, and a preview of agent/broker/net totals with an auditable calculation breakdown.
- **Reference:** `apps/api/prisma/schema.prisma:869-957`; transfer UI in `CommercialWorkspaceSuite.tsx:1293+`.

#### 9. Calendar and communications hub are only partial

- **Severity:** High
- **Category:** Workflow / Mobile
- **Issue:** Activity types include call, email, WhatsApp, meeting, site visit, follow-up, and note, and tasks can be created. There is no evidence of threaded SMS/email/call history, dialer, showing windows/open-house scheduling, Google/Outlook sync, conflict detection, or actionable call/text handoff.
- **Recommendation:** Create a contact-centric unified timeline with provider/channel attribution, attachments, delivery state, and call recording links where permitted. Add calendar OAuth/sync, showing windows, open houses, travel buffers, conflict warnings, and one-tap call/text actions.
- **Reference:** `CommercialOperatorWorkspace.tsx:10`, `SalesPipelineWorkspace.tsx:213`, `commercial-api.ts:104-113`.

### P2 — quality, accessibility, and reliability risks

#### 10. Dense controls and repeated summaries create cognitive load

- **Severity:** Medium
- **Category:** Visual / Workflow
- **Issue:** The desktop surface repeats suite tabs, workspace tabs, saved-view controls, project scope, stage links, KPI strips, and card actions before the agent reaches the record details. This supports power users but makes the “next best action” unclear.
- **Recommendation:** Use progressive disclosure: one primary command bar, a compact KPI summary, one stage/path control, and a single record action rail. Move secondary filters into a filter drawer and expose a “next action due” queue as the first mobile module.
- **Reference:** `01-web-desktop-1440.png`, pipeline header and worklist toolbar.

#### 11. Accessibility needs instrumented verification

- **Severity:** Medium
- **Category:** Accessibility
- **Issue:** The code includes visible `:focus-visible` styling and labelled controls, which is a good baseline. Screenshots alone cannot verify keyboard order, focus trapping in drawers/modals, screen-reader announcements, error association, contrast at every state, or color-blind-safe status encoding. Several secondary labels appear below the requested 14px reading target in the dense dark workspace.
- **Recommendation:** Run axe plus keyboard and screen-reader passes. Enforce a 44×44px touch target, 14–16px body text, WCAG AA contrast, semantic headings/landmarks, `aria-live` for async notices, focus return on close, and text/icon/status labels that do not rely on hue alone. Test Arabic RTL and 200% zoom.
- **Reference:** `foundation.css` focus rules; `01-web-desktop-1440.png` and `02-mobile-375.png` dense labels.

#### 12. Performance, offline mode, and error recovery are not measured

- **Severity:** Medium
- **Category:** Performance
- **Issue:** The local preview renders successfully, but no production measurement demonstrates a sub-2-second property list, image lazy loading/optimization, offline contacts/properties, cache age, or helpful stale-data/MLS failure messaging.
- **Recommendation:** Set budgets (LCP ≤2.5s, list interaction ≤100ms, image size/AVIF targets), paginate/virtualize long lists, lazy-load media, and add service-worker caching for recently viewed records. Show explicit recovery copy such as “MLS unavailable — showing cached results from 10 minutes ago” with retry and timestamp.
- **Reference:** Local preview only; inventory/media surfaces in `CommercialWorkspaceSuite.tsx` and `CommercialInventory.tsx`.

#### 13. Native mobile capabilities are not evidenced

- **Severity:** Medium
- **Category:** Mobile
- **Issue:** No native iOS/Android project or device build was in the audited scope, so offline detail, actionable push notifications, business-card scanning, listing-photo auto-upload, Face ID/Touch ID, and thumb-zone patterns cannot be confirmed.
- **Recommendation:** Treat these as a mobile product workstream. Start with a responsive PWA or native shell for offline read cache, push deep links (“New Zillow lead — tap to call”), camera OCR/contact creation, listing media upload queues, and biometric unlock backed by platform secure storage. Validate permission denial and background-upload states.
- **Reference:** Repository scope and `/design-preview`; no native mobile source found during inspection.

## Competitive benchmark

| Product | Evidence-backed strength | Gap to close in R4C |
|---|---|---|
| Follow Up Boss | Centralizes leads from 200+ sources, configurable routing (round robin/first-to-claim), Smart Lists, calendar, calling, texting, email, automations, and mobile apps. [Official lead-routing overview](https://www.followupboss.com/features/lead-routing) | Source adapters, speed-to-lead routing, action plans, unified inbox, and mobile parity |
| LionDesk / Lone Wolf Relationships | LionDesk materials describe Zillow/Trulia/Realtor.com imports, lead routing, branded email/text campaigns, video messaging, tasks, transaction plans, and desktop/mobile access; the product is now presented as Lone Wolf Relationships. [CRMLS feature overview](https://go.crmls.org/wp-content/uploads/2019/02/LionDesk_2019v2.pdf), [Lone Wolf transition](https://accounts.liondesk.com/signup) | Communication automation, campaign segmentation, video/SMS, and clearer current-product positioning |
| kvCORE | Current market positioning is an all-in-one real-estate CRM/IDX/marketing benchmark (vendor pages were not available in this audit environment for a primary-source citation) | IDX/MLS website, lead capture, automated nurture, behavioral scoring, and marketing controls |
| Chime | Combines customizable IDX, MLS syndication, lead capture, Facebook forms, lead routing, smart action plans, power dialer, AI assistant, listing alerts, transactions, reporting, and mobile app. [CRM features](https://chime.me/feature/crm), [IDX](https://chime.me/feature/idxsite), [lead-generation flow](https://chime.me/real-estate/lead-generation) | IDX/MLS search, automated nurture, dialer, dynamic scoring, listing alerts, and client-facing web experience |
| Propertybase | Propertybase Salesforce documents Closing/Offer objects, related records, tasks/activities, custom commission fields, and forecasting. [Closing workflow](https://help.propertybase.com/hc/en-us/articles/115002218091-Getting-Started-Series-Managing-Closings) | Formal Offer/Closing/Commission objects, milestone checklist, related-record architecture, and forecastability |
| Salesforce Sales Cloud | Lightning Sales Console provides a highlights panel, record workspace, related lists, split view, list views, Kanban grouping, guided selling, forecasting, and core Lead/Account/Contact/Opportunity/Activity objects. [Console](https://help.salesforce.com/s/articleView?id=sf.console_lex_sales_intro.htm&language=en_US&type=5), [Kanban](https://help.salesforce.com/s/articleView?id=xcloud.kanban_use.htm&language=en_US&type=5), [Sales Cloud](https://www.salesforce.com/sales/cloud/guide/) | Adopt the record-centric shell and guided path while retaining KYNOX’s domain-specific reservation/unit strengths |

## Prioritized roadmap

### Quick wins — 0–2 weeks

1. Fix the 375px/768px shell: bottom navigation, card/list default, no page overflow, full-screen record sheet, and 44px targets.
2. Reduce the pipeline command bar to one primary action; move saved-view/filter controls into a drawer.
3. Add explicit stage, source, freshness, and “next action due” badges; show lost reason and stage age.
4. Add loading, empty, retry, and stale-data states; instrument Web Vitals and list-load timing.
5. Run axe/keyboard/RTL checks, correct contrast and small text, and add screenshot regression tests at all four breakpoints.

### Short term — 2–8 weeks

1. Add Account/Contact/Opportunity/Listing foundations and a guided conversion/stage path.
2. Implement lead adapters for Zillow, Realtor.com, Facebook, and manual/CSV with dedupe, consent, routing, and health monitoring.
3. Build MLS/map search, polygon filters, saved alerts, compare view, and normalized property cards.
4. Add showing/open-house calendar with Google/Outlook sync and a threaded communication hub/dialer integration.
5. Add transaction milestones, document vault/e-sign status, and commission split calculator.
6. Create the first buyer/seller portal shell with tenant branding and permissions.

### Long term — 2–6 months

1. Ship native/PWA mobile workflows: offline cache, push deep links, camera/OCR, media upload queue, and biometric unlock.
2. Add automation/cadences, lead scoring, forecasting, brokerage/team analytics, and SLA monitoring.
3. Expand white-label controls, partner integrations, audit/export tooling, and localization/dynamic type coverage.

## Recommended acceptance gates

- At 375px, every lead can be opened, called, advanced, assigned, and logged without horizontal page scrolling.
- A Zillow/Realtor/Facebook test lead arrives once, retains consent/source metadata, routes correctly, and shows retry state on provider failure.
- A listing search supports map/list, polygon, saved alert, compare, and required card fields.
- A transaction shows milestone completion, required documents, audit history, and a reproducible commission calculation.
- Keyboard, screen reader, RTL, 200% zoom, WCAG AA contrast, and offline/error scenarios pass a documented test script.

## Enhancement pass completed — 2026-09-08

The P0 responsive findings from this audit were implemented in `apps/web/app/sales-pipeline.css` and `SalesPipelineWorkspace.tsx`: the commercial shell now switches to bottom navigation at tablet/mobile widths, the command bar stacks without clipping, Kanban stages become touch-friendly cards on mobile, ledger rows become compact cards, and each lead card exposes its next action. Typecheck and all 12 commercial workflow contract tests pass. Post-fix captures and the comparison record are in `design-qa.md`.
