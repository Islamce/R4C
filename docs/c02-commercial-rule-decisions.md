# C02 Commercial Rule Decisions

**Status:** Operator-approved for C02 implementation.  
**Date:** 14 August 2026  
**Scope:** Resolution of the six C02 prerequisites recorded in [`c02-pricing-media-scope.md`](c02-pricing-media-scope.md).

## 1. Price-revision status vocabulary and transitions

`UnitPriceRevision` uses `DRAFT`, `PUBLISHED`, `SUPERSEDED`, and `WITHDRAWN`.

- `DRAFT → PUBLISHED` is one-way and requires `commercial:price:publish`.
- `DRAFT → WITHDRAWN` is one-way and terminal; it uses the creator/manager capability boundary.
- Publishing a newer revision for the same unit automatically changes the prior published revision to `SUPERSEDED`; that transition is system-set only.
- Published and superseded revision content is immutable. Only the system-set supersession status and `validTo` on the prior revision may change as part of an atomic publish operation.

## 2. Validity rule

`validFrom` is required and defaults to the publish timestamp when not explicitly supplied. `validTo` is nullable; `null` means open-ended/current. A publish operation ensures exactly one active published revision per unit by superseding the existing published revision and setting its `validTo` to the successor’s `validFrom` within the same transaction. Active revision validity ranges may not overlap for a unit.

## 3. Money representation and rounding boundary

Currency is stored as an ISO 4217 code on each price revision. `basePriceMinor` and `listPriceMinor` are integer minor units, never floating-point values. Installment shares are integer basis points, where `10,000` equals 100 percent.

The sum of a payment plan’s installment basis points must equal exactly `10,000` at the plan-definition service boundary. Actual monetary installment amounts, currency conversion, and rounding are deferred until a later approved increment applies a plan to a unit price. That future calculation will use a largest-remainder allocation with residual minor units assigned to the last installment in sequence.

## 4. Reusable payment-plan template structure

A project-level `PaymentPlan` is a reusable percentage template. `PaymentPlanInstallment` holds a one-based `sequence`, `shareBasisPoints`, and optional free-text `label`. It does not hold an amount. Unit-specific overrides, contract-linked accepted schedules, collections, payment allocation, and accounting remain outside C02.

## 5. Commercial-media references

`ProjectMedia`, `BuildingMedia`, and `UnitMedia` are thin reference records. They link their commercial owner to an existing `DocumentVersion`; they do not create a file-store, upload flow, or visibility system. Visibility derives from the referenced version’s existing lifecycle. `sortOrder` is optional; an unset order follows creation order.

## 6. Capabilities and existing RBAC mapping

C02 uses capabilities in the existing source-derived RBAC model. No new role names are created. The seed derives permission records from `@RequirePermissions` literals, grants all derived capabilities to `ADMIN`, and grants actions ending in `read`, `list`, or `get` to `VIEWER`.

| Capability | C02 use |
| --- | --- |
| `commercial:price:create-draft` | Create a unit price revision in draft state. |
| `commercial:price:publish` | Publish a draft and atomically supersede the current revision. |
| `commercial:price:view-published` | Read published price history. |
| `commercial:price:view-draft` | Read draft revisions. |
| `commercial:payment-plan:manage` | Create, update, and manage project-level payment-plan templates. |
| `commercial:media:manage` | Create or remove commercial-media reference records. |

The current source-derived viewer rule recognizes terminal actions `read`, `list`, and `get`; `view-published` and `view-draft` are intentionally not automatically assigned to `VIEWER`. They remain available to `ADMIN` and can be assigned to a future approved sales-facing role without changing the C02 role model.

## Explicit exclusions

C02 does not add Wafi/REGA escrow, ZATCA/Fatoora invoice, electronic-signature, contract, payment collection, finance/ERP, buyer-ledger, commission settlement, or Development Intelligence schema or code.
