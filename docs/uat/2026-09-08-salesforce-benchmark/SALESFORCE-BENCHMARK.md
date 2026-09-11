# R4C commercial workspace benchmark against Salesforce Sales Cloud

Date: 2026-09-08

## Scope and evidence

This benchmark compares the current R4C commercial workspace on PR #91 with the
standard interaction model and documented capabilities of Salesforce Lightning Sales
Console / Agentforce Sales. R4C evidence was captured from the working local preview in
this audit run. Salesforce capability evidence is limited to current official Salesforce
Help and product documentation; no authenticated Salesforce customer org was available,
so this is not a pixel-level audit of a configured Salesforce implementation.

## Executive verdict

R4C should not imitate Salesforce's visual skin. It should retain the compact KYNOX
blueprint-dark identity and its stronger real-estate execution model, while adopting
Salesforce's record-centric operating model: clear objects, a persistent record workspace,
guided stages, related information, inline actions, forecasting, and automation.

R4C is already a credible specialized sales-operations product, but it is not yet a broad
CRM platform. Its strongest advantage is the direct connection between customer demand,
physical units, pricing, reservations, construction progress, cost, and title transfer.

## Scorecard

| Area | R4C maturity | Salesforce benchmark | Direction |
|---|---:|---:|---|
| Navigation and visual identity | 7/10 | 9/10 | Keep KYNOX identity; simplify hierarchy and improve responsive density. |
| Lead worklist productivity | 7/10 | 9/10 | Keep Kanban/table/split and add inline edit, sorting, pinned/shared views, and charts. |
| Record workspace | 6/10 | 9/10 | Add highlights, guided stage path, activity/details/related tabs, and contextual actions. |
| Core CRM data model | 5/10 | 10/10 | Separate Lead, Account, Contact, Opportunity, and Activity concepts. |
| Real-estate commercial execution | 9/10 | 5/10 without customization | Preserve units, prices, holds, reservations, payment plans, and transfers as the differentiator. |
| Forecasting and pipeline inspection | 4/10 | 10/10 | Add value, probability, close date, forecast category, rollups, and change inspection. |
| Automation and engagement | 3/10 | 10/10 | Add routing rules, reminders, cadences, approvals, and email/calendar capture. |
| Configuration and extensibility | 3/10 | 10/10 | Add configurable stages, layouts, fields, views, and role dashboards incrementally. |
| Analytics and AI assistance | 2/10 | 10/10 | Start with deterministic alerts and next actions before predictive scoring or agents. |
| Governance, tenant isolation, and audit | 8/10 | 10/10 | Keep permission-first APIs and expand business-event visibility in the record timeline. |

## Current R4C strengths

1. The worklist supports table, Kanban, and split modes, project/stage filtering, search,
   saved views, quick lead capture, and activity logging.
2. The split workspace provides a useful transition toward Salesforce Console-style
   list-plus-record operation.
3. The domain model already governs unit availability, pricing revisions, holds,
   reservations, payment plans, transfer documents, and status transitions.
4. Permission checks, tenant scoping, concurrent-state protection, and append-only audit
   events provide a strong base for enterprise workflows.
5. Arabic/English support and RTL behavior are native rather than retrofitted.

## Highest-impact gaps

1. **No full opportunity model.** A Lead currently carries much of the commercial journey.
   R4C needs a formal Opportunity after qualification, with amount, probability, expected
   close date, stage history, loss reason, products/units, competitors, owner/team, and
   forecast category.
2. **The selected-record workspace is too narrow.** Add a Salesforce-like highlights
   panel and stable tabs for Activity, Details, Related, Documents, Reservation, and
   Transfer, with a guided stage path and the next valid action.
3. **Pipeline management lacks forecast intelligence.** Add weighted value, commit/best
   case/pipeline categories, period rollups, movement since last review, stalled-deal
   alerts, and manager inspection.
4. **Views are not yet enterprise-grade.** Add multi-column sorting, configurable columns,
   inline editing, view pinning/sharing, chart toggle, and remembered default views.
5. **Engagement remains manual.** Add assignment rules, SLA-based follow-up, email/calendar
   capture, reusable cadences, templates, notification routing, and approval queues.
6. **Navigation has three competing levels.** Keep the compact vertical product rail, but
   make the second level object-oriented and reserve the third level for record context.
7. **The interface is visually dense.** Improve typographic contrast, compact-but-readable
   row heights, responsive behavior, and the selected-record panel's width and containment.

## Recommended target architecture

### Phase 1 — Salesforce-grade operating surface

- Object navigation: Leads, Accounts, Contacts, Opportunities, Units, Reservations,
  Transfers, Tasks, Reports.
- One reusable object-home pattern: saved view picker, search, filters, display selector,
  refresh, chart, inline-edit table, and Kanban where stages apply.
- One reusable record workspace: highlights, guided path, quick actions, Activity, Details,
  Related, Documents, and audit timeline.
- Preserve the compact KYNOX rail and blueprint-dark visual system.

### Phase 2 — Revenue management

- Introduce Opportunity and Opportunity Stage History.
- Add amount, probability, close date, unit/product lines, owner/team, and loss reasons.
- Add forecasting rollups, pipeline-change inspection, manager dashboard, and overdue-risk
  queues.

### Phase 3 — Automation and engagement

- Assignment and escalation rules.
- Activity capture integrations for email/calendar and supported messaging channels.
- Sales cadences, templates, reminders, approvals, and notification outbox visibility.
- Duplicate management and controlled Lead conversion into Account/Contact/Opportunity.

### Phase 4 — Intelligence

- Begin with explainable rules for lead priority, reservation expiry, missing evidence,
  stalled opportunities, and forecast risk.
- Add predictive scoring or agentic assistance only after the underlying stages, outcomes,
  and activity data are reliable enough to evaluate it.

## Evidence

The benchmark screenshots were removed from the active repository when the operator
selected newer near-accepted references. The benchmark findings remain useful as
capability guidance, but the canonical visual targets are now
`docs/design-source/near-accepted-2026-09-08/01-opportunity-detail.jpg` and
`docs/design-source/near-accepted-2026-09-08/02-opportunities-worklist.jpg`.

## Accessibility limits

The screenshots show low-contrast secondary text and a dense information layout as risks.
Keyboard order, focus visibility across every control, screen-reader announcements, zoom,
and mobile reflow require dedicated interactive testing and cannot be certified from these
captures alone.
