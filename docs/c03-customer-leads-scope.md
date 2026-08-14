# C03 Customer & Leads Scope Gate

**Status:** Blocked pending commercial-rule decisions; documentation only.  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint, which remains the governing baseline.  
**Non-authorizations:** This document does not authorize C03 schema, migration, service, API, frontend, integration, or permission implementation. It does not authorize Wafi/REGA, ZATCA/Fatoora, Nafath, electronic signature, contract, escrow, payment collection, finance/ERP, commission, or frozen Development Intelligence work.

## Verified scope

C03 is the third additive Commercial increment following C01 Commercial Structure and C02 Pricing & Media. R0 defines C03 as:

> `Customer`, `Lead`, and `SalesActivity`.

A **Customer** is a commercial party separate from authenticated `User`. A customer may exist before registration; an optional `userId` may link a future portal identity. A **Lead** is a tenant-scoped commercial opportunity that can be linked optionally to a Customer, Project, and Unit. It has an assigned sales user, source/campaign, and status. R0 defines the initial lead lifecycle as:

> `NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON/LOST`, with `DISQUALIFIED` as an allowed terminal branch.

A **SalesActivity** is the history of calls, emails, WhatsApp interactions, meetings, site visits, follow-ups, and notes. R0 identifies Sales Agents as the persona that manages assigned leads and activities; Sales Managers monitor pipeline, conversion, agent workload, and commercial exceptions. The immediate MVP reservation journey makes C03 the commercial foundation for enquiry capture and later hold/reservation work, but C03 does not authorize those later C04 actions.

The platform core already supplies tenant boundaries, User/authentication/session, source-derived RBAC, audit, notifications, documents/object storage, workflow foundations, localization/RTL, and the `/api/v1` boundary. C02 established the current additive-migration, explicit-DTO, real-PostgreSQL/API-test, and clean/upgrade rehearsal patterns. R0 specifies `/customers`, `/leads`, `/leads/:leadId/assign`, and `/leads/:leadId/activities` as privileged resource endpoints and names planned `lead:*`, `customer:*`, and `sales-activity:manage` capabilities.

## Implementation boundary once approved

| Area | Approved direction | Not authorized in C03 |
| --- | --- | --- |
| Customer commercial party | Add a tenant-isolated Customer that is distinct from `User` and can exist before portal registration. The optional later `userId` link must preserve the existing platform identity boundary. | Replacing User/authentication, customer portal delivery, identity-provider work, payment account profiles, or an invented duplicate/merge policy. |
| Lead commercial opportunity | Add a tenant-isolated Lead with the R0-defined optional Customer, Project, and Unit links; assigned sales user; source/campaign; and the stated lifecycle vocabulary. | Holds, reservations, sales contracts, payment collection, automatic lead conversion, commission, marketing automation, or rule values R0 does not define. |
| SalesActivity history | Add the R0-defined activity-history domain for call, email, WhatsApp, meeting, site visit, follow-up, and note records. | Sending email/WhatsApp, telephony, calendar, CRM import/export, external messaging integrations, or invented activity workflow rules. |
| Assignment and commercial ownership | Support only the R0 direction that a Lead has an assigned sales user and an assign endpoint. Use existing tenant and RBAC foundations. | New role names, team/queue management, territory design, workload-balancing automation, or unapproved reassignment policy. |
| Source and campaign | Persist the R0-defined source/campaign association only after its representation and governance are decided. | Marketing platform integration, attribution calculations, campaign automation, advertising pixels, or an assumed taxonomy. |
| APIs, contracts, and data boundary | Preserve `/api/v1`, explicit DTOs, tenant isolation, RBAC, audit, and the restricted public/private boundary. Keep cross-boundary commercial types in `packages/contracts` when implementation is authorized. | Raw Prisma responses, customer/lead data in public inventory APIs, internal notes/audit metadata leakage, or a new unrelated compatibility surface. |
| Migration and assurance | Use an additive reviewed Prisma migration with clean-database and upgrade-from-current-schema rehearsal only after decisions are approved. | Editing the migration baseline, Prisma `db push`, destructive changes, or automatic conversion of existing platform/development data. |

## Open commercial-rule decisions before schema or service implementation

| ID | Undefined rule | Why it cannot be inferred safely | Required operator decision |
| --- | --- | --- | --- |
| C03-D01 | Customer identity and required fields | R0 establishes a commercial party distinct from User but does not define the minimum person/organization, name, contact, address, language, or communication-preference attributes. | Define the C03 Customer field set, field requiredness, validation, and whether person and organization customers are separate concepts. |
| C03-D02 | Customer deduplication and merge | R0 does not state uniqueness keys, duplicate detection, merge authority, merge audit behavior, or whether customer records may be retired. | Define duplicate candidates, matching criteria, merge/retention behavior, and the authorized capability boundary. |
| C03-D03 | Customer-to-User linkage | R0 permits optional later `userId` linkage but does not define claim, approval, unlink, one-to-one/cardinality, cross-tenant, or error handling rules. | Define when and by whom a Customer may link to User, whether a User can link to multiple customers, and how unlink/correction is governed. |
| C03-D04 | Lead lifecycle transitions | R0 supplies the status vocabulary and identifies `DISQUALIFIED` as terminal, but does not define the allowed transition matrix, reopening, backwards movement, transition reasons, or actor permissions. | Define each allowed transition, terminal/reopen rules, required reason/outcome data, and who may perform each transition. |
| C03-D05 | Lead link cardinality and consistency | Customer, Project, and Unit links are optional, but R0 does not define whether a Lead may target multiple units/projects, how Unit and Project consistency is enforced, or when a Customer becomes mandatory. | Define cardinality, hierarchy-consistency checks, and required links at creation and at each lifecycle state. |
| C03-D06 | Lead assignment and ownership | R0 names an assigned sales user and an assign endpoint, but does not define single-owner versus team ownership, unassignment, reassignment authority, visibility, manager access, or historical ownership. | Define assignment cardinality, reassignment/unassignment policy, read visibility, and audit/history requirements. |
| C03-D07 | Source and campaign representation | R0 names source/campaign but does not define free text versus governed records, attribution values, campaign lifecycle, or correction authority. | Define the representation, taxonomy governance, requiredness, and attribution/correction rules. |
| C03-D08 | SalesActivity data and lifecycle | R0 lists activity categories but does not define activity fields, direction, scheduled/completed/cancelled states, outcomes, due dates, ownership, notes immutability, attachment use, or editing/deletion policy. | Define activity fields, type vocabulary governance, lifecycle, activity ownership, visibility, and audit/retention rules. |
| C03-D09 | Lead-to-customer conversion behavior | R0 allows Leads to link optionally to Customers but does not define conversion creation, reuse of an existing Customer, idempotency, conversion trigger, or relationship to `WON` and later reservation. | Define conversion semantics, duplicate handling, lifecycle trigger, and immutable history expectations. |
| C03-D10 | Enquiry-to-lead boundary and consent | R0 contains a restricted public `/public/enquiries` boundary and a Lead domain but does not define enquiry fields, consent/notice, anti-abuse controls, routing, or whether every enquiry creates a Lead. | Define the public-enquiry data contract, consent/retention requirements, operational routing, and the creation relationship to Lead. Escalate legal/compliance requirements rather than assuming them. |
| C03-D11 | Capability and route mapping | R0 names planned `lead:*`, `customer:*`, and `sales-activity:manage` capabilities while the current repository uses source-derived capabilities and a `/commercial` controller convention. | Confirm the capability names/actions and route mapping to the existing RBAC/API convention without introducing new roles. |
| C03-D12 | Privacy, retention, and deletion | R0 requires tenant isolation, audit, and a restricted public/private boundary but does not define PII masking, retention, export, erasure, deletion, or access-log requirements for commercial parties and interactions. | Define data-classification, retention, correction/deletion, export, and access-control requirements; escalate jurisdictional compliance decisions. |
| C03-D13 | Relationship to C04 lifecycle | R0 includes `RESERVED` and `WON/LOST` lead states while C04 owns UnitHold and Reservation; it does not define the events that move a Lead into or out of those states. | Define the C03/C04 event boundary and transactional ownership only when C04 is scoped; do not implement an implied hold/reservation transition in C03. |

## Verification plan after decisions

Once the open decisions are approved, C03 must include explicit DTO/contract validation, domain-invariant tests, real PostgreSQL/API integration tests, and clean/upgrade migration rehearsals. At minimum, evidence must prove tenant isolation for Customer, Lead, and SalesActivity; permission enforcement for customer, lead, assignment, and activity operations; audit emission for material commercial mutations; Customer/User linkage boundaries; Lead lifecycle transition enforcement; assignment visibility; relationship consistency for Project/Unit links; protection of internal notes and PII from public responses; and absence of C04, compliance-integration, and Development Intelligence schema/code.

## Implementation stop

C03 implementation is intentionally **not authorized** by this document. No C03 schema, migration, API, service, contract, UI, or integration should be written until the listed commercial rules are proposed, confirmed or amended by the operator, and a subsequent task authorizes implementation.

## References

- `docs/product-reset-blueprint.md` §§2–3, 6–7, 9–16
- `docs/c02-pricing-media-scope.md`
- `docs/c02-commercial-rule-decisions.md`
