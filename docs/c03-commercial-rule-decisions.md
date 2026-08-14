# C03 Commercial Rule Decisions

**Status:** Operator-authorized for C03 implementation, subject to the explicit C03/C04 synchronization gate and legal review of privacy controls.  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint; corrected C03 Commercial Rule Decisions supplied by the operator.  
**Supersedes:** The prior compact lead-lifecycle proposal and its assumed C03/C04 uncoupled-boundary interpretation.

## 1. Customer identity, deduplication, and User linkage

`Customer` remains distinct from internal-staff `User`, as defined by R0. C03 does not automatically link a Customer to a User; a customer portal/login is a later integration.

At Customer creation, the service normalizes Saudi phone numbers to the `+966` form and normalizes email for exact matching. An exact match on **both** normalized phone and email reuses the existing Customer. A partial match, such as a matching phone with a different name, is flagged for manual review rather than silently merged. C03 does not implement an automatic merge operation.

## 2. Lead lifecycle, conversion, assignment, and source

C03 uses R0’s lifecycle exactly:

> `NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON / LOST`

`DISQUALIFIED` is terminal and is allowed from any pre-`RESERVED` status. The C03 implementation must not invent a fixed single entry point for `DISQUALIFIED` beyond that direction.

Lead remains the commercial opportunity; C03 does not introduce an Opportunity entity. Each Lead has one sales-owner User at a time. Reassignment requires a manager-tier capability and is captured through existing audit infrastructure; C03 does not introduce an assignment-history table. `source` is free text rather than a rigid enum or campaign-management model.

## 3. SalesActivity

SalesActivity is append-only. Each activity is linked to one Lead or Customer, identifies the actor User, records a timestamp and a type, and holds free-text notes. The approved C03 types are call, email, WhatsApp, meeting, site visit, follow-up, and note. C03 does not introduce a task, reminder, or activity-status workflow.

## 4. Consent and externally sourced Leads — provisional privacy control

For a Lead sourced externally through website, public enquiry, or WhatsApp, C03 stores the consent flag, consent timestamp, consent channel, and specific processing purpose. Marketing consent is separate from enquiry-response consent. Withdrawal blocks further marketing/contact activity at the service boundary, while historical records remain subject to the future retention/deletion process.

> This is a **provisional implementation posture**, not legal sign-off. Official SDAIA materials describe purpose-specific, documented consent and a withdrawal mechanism; counsel must validate the production privacy notice, legal basis, retention, deletion, and operational response before real customer data is processed.

## 5. Privacy and retention — provisional design constraint

C03 keeps personally identifying Customer/Lead data concentrated in those entities rather than duplicating it across SalesActivity records. C03 does not implement automatic deletion or a retention period. The production retention schedule, subject-rights workflow, deletion/anonymization process, and legal basis require legal and business decisions before live use.

## 6. Capabilities and existing RBAC mapping

C03 uses capabilities in the existing source-derived RBAC model. No new role names are added.

| Capability | C03 use |
| --- | --- |
| `commercial:lead:create` | Create a tenant-scoped lead. |
| `commercial:lead:view-own` | Read leads assigned to the current user. |
| `commercial:lead:view-all` | Read tenant leads with manager-tier visibility. |
| `commercial:lead:reassign` | Assign or reassign the single sales owner. |
| `commercial:lead:qualify` | Move a Lead through the R0 sales lifecycle. |
| `commercial:lead:disqualify` | Move an eligible Lead to terminal `DISQUALIFIED`. |
| `commercial:customer:create` | Create or reuse a Customer under the deduplication rule. |
| `commercial:customer:view` | Read Customer records. |
| `commercial:activity:log` | Append a SalesActivity entry. |
| `commercial:activity:view` | Read SalesActivity history. |

The current source-derived seed grants all discovered capabilities to `ADMIN`. It does not silently invent a manager role. Deployments must map the manager-tier capability to an approved existing role or use the existing permission-assignment mechanism.

## 7. C03/C04 synchronization gate — no implementation in C03

R0 gives Lead and Unit overlapping status words, including `RESERVED`, and gives Lead `WON/LOST` outcomes. It does **not** specify whether Unit state changes automatically drive Lead status, whether Lead `WON` follows Unit `SOLD`, or whether `LOST` is independent of Unit availability. Therefore C03 does not update `Unit.status`, subscribe to C04 events, publish events, create a bridge, or implement synchronization of `RESERVED`, `WON`, or `LOST`.

| Open boundary decision | Required ruling before C04 integration |
| --- | --- |
| `Lead.RESERVED` relationship to `Unit.RESERVED` | Confirm whether it is system-driven, independently set, or governed by another transaction rule. |
| `Lead.WON` relationship to `Unit.SOLD` | Confirm whether it is automatic or a distinct sales-outcome decision. |
| `Lead.LOST` relationship to Unit availability | Confirm whether it is solely Lead-side or changes/release Unit availability. |

## Explicit exclusions

C03 does not add C04 UnitHold/Reservation behavior, Unit status transitions, Wafi/REGA escrow, ZATCA/Fatoora invoicing, Nafath, electronic signature, contracts, payment collection, finance/ERP, commission, campaign automation, telephony, messaging delivery, public-catalog customer-data exposure, or Development Intelligence work.

## References

- `docs/product-reset-blueprint.md` §§6–7, 9–12, 15–17
- `docs/c03-customer-leads-scope.md`
- [SDAIA Data Protection](https://sdaia.gov.sa/en/Research/Pages/DataProtection.aspx)
- [SDAIA Implementing Regulation](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2/%21ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziPR1dzTwMgw2MDMOcTA3MjH39TE29jY0MQsz1w9EUhIZZAhUEGvl6OXoaGwQ60cRo98AB3A0IKTfi5ACoA-MinydfdP1owoSSjJ0M_PS8vUjAlwCfIyAlkfh1W5hjKEA039gBXg8UJAbGlHlkxbsma6oCAA-ytT9/dz/d5/L0lDUmlTUSEhL3dHa0FKRnNBLzROV3FpQSEhL2Vu/)
