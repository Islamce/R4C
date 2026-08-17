# R4C Commercial Frontend: Competitive UI Audit and Refactor

## Executive assessment

R4C already has the right commercial domain primitives: project hierarchy, unit inventory, selected-unit evidence, lead capture, activities, holds, reservations, and title-transfer readiness. The weakness was not feature breadth; it was **operational composition**. The interface presented several dense dashboards as parallel destinations, while the highest-value decisions—what is blocked, what needs evidence, which unit needs attention, and what the next action is—were visually secondary.

The refactor moves R4C toward a governed commercial control room. It keeps the executive, unit, transfer, and operator modes, but adds a persistent working-context layer and an exception-first decision queue. Snapshot versus governed-live provenance remains explicit, avoiding the trust problem of calling static executive data live.

## Current layout and workflow findings

| Area | Current strength | Defect or friction | Refactor response |
|---|---|---|---|
| Executive overview | Strong portfolio metrics, project table, charts, and closing summary | Analytics appeared before action; generic KPI cards did not explain what needed attention | Add working context, data freshness, next-best-action, and a decision queue before analytics |
| Project and unit control | Deep inventory table, floor navigator, map hotspots, selected-unit drawer, price history, and evidence | High density and weak distinction between browsing, evidence, and action | Group context, inventory, map, and evidence into calmer surfaces; keep the unit drawer sticky on desktop |
| Title-transfer file | Readiness checks and controlled action language are present | Transfer readiness is separate from commercial urgency | Surface blocked/review states in the executive decision queue and preserve governed file actions in the transfer mode |
| Sales operations | Real lead-to-reservation API workflow and permission checks | Empty tenant state was too passive; operator had no explanation of what to do next | Add bilingual empty-state explanation and retain loading/permission boundaries |
| Arabic RTL | Direction switching and main layout work | Several labels were previously untranslated and mixed English/Arabic | Expand Arabic coverage across unit, executive, evidence, transfer, filter, and status language |
| Provenance | Existing source note and workflow distinction | Snapshot values risked being read as live because of visual/wording cues | Use explicit snapshot language and retain governed-live wording only for API-backed operations |
| Responsive behavior | Existing responsive breakpoints | Desktop density did not translate into a clear mobile priority order | Collapse context, attention, metrics, and work modes into a single-column decision flow |

## Competitive benchmark

| Benchmark | Product pattern | R4C opportunity |
|---|---|---|
| Salesforce Real Estate CRM [1] | Unified customer lifecycle, centralized profile, tasks, reporting, forecasting, and recommended next actions | Make the selected buyer, unit, owner, evidence, and next action feel like one connected deal record rather than separate modules |
| RE.Platform [2] | Developer-specific combination of interactive catalog, inventory, CRM, booking, payments, communication history, and analytics | Own the developer workflow by connecting project delivery, unit availability, reservation evidence, and title-transfer readiness in one visual operating model |
| SmartPM [3] | Exception-first construction portfolio dashboard with delay, quality, stale-update, health, and drill-down signals | Put blocked transfers, missing evidence, aging leads, expiring holds, and construction/commercial variance ahead of decorative analytics |
| ProjectManager [4] | Portfolio overview, filters, expandable metrics, issue management, workload, cost, schedule, shareable dashboards | Use one summary layer with controlled drill-down and make project rows, metrics, and issues visually actionable |

## New UI design direction

The recommended category position is **Governed Commercial Control Room for Saudi Development Delivery**. It is more specific than a generic CRM and more operational than a marketing dashboard.

The visual system uses blueprint navy as the authority color, teal for active commercial work, sand for attention and transfer states, coral for risk, and cool mist surfaces for separation. Large editorial headings create a clear command-center entrance. Rounded cards and translucent sticky navigation give the workspace a modern product feel without turning it into a generic SaaS template.

The interaction model is now organized around three layers. The first is a **working context bar** showing the selected project, phase, data freshness, and next-best-action. The second is the **decision queue**, which surfaces a small set of exceptions before analytics. The third is the existing work-mode canvas for portfolio, inventory, transfer, and sales operations. This preserves the current capabilities while improving decision order.

## Implemented refactor

The redesign is implemented primarily in `apps/web/app/commercial.css`, with targeted JSX additions in `CommercialWorkspaceSuite.tsx` and the existing bilingual/operator improvements preserved from the previous commits. The new context bar and exception queue are non-mutating, use the existing project/tab handlers, and remain compatible with English and Arabic labels.

The operator workspace also retains permission-gated API actions. No new mutation path was introduced. The tenant empty state now explains how to create or refresh lead data rather than presenting an unexplained blank panel.

## Validation and acceptance criteria

| Check | Result |
|---|---|
| Web type-check | Passed |
| Commercial workflow contract tests | Passed: 4/4 |
| Production build | Passed |
| `git diff --check` | Passed |
| Local preview render | Passed; extracted page includes context bar and decision queue |
| Arabic RTL | Source-level coverage preserved; deployed visual confirmation should follow deployment |
| Mobile layout | Responsive CSS added for context, queue, metrics, tabs, hero, unit drawer, and summary grid |
| Production data mutation | None performed |

## Recommended next product steps

The next product increment should connect the executive and inventory snapshot arrays to live aggregation endpoints, then drive the new decision queue from real exceptions: stale lead, expiring hold, missing document, blocked transfer, and pricing review. Once those signals are live, R4C will have a defensible product difference: a commercial workspace that explains not only what is happening, but what must happen next and why.

## References

[1]: https://www.salesforce.com/crm/real-estate-crm/ "Salesforce Real Estate CRM"
[2]: https://re-platform.io/ "RE.Platform — Ecosystem for Real Estate Developers"
[3]: https://smartpm.com/company-dashboard "SmartPM — One Dashboard for All Your Construction Projects"
[4]: https://www.projectmanager.com/software/dashboard "ProjectManager — Project Dashboards"
