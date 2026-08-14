# C04 Holds & Reservations Scope Gate

**Status:** Blocked pending commercial-rule decisions; documentation only.  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint, which remains the governing baseline.  
**Non-authorizations:** This document does **not** authorize C04 schema, migration, service, API, frontend, permission, public-reservation, payment, Wafi/REGA, escrow, ZATCA/Fatoora, Nafath, electronic-signature, contract, finance/ERP, commission, or Development Intelligence implementation.

## Verified R0 scope

C04 is the fourth additive Commercial increment after C01 Commercial Structure, C02 Pricing & Media, and C03 Customer & Leads. R0 defines C04 as **“UnitHold, Reservation with mandatory concurrency proof.”** [R0 §11](product-reset-blueprint.md)

> **UnitHold:** “Time-bound, concurrency-safe lock on a unit. At most one active hold may exist for a unit.” Initial statuses: `ACTIVE`, `EXPIRED`, `CONVERTED`, `RELEASED`, `CANCELLED`.  
> **Reservation:** “Captures unit, customer, lead, payment plan, immutable price snapshot, reservation amount, currency, expiry, creator/approver and lifecycle timestamps.” Initial statuses: `DRAFT`, `PENDING`, `CONFIRMED`, `EXPIRED`, `CANCELLED`, `CONVERTED_TO_SALE`. — [R0 §6](product-reset-blueprint.md)

R0 additionally requires tenant isolation; no two simultaneous active holds/reservations on one Unit; immutable reservation pricing; and transactional, audited hold/reservation/availability transitions. [R0 §7](product-reset-blueprint.md) It lists privileged resource endpoints for Unit holds and Reservations, planned hold/reservation capabilities, clean and upgrade migration rehearsals, and mandatory hold/reservation concurrency tests. [R0 §§9–11, §15](product-reset-blueprint.md)

## Verified Lead-to-Unit relationship finding

R0 deliberately supplies **parallel vocabulary** but no synchronization rule:

| R0 element | Explicitly defined |
| --- | --- |
| `Unit.status` | `DRAFT`, `UNRELEASED`, `AVAILABLE`, `HELD`, `RESERVED`, `SOLD`, `BLOCKED`, `WITHDRAWN` |
| `Lead.status` | `NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON/LOST`, plus terminal `DISQUALIFIED` |
| UnitHold | A time-bound concurrency-safe Unit lock with the five Hold statuses above |
| Reservation | A Unit/Customer/Lead/PaymentPlan/price-snapshot record with the six Reservation statuses above |

R0’s MVP path says: **“Lead appears → permitted Sales user creates Hold → Reservation confirms → Unit status updates → conflicting second transaction is blocked.”** [R0 §16](product-reset-blueprint.md) It does **not** state whether `Lead.status = RESERVED` is set when a UnitHold becomes active, when a Reservation is created, when a Reservation is confirmed, or by a separate sales action. It likewise does **not** state whether `Lead.status = WON` follows `Unit.status = SOLD`, whether `Lead.status = LOST` changes availability, or whether any update is bidirectional.

> **Conclusion:** R0 does not authorize an inferred Lead↔Unit synchronization. C04 must not implement that relationship until an operator decision specifies the event, transactional owner, permitted override, audit behavior, and recovery/compensation behavior.

This preserves the explicit C03 no-code boundary; C03 correctly made no Unit-status, hold, or reservation mutation.

## Implementation boundary once approved

| Area | R0-supported direction | Not authorized in C04 absent a new decision |
| --- | --- | --- |
| UnitHold | Add a tenant-scoped, time-bound, concurrency-safe lock on a Unit, with at most one active Hold per Unit and the R0 status vocabulary. | Trigger defaults, timeout values, automatic expiry worker, queue/scheduler, manual vs. automatic creation, cross-Unit holds, payment collection, or public creation. |
| Reservation | Add a tenant-scoped record that captures the R0-listed Unit, Customer, Lead, PaymentPlan, immutable price snapshot, amount, currency, expiry, creator/approver, and lifecycle timestamps. | Reservation-fee collection, escrow, contract, invoice, Wafi/REGA integration, payment gateway, commission, or a presumed approval workflow. |
| Concurrency and availability | Enforce the R0 invariant that one Unit cannot have two simultaneous active holds/reservations, and make approved transitions transactional and audited. | Choosing a lock/index pattern, defining active-set semantics, status mapping, retry/idempotency behavior, or Unit transition matrix without a rule decision. |
| Lead relationship | Preserve optional Lead reference on Reservation as R0 defines. | Automatic change of Lead `RESERVED`, `WON`, or `LOST`; automatic Lead creation; or any derived Unit/Lead synchronization. |
| Pricing | Capture an immutable Reservation price snapshot as R0 requires. | Repricing, discounts, tax, invoice, payment-plan override, currency-conversion, finance, or pricing rules not approved in a C04 decision. |
| API and RBAC | Preserve `/api/v1`, explicit DTOs, tenant isolation, audit, and source-derived capabilities. R0 names Unit-hold and Reservation endpoints/capabilities. | New roles, raw Prisma responses, public exposure of private data, or a route/permission vocabulary inferred from R0 rather than reconciled to the existing source-derived RBAC convention. |
| Migration and assurance | Use an additive reviewed migration, clean-database rehearsal, upgrade rehearsal, and real concurrency proof after rules are approved. | Editing migration baseline, `prisma db push`, destructive data changes, or untested concurrency claims. |
| Customer experience | R0 lists a future `/reserve/[unitId]` navigation route and reservation-entry journey. | A public reservation flow, identity/consent/payment requirements, or any public API contract; R0 does not define them here. |

## Open commercial-rule decisions before schema or service implementation

| ID | Undefined rule | Why it cannot be inferred safely | Required operator decision |
| --- | --- | --- | --- |
| C04-D01 | Hold creation trigger and actor | R0 states that a Sales Agent can create holds and defines a Hold, but does not state whether a hold follows a manual action, a Lead stage, a public enquiry, or another event. | Define triggers, eligible actors/capabilities, required Lead/Customer context, and whether a Hold may exist without a Lead. |
| C04-D02 | Hold cardinality and “active” set | R0 prohibits two simultaneous active holds/reservations but does not define which Hold and Reservation statuses count as active together. | Define the single-Unit conflict set across Hold and Reservation statuses, including draft/pending reservation behavior. |
| C04-D03 | Hold transition matrix and expiry | R0 names `ACTIVE`, `EXPIRED`, `CONVERTED`, `RELEASED`, `CANCELLED`, but no permitted transitions, expiry duration, time zone, extension, or actor authority. | Define transitions, expiry source, extension/release/cancel authority, reasons, and audit requirements. |
| C04-D04 | Reservation creation prerequisites | R0 lists Reservation fields but does not say whether an active Hold is mandatory; which Customer/Lead/PaymentPlan fields are required at each stage; or what consistency checks are mandatory. | Define required links, Hold prerequisite, Unit/Project/Customer/Lead consistency, and permitted exceptions. |
| C04-D05 | Reservation lifecycle and approval | R0 names lifecycle statuses and creator/approver fields but no transition matrix, approval policy, or approver authority. | Define who creates, approves, confirms, cancels, expires, or converts; transition conditions; reasons; and reopen policy. |
| C04-D06 | Unit availability transition matrix | R0 requires transactional hold/reservation/availability transitions but does not map Hold or Reservation events to `Unit.HELD`, `RESERVED`, `SOLD`, or other Unit states. | Define Unit-status event mapping, transactional owner, rollback/compensation, and how blocked/withdrawn units behave. |
| C04-D07 | **Lead↔Unit synchronization** | R0 defines Lead `RESERVED`/`WON`/`LOST` and Unit `RESERVED`/`SOLD`, but states no mapping or direction. | Explicitly decide whether, when, and in which transaction Lead status follows Hold/Reservation/Unit events; whether `WON` follows sale; and whether `LOST` changes Unit availability. |
| C04-D08 | Immutable price snapshot semantics | R0 requires an immutable price snapshot but does not define source revision selection, fields, currency, valid-window behavior, overrides, or treatment of later price changes. | Define snapshot composition, source eligibility, null/expired price behavior, and audit/response representation. |
| C04-D09 | Reservation amount, currency, and Wafi/REGA gate | R0 names amount and currency but supplies no amount rule. The current governing materials do not establish a Wafi reservation-fee cap or authorize a Wafi placeholder. | Define amount source/rules and currency constraints; separately provide verified regulatory requirements before any Wafi/REGA field or integration is proposed. |
| C04-D10 | PaymentPlan association | R0 includes PaymentPlan on Reservation but C02 supports reusable project-level plans and does not establish C04 override/selection rules. | Define requiredness, project consistency, plan version/snapshot behavior, and exception authority. |
| C04-D11 | Concurrent command semantics | R0 requires concurrency proof but not command idempotency, locking boundary, retry outcome, conflict response, or audit ordering. | Define the business-visible behavior for simultaneous create/release/convert/confirm operations; implementation mechanics follow only after this rule. |
| C04-D12 | Audit, documents, and evidence | R0 requires audit but does not define event payload, reason fields, supporting-document requirements, or visibility boundaries. | Define material events, required reasons/evidence, who can view them, and public/private DTO exclusions. |
| C04-D13 | Public reservation-entry boundary | R0 lists a public navigation route but only public project/unit/enquiry API endpoints. It does not define a public reservation API, authentication, consent, anti-abuse, or data contract. | Decide whether public entry is an authenticated handoff, an internal workflow, or a future public operation, with separate privacy/security approval. |
| C04-D14 | Capability and route reconciliation | R0 names `hold:create`, `hold:release`, `reservation:*` while C03 uses `commercial:*` source-derived capabilities and `/commercial` controller conventions. | Confirm exact capability names and privileged route mapping, without creating roles or weakening existing authorization semantics. |
| C04-D15 | Existing-data and migration treatment | Existing Units already have availability states; R0 does not authorize automatic creation of Holds/Reservations from current Unit values. | Define whether any historic data is in scope and, if so, a separately approved additive/backfill plan. |

## Verification plan after decisions

Once commercial decisions are confirmed, C04 must provide explicit DTO/contract validation, tenant-safe service invariants, additive schema/migration review, clean-database rehearsal, upgrade-from-C03 rehearsal, and real PostgreSQL/API tests. Mandatory proof must cover tenant isolation; capability denial; no double active Hold/Reservation for one Unit; race/concurrency behavior; approved availability transitions; immutable Reservation price snapshot; Lead↔Unit behavior exactly as decided; audit emission; public DTO leakage prevention; and absence of payment, Wafi/REGA, contract, finance, commission, and Development Intelligence changes.

## Implementation stop

C04 implementation is intentionally **not authorized** by this document. No C04 Prisma model, migration, service, controller, DTO, UI, public API, payment flow, worker, scheduler, capability, or integration should be written until the listed rules are proposed, confirmed or amended by the operator, and a subsequent task authorizes implementation.

## References

- [R0 Product Reset Blueprint](product-reset-blueprint.md) §§3, 4, 6–7, 9–11, 13, 15–16
- [C03 Customer & Leads Scope Gate](c03-customer-leads-scope.md)
- [C03 Commercial Rule Decisions](c03-commercial-rule-decisions.md)
- [C02 Pricing & Media Scope Gate](c02-pricing-media-scope.md)
