# C02 Pricing & Media Scope Gate

**Status:** Approved for implementation; commercial rules resolved in [`c02-commercial-rule-decisions.md`](c02-commercial-rule-decisions.md).  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint and R2 reconciliation.  
**Non-authorizations:** This document does not authorize Wafi/REGA, ZATCA/Fatoora, electronic-signature, contract, escrow, payment-collection, or frozen Development Intelligence work.

## Verified scope

C02 is the second additive commercial increment after implemented C01. R0 defines C02 as:

> `UnitPriceRevision`, `PaymentPlan`, `PaymentPlanInstallment`, and media references.

The approved invariant is immutable **published** pricing history: a unit, revision, base/list price, currency, validity, status, creator, and published timestamp. Payment plans are reusable at the **project** level; unit-specific overrides are deferred. Commercial media must be explicit `ProjectMedia`, `BuildingMedia`, and/or `UnitMedia` references that reuse the established document/version and object-storage foundation rather than introducing another file store.

The existing repository has a commercial C01 hierarchy and a document/version foundation. A `Document` is tenant- and project-scoped; `DocumentVersion` owns object-storage metadata, checksums, review state, and the current-version relation. No C02 model, commercial permission seed, or price/payment/media route exists today.

## Implementation boundary once approved

| Area | Approved direction | Not authorized in C02 |
| --- | --- | --- |
| Unit price revision | Additive, tenant-isolated revision records for a unit; published history must remain immutable and auditable. | Discounts, quotations, tax determination, reservation pricing snapshots, invoices, payment collection, or contracts. |
| Payment plan | Additive, project-level reusable plan and installment definitions. | Unit-specific override, contract-specific accepted schedules, collections ledger, allocation, ERP posting, or finance authority integration. |
| Commercial media | Additive references to existing Document/DocumentVersion infrastructure. | A second file store, bespoke file upload pipeline, BIM model linkage, or public exposure of unpublished/private material. |
| APIs and contracts | Preserve `/api/v1`, explicit DTOs, tenant isolation, RBAC, audit, and public/private boundary. | Raw Prisma responses or a new compatibility surface unrelated to the commercial boundary. |
| Migration | A new reviewed additive Prisma migration with clean and upgrade rehearsal. | Editing the baseline migration, `prisma db push`, or destructive data changes. |

## Resolved implementation decisions

| ID | Undefined rule | Why it cannot be inferred safely | Required operator decision |
| --- | --- | --- | --- |
| C02-D01 | Price-revision status vocabulary and allowed transitions | R0 requires a `status` and a publish endpoint but supplies no values or transition rules. An enum or publish implementation would otherwise be invented. | Define initial states and who may create, publish, supersede, or retire a revision. |
| C02-D02 | Price validity and overlap rule | R0 requires validity but does not define inclusive/exclusive dates, time zone, open-ended revisions, overlap handling, or whether an existing published price may be superseded prospectively. | Define validity representation and the rule for simultaneous or overlapping published revisions per unit. |
| C02-D03 | Money representation and required price fields | R0 names base/list price and currency but does not define precision, requiredness, currency policy, or whether either price can be zero/absent. | Define precision and validation rules, currency policy, and whether base/list price are both mandatory. |
| C02-D04 | Payment-plan and installment semantics | R0 says reusable project-level terms and installment definitions but supplies no plan status, installment kind, amount/percentage, sequence, due-rule, rounding, total, or validation invariant. | Define the minimum plan and installment fields, calculation basis, required total/rounding checks, and publish/retirement behavior. |
| C02-D05 | Commercial-media reference semantics | R0 requires explicit media references but does not define Document versus DocumentVersion linkage, media role, ordering, caption/alt text, publish state, replacement behavior, or public-access rule. | Define the reference target and minimal metadata/lifecycle for ProjectMedia, BuildingMedia, and UnitMedia. |
| C02-D06 | Permission and route mapping | R0 names `pricing:*` and `payment-plan:*` permissions and resource routes; C01 currently uses the `commercial:*` permission family and a `/commercial` controller shape. Mapping one convention to the other requires an explicit compatibility decision. | Confirm whether C02 adopts R0’s named permissions/resource routes, extends the C01 convention, or performs an approved migration strategy. |

## Verification plan

C02 must include DTO/contract validation, domain-invariant tests, real PostgreSQL/API integration coverage, and clean/upgrade migration rehearsals. At minimum, the verification evidence must prove tenant isolation; unpublished-price privacy; immutable published revisions; authorization on create/publish and plan management; rejection of invalid validity/plan terms; commercial media references only to the tenant/project’s existing document/version records; and absence of Wafi, tax-invoice, or e-signature schemas and code.

## References

- `docs/product-reset-blueprint.md` §§6–7, 9–11, 14–16
- `docs/product-blueprint-r2.md`
- `docs/mvp-scope.md` §§Pricing and payment plans, Migration policy
- `apps/api/prisma/schema.prisma` (`Document`, `DocumentVersion`)
