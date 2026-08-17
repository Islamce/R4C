# Commercial UI Benchmark Notes

## Reference set

The benchmark compares R4C with official descriptions of Salesforce real-estate CRM, RE.Platform for real-estate developers, SmartPM construction dashboards, and ProjectManager project dashboards.

| Capability pattern | Benchmark evidence | Implication for R4C |
|---|---|---|
| Single source of truth across the lifecycle | Salesforce frames CRM as a unified view from outreach through post-close relationships and emphasizes centralized contacts, task management, reporting, and integrations. [1] | Make the commercial workspace feel like one connected deal record, not four separate dashboards. Keep a persistent context rail for project, buyer, unit, next action, and owner. |
| Inventory, CRM, booking, and analytics in one system | RE.Platform explicitly connects interactive catalog, inventory, leads, bookings, payments, communication history, and project/rep analytics. [2] | R4C should lead with the buyer-to-unit relationship and make every handoff visible: lead, unit, hold, reservation, evidence, and title-transfer readiness. |
| Exception-first project monitoring | SmartPM highlights critical path delay, schedule quality, stale updates, health, and drill-down into projects needing attention. [3] | Replace generic KPI decoration with an attention queue: stale lead, missing document, expiring hold, blocked transfer, and construction/commercial variance. |
| Portfolio overview plus drill-down | ProjectManager describes portfolio dashboards with summary tiles, filters, expandable metrics, issue management, shareable views, and detail drill-down. [4] | Preserve the portfolio overview, but make each metric and project row actionable with clear drill-down affordances and consistent filter behavior. |
| Real-time trust and freshness | RE.Platform and ProjectManager both use real-time/always-current language as a product promise. [2] [4] | R4C must distinguish snapshot, preview, and governed live records explicitly until executive aggregates are connected to live APIs. |
| Mobile and field access | Salesforce describes access across desktop, tablet, and phone; RE.Platform advertises native mobile apps. [1] [2] | Optimize the operator workflow for narrow screens: one primary action, compact lead cards, a bottom action region, and no desktop-only data density. |

## Design direction

The competitive opportunity is not to imitate a generic CRM. R4C can own a more specific category: a **governed commercial control room for Saudi development delivery**. The UI should therefore combine four cues: a calm executive command surface, an exception queue that drives action, a buyer-to-unit deal workspace, and a transparent evidence/approval trail for reservation and title transfer.

The recommended interaction model is a persistent context rail plus a single working canvas. The rail holds project, phase, selected buyer, unit, owner, and data freshness. The canvas changes by work mode: portfolio, inventory, pipeline, or close readiness. Each mode should expose a summary, an attention queue, and a primary next action before secondary analytics.

## References

[1]: https://www.salesforce.com/crm/real-estate-crm/ "Salesforce Real Estate CRM"
[2]: https://re-platform.io/ "RE.Platform — Ecosystem for Real Estate Developers"
[3]: https://smartpm.com/company-dashboard "SmartPM — One Dashboard for All Your Construction Projects"
[4]: https://www.projectmanager.com/software/dashboard "ProjectManager — Project Dashboards"
