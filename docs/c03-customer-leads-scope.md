# C03 Customer & Leads Scope Gate

**Status:** **Approved and implemented; pending code review.**  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint; operator-authorized C03 commercial-rule decisions and the subsequent correction to Decision 2 and Decision 7.  
**Governing decision record:** [`c03-commercial-rule-decisions.md`](c03-commercial-rule-decisions.md).  
**Non-authorizations:** C03 does not authorize Wafi/REGA, ZATCA/Fatoora, Nafath, electronic signature, contracts, escrow, payment collection, finance/ERP, commission, customer portal delivery, campaigns, outbound messaging, or frozen Development Intelligence work.

## Verified C03 scope

R0 defines C03 as the additive Commercial increment for **Customer**, **Lead**, and **SalesActivity**. A Customer is a commercial party, distinct from authenticated internal `User`. A Lead is a tenant-scoped commercial opportunity with optional Customer, Project, and Unit references, a single assigned sales user, a source, and the R0 lifecycle. SalesActivity is the immutable history of calls, emails, WhatsApp interactions, meetings, site visits, follow-ups, and notes.

> **Corrected lifecycle, used verbatim:** `NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON / LOST`.
>
> `DISQUALIFIED` is terminal and may be reached from any pre-`RESERVED` state. C03 does not invent any other disqualification entry point, reopening, or backward transition.

C03 follows the established platform boundary: `/api/v1`, explicit DTO validation, tenant isolation, source-derived capabilities rather than new roles, audit events for material mutations, additive Prisma migration, and real PostgreSQL/API verification. It is private commercial functionality only: no public enquiry endpoint, public lead response, message delivery, or public exposure of Customer/Lead data is introduced.

## Approved implementation boundary

| Area | C03 implementation | Excluded from C03 |
| --- | --- | --- |
| Customer | `Customer` is tenant-isolated and separate from `User`; it stores a minimal person record: first name, optional last name, Saudi mobile phone, and email. There is no `userId` link or automatic portal linkage. | Customer portal, identity-provider work, organizations, merge tooling, address/profile expansion, and automatic User linkage. |
| Deduplication | Saudi mobile and email are normalized. An exact normalized phone-and-email match reuses the existing Customer. Partial phone or email matches mark both records for manual review; C03 performs no automatic merge. | Automatic merge, delete, retire, or deduplication adjudication workflow. |
| Lead | A Lead has optional Customer, Project, and Unit references, one active sales owner, free-text source, corrected R0 status, and purpose-specific consent metadata where externally sourced. A selected Unit must belong to the selected Project. | Multi-unit opportunities, campaign records, holds, reservations, Unit status changes, contracts, payment collection, conversion to a new Opportunity entity, and CRM import/export. |
| Lifecycle | Only forward R0 transitions are allowed. `DISQUALIFIED` is terminal from pre-`RESERVED` states. `WON` and `LOST` are terminal from `RESERVED`. No reopening or backward transition is implemented. | Implied C04 transactional synchronization, reopen/backward actions, reason codes, and automatic conversion. |
| Ownership and visibility | Lead has a single tenant-member owner. A creator defaults to themselves; cross-user assignment/reassignment requires `commercial:lead:reassign`. Owner read access uses `commercial:lead:view-own`; manager-tier visibility uses `commercial:lead:view-all`. Material changes are audited. | New role names, teams, queues, territories, unassignment, and separate assignment-history tables. |
| SalesActivity | One append-only activity belongs to one Lead and records actor, type, timestamp, and notes. Permitted types are call, email, WhatsApp, meeting, site visit, follow-up, and note. | Activity update/delete routes, task/reminder workflow, attachments, telephony, email/WhatsApp delivery, calendar integration, or external messaging. |
| Consent and privacy | Externally sourced Leads require enquiry-response consent flag, timestamp, channel, and purpose. Marketing consent is structurally separate and must carry separate evidence when granted. PII is concentrated in Customer/Lead. | Production legal compliance sign-off, public notice delivery, automatic retention/deletion, data-subject request workflow, marketing delivery, or a claim of PDPL compliance. |
| C03/C04 gate | C03 records Lead `RESERVED`, `WON`, and `LOST` only as a Lead lifecycle state. It does not touch `Unit.status`, create C04 records, use events/webhooks, or synchronize Lead and Unit. | Any inference that `Lead.RESERVED` follows `Unit.RESERVED`, that `Lead.WON` follows `Unit.SOLD`, or that `Lead.LOST` changes Unit availability. |

## Decision closure register

| Former gate | Authorized resolution | Implementation disposition |
| --- | --- | --- |
| C03-D01–D03 | Minimal Customer person fields; exact phone+email reuse; manual review for partial matches; no automatic User link. | Implemented. |
| C03-D04 | Corrected R0 lifecycle with forward-only transitions; terminal `DISQUALIFIED`, `WON`, and `LOST`; no reopen/backward paths. | Implemented. |
| C03-D05 | One optional Customer, Project, and Unit reference per Lead; Unit/Project consistency enforced when both are supplied. | Implemented. |
| C03-D06 | One active owner; manager-tier reassignment; owner/all visibility split; audit history instead of an assignment table. | Implemented. |
| C03-D07 | Free-text source; no campaign entity or taxonomy. | Implemented. |
| C03-D08 | Append-only typed Lead activities with actor and notes; no activity workflow. | Implemented. |
| C03-D09 | Lead remains the commercial opportunity; no new Opportunity or automatic conversion process. Customer reference remains optional. | Implemented. |
| C03-D10 | No public route in C03. Private externally sourced Lead creation requires purpose-specific enquiry-response consent evidence; marketing consent is separate. | Implemented provisionally; legal review remains required. |
| C03-D11 | Existing `/commercial` API controller and source-derived capabilities; no role invention. | Implemented. |
| C03-D12 | PII concentration and no automatic deletion/retention policy. | Implemented provisionally; legal and business decisions remain required. |
| C03-D13 | Exact Lead↔Unit reservation/outcome synchronization is not specified by R0. | **Open for C04; intentionally not implemented in C03.** |

## Verification evidence

C03 verification includes Prisma schema validation, generated client/typecheck, additive clean-database migration deployment, C02-to-C03 upgrade rehearsal, and focused real-HTTP smoke/invariant tests. The test suite proves Customer reuse/manual-review behavior, tenant isolation, capability denial, owner and manager visibility/assignment boundaries, lifecycle enforcement, externally sourced consent-field enforcement, append-only activity surface, audit emission, Project/Unit consistency, and the fact that Lead `RESERVED`/`WON` does not alter `Unit.status`.

## References

- [`product-reset-blueprint.md`](product-reset-blueprint.md) §§6–7, 9–12, 15–17
- [`c03-commercial-rule-decisions.md`](c03-commercial-rule-decisions.md)
- [`c02-pricing-media-scope.md`](c02-pricing-media-scope.md)
- [SDAIA Data Protection](https://sdaia.gov.sa/en/Research/Pages/DataProtection.aspx)
- [SDAIA Implementing Regulation](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2/%21ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziPR1dzTwMgw2MDMOcTA3MjH39TE29jY0MQsz1w9EUhIZZAhUEGvl6OXoaGwQ60cRo98AB3A0IKTfi5ACoA-MinydfdP1owoSSjJ0M_PS8vUjAlwCfIyAlkfh1W5hjKEA039gBXg8UJAbGlHlkxbsma6oCAA-ytT9/dz/d5/L0lDUmlTUSEhL3dHa0FKRnNBLzROV3FpQSEhL2Vu/)
