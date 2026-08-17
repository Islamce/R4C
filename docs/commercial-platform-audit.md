# R4C Commercial Platform Audit and Implementation Review

**Repository:** `Islamce/R4C`  
**Reviewed commit:** `1ab27d8`  
**Implementation branch:** `feat/commercial-command-center-hardening`  
**Implementation commit:** `be8fcf9`  
**Production route reviewed:** `https://r4c.kynox.io/commercial`  
**Review date:** 17 August 2026

## Executive summary

R4C has a credible commercial foundation: the codebase contains tenant-aware project, building, floor, unit, price, payment-plan, lead, customer, activity, hold, and reservation entities; governed permission checks exist in the API; and the production sales-operations workspace is connected to live commercial endpoints. The bilingual operator journey, reservation approval gate, inventory hierarchy, and existing contract tests are valuable assets. The largest product risk is not the absence of a commercial concept, but the split between the live operator surface and the static executive, unit, and title-transfer dashboards. The deployed route could not be tested beyond the login boundary because no authenticated test session was available.

The implementation completed in this review hardens the current command center without replacing its architecture. It adds a functional CSV export, explicit provenance messaging that distinguishes snapshot dashboards from live sales operations and development-only preview data, and accessible tab/panel semantics. The change deliberately does not fabricate live aggregation, create a false government title-transfer integration, or bypass authorization. The next release should connect the executive and inventory dashboards to the same project and unit records already exposed by the governed API, then add dedicated dashboards for sales, financials, construction, collections, forecast, and risk.

## Scope and evidence standard

The review used four evidence classes. **Observed directly** means visible in the repository or production route. **Confirmed through documentation** means stated by an official vendor source. **Inferred recommendation** means a product recommendation derived from the gap between R4C and market patterns; it is not a claim that a competitor has a specific implementation.

| Evidence class | Meaning in this review |
|---|---|
| Observed directly | Confirmed from repository source, automated tests, generated architecture context, or the unauthenticated production route. |
| Confirmed through documentation | Confirmed from an official product or documentation page; vendor claims are not treated as independent verification. |
| Inferred recommendation | A proposed R4C capability or correction based on observed gaps and documented market patterns. |

## Current-state audit

### Strengths observed directly

The generated architecture context identifies `apps/api` as a NestJS API governing commercial inventory, projects, documents, approvals, and progress, and `apps/web` as the Next.js client containing commercial inventory, executive dashboards, and the IFC viewer. The API exposes project hierarchy endpoints for phases, buildings, floors, unit types, and units, plus price revisions, payment plans, holds, reservation confirmation, customers, leads, sales activities, and assignee management. Permission keys include tenant-scoped commercial read, lead ownership, customer creation, hold creation and release, reservation confirmation, pricing, payment-plan access, and administrative management.

The production operator workspace is materially more complete than the executive shell. It loads leads, activities, assignees, available units, current prices, and payment plans; supports lead progression and disqualification; supports reassignment subject to permissions; records activities; creates and releases holds; and confirms reservations only when the payment-plan and review gates are satisfied. Existing contract tests cover production entry, permission-based authorization, shared English/Arabic i18n, RTL-safe CSS, and the bounded browser proxy. Authenticated production QA later confirmed that the commercial route, executive overview, unit-control tab, title-transfer tab, and sales-operations loading state all render successfully for the Alomran Development tenant. The tenant had no available leads, so no mutation was performed.

### Issue register

| Severity | Exact area | Evidence | Root cause | Recommended correction | Acceptance criteria |
|---|---|---|---|---|---|
| Blocker for production QA | `/commercial` production route | Direct visit redirected to `/login`; no authenticated session was available. | Credentialed QA access was not available for this review. | Provide a seeded UAT account or authenticated browser session and rerun the full workflow matrix. | Every required commercial workflow is exercised in production or a production-equivalent tenant with evidence. |
| High | `CommercialWorkspaceSuite.tsx` executive and unit dashboards | Project, unit, and title-transfer arrays are hardcoded in the component. | The shell was delivered before live aggregation endpoints were connected. | Replace static aggregates with tenant-scoped queries over project, unit, lead, reservation, payment, progress, and transfer-readiness records. | Changing project/building/floor filters updates KPIs, charts, tables, layouts, and detail drawers from the same records. |
| High | Executive metrics | Static values are presented as current portfolio intelligence. | No visible provenance or snapshot distinction existed. | Add source/as-of metadata and suppress unsupported metrics until their aggregation is live. | Every KPI shows source, as-of date, scope, and a loading/empty/error state. |
| High | Required dashboard coverage | Current suite has four tabs: executive overview, project/unit control, title transfer, and sales operations. | The wider dashboard catalogue has not yet been surfaced as dedicated tabs. | Add dedicated Sales, Financial, Project, Construction, Inventory, Lead Funnel, Salesperson, Attribution, Reservations, Collections, Forecast, Transfer Readiness, and Risk tabs. | Each tab has defined KPIs, filters, drill-down, related table, export, and bilingual labels. |
| High | Title transfer | Static rows and readiness labels exist, but no dedicated title-transfer controller route was found in the commercial controller. | Transfer readiness is currently a presentation layer rather than a governed domain workflow. | Model readiness checklist, evidence, reviewer, exception, approval, and submission package as governed records. Keep external submission explicitly optional. | A user can prepare, review, approve, export, and audit a readiness file without any claim of direct government integration. |
| Medium | Report export | The original Export report button had no action. | Interaction was visual-only. | Implement a scoped export with provenance and record status. | Clicking export downloads a named CSV containing the selected project snapshot, unit rows, and matching transfer rows. |
| Medium | Tabs | Original buttons lacked explicit `role=tab`, panel linkage, and keyboard tab indexing. | Accessibility semantics were incomplete. | Add tab/panel relationships and preserve visible focus styles. | Screen readers expose tab state and active panel; keyboard users can reach all tabs. |
| Medium | Preview operations | Development preview uses local state and simulated notices. | Preview is intentionally disconnected from production APIs. | Keep preview separated and label it prominently as development-only; never expose it as production data. | Preview copy warns users not to use it for operational decisions and production uses the live operator component. |
| Medium | Mobile and RTL | The source sets `dir` at the suite level and uses bilingual labels; full authenticated visual QA was not possible. | Layout behavior needs browser validation across real content and devices. | Run desktop, tablet, and mobile RTL/LTR snapshots with seeded data, including tables, drawers, maps, and forms. | No horizontal overflow, clipped controls, or reversed monetary/date semantics at supported widths. |
| Low | CSS build warnings | Production build completed with existing autoprefixer warnings in cost-control styles. | Existing CSS uses browser-compatibility-sensitive flex alignment values. | Replace mixed-support `start`/`end` values with `flex-start`/`flex-end` where appropriate. | Production build completes without avoidable CSS warnings. |

## Market benchmark matrix

The matrix below distinguishes direct R4C observation from official vendor documentation and recommendation. A blank or “not verified” cell is intentional; competitor functionality has not been invented.

| Capability | R4C observed directly | Reterra documented | Salesforce documented | Oracle Unifier documented | Yardi documented | R4C opportunity |
|---|---|---|---|---|---|---|
| Executive portfolio dashboards | Static portfolio shell | Portfolio intelligence, dashboards and forecasts | Reporting, analytics and unified customer views | Graphical dashboards and KPI charting | Portfolio and investment reporting | Connect KPIs to governed records and as-of metadata. |
| Project, building, floor and unit hierarchy | API and admin inventory UI | Listings and property operations | Property CRM concepts, not a direct unit-control proof | Portfolio/location structures | Property and asset structures | Make hierarchy the shared inventory spine for every dashboard. |
| Unit availability and pricing | API exposes units and published prices; suite snapshot is static | Listings and sales management | Property/deal data and forecasts | Demand and occupancy analytics | Leasing and property operations | Add live status, price history, and availability filters. |
| Lead capture and pipeline | Live lead API, statuses, activities, assignees | AI listing and CRM, lead tracking | Centralized contacts, lead scoring, automation and forecasts | Configurable business processes | Marketing and leasing solutions | Add funnel, source attribution, SLA, next action, and conversion analytics. |
| Customer 360 and evidence | Customer and consent fields exist in lead contracts | Unified sales engine and communication claims | Unified customer profile and lifecycle history | Real-estate data management | Tenant/customer and property operations | Add one governed customer record across sales, reservation, payments, and transfer. |
| Hold, reservation, cancellation | Hold creation/release and reservation confirmation are live | Payments and digital contracting are documented | Deal workflow and automation are documented | Business-process approvals are documented | Lease/payment workflows are documented | Add reservation queue, expiry alerts, approval history, and cancellation reasons. |
| Payment plans and collections | Payment plans are live for reservation confirmation; collections dashboard not found | Integrated payment gateways documented | Automation and reporting documented | Lease billing/invoicing documented | Accounting and procure-to-pay documented | Add installment ledger, due/paid/overdue state, receipts, and aging. |
| Contracts and title transfer | Reservation snapshot exists; title transfer is static readiness UI | Digital contracting with Nafath where enabled | Contract generation is documented | Approvals and transactions documented | Transaction and financial lifecycle documented | Add document/evidence readiness without claiming government integration. |
| Construction progress | Separate progress and BIM modules exist; commercial suite shows static progress | Not the primary documented focus | Project/task management documented | Construction transaction management documented | Asset/property operations documented | Join unit/project sales context to WBS progress and exceptions. |
| Financial intelligence | Cost-control dashboard exists outside commercial suite | Analytics and pricing forecasts documented | Forecasting and reporting documented | Portfolio financial/transaction visibility documented | Investment, financial and debt oversight documented | Add revenue, cash-flow, forecast, variance, and exposure views. |
| Alerts, approvals, audit | API permissions and audit service exist; reservation gate exists | Compliance and official integrations claimed | Automation and next-best actions documented | Alerts, approvals and business rules documented | Connected/governed platform positioning documented | Surface approval queues, exceptions, SLA breaches, and audit history. |
| Arabic and KSA readiness | English/Arabic provider and RTL direction observed; production visual QA blocked | Arabic-first and KSA compliance documented | Mobile/global CRM documented, not KSA-specific | Global documentation | Global platform | Complete Arabic copy, RTL table behavior, KSA dates/currency, and evidence labels. |
| Mobile experience | Responsive styling exists but production QA was blocked | Branded websites/resident app documented | Mobile CRM documented | Web workflow documentation | Mobile operations documented | Establish mobile acceptance suite for field sales and approvals. |
| 3D/digital twin | Commercial 3D hero and IFC viewer exist | Not verified as a direct Reterra capability | Not a direct real-estate CRM proof | Not verified as a 3D capability | Not verified as a digital-twin capability | Keep 3D tied to explainable project/unit/progress context, not decoration. |
| Reporting and exports | Export control was previously inert; now CSV export is implemented | Data exports on request documented | Reporting and analytics documented | Drill-down and dashboards documented | Reporting and portfolio analytics documented | Add server-side export profiles and audit each export. |

The vendor evidence supports a consistent market pattern: successful platforms converge around a governed system of record, workflow automation, portfolio analytics, mobile access, and role-specific action queues. Reterra is particularly relevant to the Saudi context because its official site emphasizes Arabic-first experience, KSA compliance, sales, analytics, payments, and digital contracting where enabled [1]. Salesforce documents unified customer records, lead scoring, automation, tasks, forecasting, and reporting [2]. Oracle documents portfolio structures, configurable business processes, alerts, approvals, dashboards, and demand forecasts [3]. Yardi documents integrated property, investment, accounting, procurement, and portfolio operations [4].

## Target commercial operating model

The recommended R4C model is a single governed commercial graph rather than a collection of dashboards. The primary relationship is:

> **Project → Building → Floor → Unit → Lead → Customer → Interest → Hold → Reservation → Contract → Payment → Sale → Title Transfer**

Project, building, floor, and unit are the inventory spine. A lead may originate from a marketing source, be associated with a project and preferred unit, and resolve to a customer record with consent and evidence. Interest records capture intent and provenance. A hold reserves a unit for a bounded period under policy. A reservation snapshots the price and payment plan and requires approval. Contracts, payments, and sale completion consume the reservation but remain auditable records. Title transfer is a readiness and submission-package workflow unless a real approved external integration exists.

| Operating area | System-of-record responsibility | Primary drill-down |
|---|---|---|
| Executive Command Center | Derived from portfolio, inventory, sales, construction, finance, and risk records | Portfolio → project → exception |
| Portfolio Analytics | Project and financial aggregate queries with as-of metadata | KPI → project → source record |
| Project Dashboard | Project, WBS, construction, sales, and forecast joins | Project → building/unit or WBS |
| Building and Floor Control | Building, floor, plan, and unit mapping | Building → floor → hotspot → unit |
| Unit Inventory | Unit status, price revisions, media, and availability | Unit → price/hold/reservation |
| Unit 360 | Unit plus buyer, reservation, payment, construction, documents | Unit → customer or readiness task |
| Lead CRM and Customer 360 | Lead, customer, consent, evidence, activities, assignee | Lead → activity/customer/unit |
| Reservations and Payment Plans | Hold, approval, reservation snapshot, installments, receipts | Reservation → payment/exception |
| Contracts and Documents | Contract metadata, document versions, signatures, evidence | Contract → document/audit |
| Construction Progress | WBS, approved progress, schedule/cost variance, unit linkage | Unit/project → WBS exception |
| Financial Intelligence | Revenue, cash flow, forecast, collections, variance | KPI → transaction/payment |
| Title Transfer | Checklist, evidence, review, approval, export package | Unit → readiness blocker |
| Approvals and Audit | Policy gates, actor, timestamp, decision, reason | Any workflow → audit event |

## Prioritized roadmap

**Immediate fixes** should focus on trust and consistency. The next release should connect dashboard aggregates to live records, add source/as-of metadata, implement loading/empty/error states, and complete authenticated browser QA. It should also expose a clear “snapshot” or “live” label wherever data is not yet real time.

**Next release** should add dedicated sales, reservation, collections, forecast, construction, financial, and risk dashboards, with shared project/building/floor filters. Each dashboard should use a common query contract so that a unit selected in a table, floor plan, or KPI drill-down resolves to the same unit detail record.

**Strategic enhancements** should include customer 360, broker and commission management, marketing attribution, document generation, configurable approval policies, payment and collection integrations, title-transfer readiness packages, mobile field workflows, and explainable AI assistance for lead prioritization and exception triage. These enhancements should follow the existing tenant isolation and role-based permission model.

## Implementation completed

The feature branch `feat/commercial-command-center-hardening` contains commit `be8fcf9`. The change preserves the existing architecture and makes three targeted improvements in `apps/web/components/CommercialWorkspaceSuite.tsx`:

1. The Export report control now downloads a scoped CSV for the selected project, including snapshot project metrics, unit rows, and matching title-transfer rows.
2. The suite now presents explicit provenance messaging: development-only preview data is marked as unsafe for operational decisions, while production distinguishes snapshot dashboards from governed live sales operations.
3. Commercial tabs now use explicit tab/panel semantics, IDs, `aria-controls`, `aria-labelledby`, and keyboard tab indexing.

Supporting evidence files were added as `docs/audit-production-observations.md` and `docs/audit-benchmark-notes.md`. No `.ai` files were hand-edited, no authorization was replaced, and no production deployment or merge was performed.

## Validation results

| Check | Result | Notes |
|---|---|---|
| Repository type-check | Passed | `pnpm --filter @r4c/web typecheck` completed successfully. |
| Production build | Passed with existing warnings | `pnpm build` compiled API and web, generated 19 static pages, and completed optimization. Existing autoprefixer warnings remain in cost-control CSS. |
| Commercial workflow contract test | Passed | Four tests passed for production entry, permission-based authorization, shared i18n/RTL-safe CSS, and bounded proxy routes. |
| Git diff check | Passed | `git diff --check` returned clean. |
| Production browser QA | Partially passed | Authenticated My Browser session verified `/commercial`, executive overview, unit control, title-transfer readiness, Arabic RTL, and sales-operations loading/empty state. |
| Full end-to-end workflow QA | Not completed | Tenant returned no lead records; hold, reservation, activity, and approval mutations were intentionally not performed without seeded test records and confirmation. |

## Remaining risks and dependencies

The main remaining risk is data trust. Authenticated production QA confirmed that the executive, unit, and transfer dashboards display the same static snapshot records identified in source, even though some UI copy describes inventory as live. Shipping the next release without connecting these aggregates would preserve a visually polished but operationally misleading surface. Arabic RTL layout worked at the tested desktop viewport, but translation coverage is incomplete: several KPI sublabels, unit filters, statuses, building/floor labels, and evidence labels remained English. The second risk is incomplete title-transfer domain modeling. R4C can safely present readiness, evidence, review, and export, but it should not claim direct government submission without an approved integration and an auditable external contract.

Other dependencies include an authenticated production or UAT account, a seeded tenant with realistic projects and sales records, decisions about payment and collection integrations, the source of marketing attribution events, broker/commission policy, document templates, and the approved Saudi regulatory evidence model. Mobile and RTL acceptance also require browser snapshots using populated content rather than only source inspection.

## Deployment recommendation

Do **not** merge or deploy this branch until the required review is approved and the remaining seeded-data workflow QA is completed. The patch is build-clean and isolated, and authenticated browser access is now available. Before release, connect executive and inventory aggregates to live records, complete Arabic translation coverage, seed a non-destructive UAT dataset, rerun lead-to-reservation and title-transfer readiness workflows, attach screenshots, verify tenant isolation with at least two tenants, and then promote the connected-dashboard work as a separate reviewed release.

## References

[1]: https://reterra.io/ "Reterra — Property Management Software in Saudi Arabia"
[2]: https://www.salesforce.com/crm/real-estate-crm/ "Salesforce — Real Estate CRM: Guide for Brokers, Agents, and Businesses"
[3]: https://docs.oracle.com/cd/F50962_01/English/User_Guides/fam/10285651.htm "Oracle — Unifier Real Estate Management"
[4]: https://www.yardi.com/ "Yardi — Real Estate Software and Solutions"

## Diagnosis-driven continuation update

Following authenticated browser diagnosis, the feature branch was extended without mutating production data. The commercial suite now replaces “Live development digital twin” and “live commercial status” wording with snapshot language where the underlying values are static. Arabic coverage was expanded across executive analytics, funnel stages, financial labels, closing summaries, building labels, unit-type filters, statuses, views, floor-layout labels, accessibility labels, selected-unit metadata, and buyer-evidence headings. The lead-pipeline empty state now provides a bilingual explanation and next step, and receives an accessible visual treatment.

The updated source files are `apps/web/components/CommercialWorkspaceSuite.tsx`, `apps/web/components/CommercialOperatorWorkspace.tsx`, `apps/web/lib/commercial-i18n.ts`, and `apps/web/app/commercial.css`. The production browser session used for diagnosis remains on the deployed pre-fix version because no deployment was performed; the changes require a reviewed deployment before authenticated browser regression can verify the new strings visually.

| Continuation check | Result |
|---|---|
| Web type-check | Passed |
| Commercial workflow contract test | Passed: 4/4 |
| Production build | Passed; existing autoprefixer warnings remain in unrelated cost-control CSS |
| `git diff --check` | Passed |
| Production mutation | Not performed |
| Post-fix deployed browser QA | Pending reviewed deployment |

