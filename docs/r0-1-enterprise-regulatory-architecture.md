# R4C R0.1 Enterprise and Regulatory Architecture Addendum

**Status:** proposed governing addendum; documentation only

**Date:** 2026-08-12

**Applies to:** R0 Product Reset and the C01 scope gate
**Evidence boundary:** repository state and official-source review; not legal or tax advice

## 1. Executive decision

R4C remains a commercial-first digital real-estate developer platform with a preserved Development Intelligence layer. R0.1 adds enterprise and regulatory boundaries that the R0 Product Reset did not define fully.

R0.1 does **not** implement quotations, statutory invoicing, accounting, tax determination, cost-center posting, a broad CRM, sales SLA automation, sales KPI processing, or a regulatory rules engine. None of those capabilities is authorized for C01 without a separately approved scope.

### Status vocabulary

- **IMPLEMENTED:** corroborated by current source and, where available, runtime/test evidence.
- **PROPOSED:** target product or domain design with no current implementation claim.
- **ENTERPRISE-READY:** an approved architectural boundary is defined for later integration; it does not mean the capability or external integration exists.
- **REGULATORY-CONDITIONAL:** applicability depends on reviewed jurisdiction, role, activity, transaction and effective-date facts; it is not a universal rule or compliance claim.
- **FROZEN:** implemented Development Intelligence capability retained without product expansion except an approved maintenance/integration exception.

In this addendum, `FinancialDimensionMapping`, external invoicing/ERP, buyer-ledger, SLA and event-derived KPI sections are **ENTERPRISE-READY boundaries only**. `RegulatoryProfile` and `TaxTreatment` are **REGULATORY-CONDITIONAL boundaries only**. The capability matrix below remains authoritative for whether code exists.

## 2. Verified capability baseline

The following matrix distinguishes runtime-backed code from target documentation. Evidence was inspected on `main` and in PR #47 on 2026-08-12.

| Capability | State | Repository evidence | Consequence |
|---|---|---|---|
| Project/development root | IMPLEMENTED | `apps/api/prisma/schema.prisma` (`Project`), project API and web routes | Reuse `Project`; do not destructively rename it. |
| Tenant, auth, RBAC and audit | IMPLEMENTED | Prisma identity/audit models; API guards and audit service | Reuse as the Commercial control plane. |
| Property hierarchy below Project | PROPOSED | PR #47 documents Phase → Building → Floor → Unit; no matching Prisma models on `main` | Eligible for C01 only after approval. |
| Unit inventory | PROPOSED | No `Unit` model/API/UI on `main`; existing `InventoryLocation` is construction-material inventory | Never treat material inventory as saleable-unit inventory. |
| Customer and lead | DOCUMENTED ONLY | PR #47 target model; README/MVP on `main` defer CRM/sales; no code models | Planned after C01; not a current CRM claim. |
| Holds and reservations | DOCUMENTED ONLY | PR #47 target state machines; no code models | Planned transaction domain; not C01. |
| Quotations and discounts | NOT PRESENT | No model, API, contract or UI found | Requires separate commercial approval and design. |
| Invoices / statutory e-invoicing | NOT PRESENT | No invoice model or ZATCA integration found; full finance is deferred | Keep behind an external invoicing/ERP boundary. |
| Buyer payment ledger | NOT PRESENT | Construction `CostLedgerEntry` is project cost control, not a buyer subledger | A read-only commercial view may be designed later over an authoritative finance source. |
| Financial dimension / cost-center mapping | NOT PRESENT | No `FinancialDimensionMapping` or commercial cost-center integration found | Introduce only as an integration mapping, not an accounting engine. |
| Sales SLA | NOT PRESENT | No `SlaPolicy` or `SlaInstance` found | Requires an event-driven policy scope after CRM basics exist. |
| Sales KPI engine | NOT PRESENT | Existing dashboards are development/cost/progress/quality/HSE/turnover views | Derive future sales KPIs from governed commercial events. |
| Regulatory / tax policy engine | NOT PRESENT | No `RegulatoryProfile`, policy engine or tax-treatment model found | R0.1 defines a boundary only; it does not assert compliance. |

## 3. Commercial core and enterprise boundaries

### 3.1 Commercial core

The target hierarchy remains:

`Tenant → Project/Development → DevelopmentPhase → Building → Floor → Unit`

Future commercial increments may add pricing revisions, payment plans, Customer, Lead, SalesActivity, UnitHold and Reservation. All tenant isolation, public/private DTO, RBAC, audit, immutable-pricing and concurrency invariants from the R0 blueprint remain in force.

Quotations and discounts are deliberately outside C01. If approved later, a quotation must snapshot unit, customer, price revision, payment plan, discount approvals, currency, validity period and applicable regulatory context. A quotation is not an invoice, reservation, contract, tax determination or accounting posting.

### 3.2 `FinancialDimensionMapping`

This is a generic integration boundary for mapping an R4C commercial record to dimensions owned by an external finance/ERP system.

Minimum conceptual fields:

- tenant, source entity type/id and optional project/unit scope;
- external system and external company/legal-entity identifier;
- dimension type and external dimension code;
- effective-from/effective-to, status and mapping version;
- source/reference, approver and audit metadata.

R4C must not assume that every tenant uses a cost center, that a project equals a cost center, or that one universal chart/dimension hierarchy exists. The authoritative accounting structure remains external unless separately approved.

### 3.3 External invoicing and ERP boundary

R4C may later prepare a governed commercial handoff or receive invoice/payment status from an authoritative invoicing/ERP system. It must not claim to generate a statutory invoice or satisfy ZATCA requirements merely because it stores a reservation amount or renders a document.

The boundary must distinguish:

- commercial quotation or reservation snapshot owned by R4C;
- invoice request/handoff and idempotency key;
- external invoice identifier, status and immutable document reference;
- payment allocation/status received from the finance authority;
- failures, retries, reconciliation and audit trail;
- data ownership and correction authority.

No C01 endpoint may simulate this flow.

### 3.4 Buyer ledger view

A future buyer ledger in R4C is a read model, not a general ledger or receivables subledger. It may present contractual schedule, invoiced amounts, receipts, allocations, reversals and outstanding balance only when their authoritative sources and reconciliation semantics are defined. Construction `CostLedgerEntry` must never be reused for buyer finance.

### 3.5 Sales SLA boundary

Future SLA automation should separate:

- `SlaPolicy`: tenant, event/record type, eligibility filter, clock/calendar, target duration, pause rules, escalation path, version and effective dates;
- `SlaInstance`: policy version, subject, start/due/paused/completed/breached timestamps and event evidence.

SLA clocks must be event-derived, auditable and timezone/calendar aware. C01 implements neither object.

### 3.6 Event-derived KPI boundary

Sales analytics should consume durable domain events such as lead created/assigned/contacted, hold created/expired, reservation confirmed/cancelled and unit sold. Definitions need a version, denominator, time window, timezone, inclusion/exclusion rules and source-event lineage. Mutable dashboard counters are not the system of record.

## 4. Contextual regulatory architecture

### 4.1 `RegulatoryProfile`

Regulatory applicability varies by tenant role, legal entity, activity, transaction, property/project, geography, channel and effective date. A future `RegulatoryProfile` should therefore be selected contextually rather than globally.

Conceptual fields:

- tenant and legal-entity identity;
- jurisdiction and activity/transaction types;
- project/unit scope and off-plan/on-plan status where relevant;
- seller/developer/broker/platform roles;
- license/registration identifiers with issuer, validity and verification status;
- versioned policy references: authority, source URL/document, publication/access date, effective dates and review owner;
- enabled controls, evidence requirements and explicit applicability rationale;
- status (`DRAFT`, `REVIEWED`, `ACTIVE`, `RETIRED`) and approval/audit metadata.

An active profile is configuration evidence, not proof of legal compliance. Material rules require legal/tax owner approval and periodic source review.

### 4.2 `TaxTreatment`

`TaxTreatment` is a versioned determination/result boundary, not a global tax-rate field. It should identify transaction context, tax type, treatment code, rate or exemption only when applicable, legal/source reference, effective dates, determining authority, calculation/external-system ownership and review evidence.

R4C must not hard-code one tax treatment for all reservations, units, tenants or transfers. Tax changes and exceptions must remain traceable without rewriting historical transactions.

## 5. Saudi validation matrix

This matrix records contextual findings from official sources accessed on 2026-08-12. It defines questions and boundaries; it does not replace professional legal or tax review.

| Area | Official-source finding | Applicability gate for R4C | Architecture implication |
|---|---|---|---|
| REGA brokerage / FAL | REGA describes FAL licenses as authorizing the activity stated in the license, including brokerage/marketing and real-estate advertising. | Determine whether the tenant/operator acts as developer, broker, advertiser, or electronic brokerage platform and which activity is actually performed. | Store role and license evidence contextually; do not require one FAL type for every internal R4C use. |
| REGA electronic platforms | REGA identifies a specific FAL brokerage/marketing license for electronic real-estate platforms and notes technical integration for licensed platforms. | Applies when the operating model constitutes a regulated electronic brokerage/marketing platform, not merely because software has a web UI. | Keep platform licensing/integration as a reviewed profile control, outside C01. |
| REGA off-plan sales/lease | For collection of reservation money during a project-marketing license, REGA states disclosure conditions, a maximum of 5% of unit value and deposit into the designated escrow account. | Confirm that the project is off-plan, the relevant marketing license is in force, reservation money is collected in that period and the current rules apply. | Never encode 5% as a universal reservation rule; represent a versioned, conditional policy and escrow destination. |
| ZATCA e-invoicing | ZATCA describes phase one as generation/storage and phase two as phased integration with FATOORA for notified taxpayers. | Determine taxpayer, invoice issuer, invoice type, notification wave and whether R4C or an external ERP is the invoicing solution. | Default to external invoicing boundary; no C01 statutory invoice or FATOORA claim. |
| ZATCA RETT | ZATCA applies RETT to qualifying real-estate disposals and documents exemptions/conditions. | Determine whether the event is a taxable disposal, party/asset facts, exemption and current effective rules. A hold/reservation is not automatically the taxable disposition. | Use contextual `TaxTreatment`; no single globally fixed transaction treatment. |

### Official sources

- REGA, [FAL real-estate brokerage services](https://rega.gov.sa/rega-services/platforms/fal-real-estate-brokerage/)
- REGA, [real-estate brokerage contracts](https://rega.gov.sa/rega-services/eservices/%D8%A5%D8%A8%D8%B1%D8%A7%D9%85-%D8%B9%D9%82%D9%88%D8%AF-%D8%A7%D9%84%D9%88%D8%B3%D8%A7%D8%B7%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%D9%8A%D8%A9/)
- REGA, [off-plan sales and lease](https://rega.gov.sa/rega-services/platforms/wafi-off-plan-sales-and-lease/)
- ZATCA, [e-invoicing rollout phases](https://zatca.gov.sa/ar/e-invoicing/introduction/pages/roll-out-phases.aspx?lang=ar)
- ZATCA, [RETT implementing-regulation update and examples of exceptions](https://zatca.gov.sa/ar/MediaCenter/News/Pages/Updates-RETT-Implementing-Regulations.aspx)

## 6. C01 gate

C01 is limited to the approved commercial property foundation described in `docs/c01-commercial-foundation-brief.md`. It may implement Project commercial metadata, DevelopmentPhase, Building, Floor, UnitType and Unit with tenant isolation, RBAC, audit, hierarchy integrity and additive migrations.

C01 must not implement or imply:

- quotation, discount approval or contracting;
- invoice generation, FATOORA integration or ERP posting;
- buyer finance ledger, collection or payment allocation;
- cost-center/financial-dimension posting;
- Customer/Lead/broad CRM;
- hold/reservation or reservation-percentage policy;
- SLA engine or sales KPI engine;
- `RegulatoryProfile` execution, license decision automation or tax determination.

## 7. Decisions required before later increments

1. R4C operating role by market and tenant: developer system, broker tool, advertising channel, regulated electronic platform, or combination.
2. Authoritative ERP/invoicing/payment systems and integration ownership.
3. Legal entity, project and financial-dimension mapping rules per tenant.
4. Whether quotations belong in R4C and the discount approval authority.
5. Reservation-money collection model, escrow flow and off-plan applicability.
6. Tax/legal owner for source approval, effective-date review and exceptions.
7. CRM depth, sales pipeline, SLA calendars/escalations and KPI definitions.

Until these decisions are approved, the related capabilities remain NOT PRESENT or DOCUMENTED ONLY.
