# i18n & C04 Commercial Rule Decisions

**Status:** Authorized for implementation.  
**Date:** 14 August 2026  
**Authority:** Operator-approved self-contained i18n/C04 implementation prompt, reconciled against the R0 Product Reset Blueprint and current C02/C03 conventions.  
**Supersedes for implementation:** The blocked state in `i18n-scope.md` and `c04-holds-reservations-scope.md` only to the extent explicitly resolved below. Their excluded-scope rules remain in force.

## Decision summary

| ID | Decision | Authorized implementation rule |
| --- | --- | --- |
| I18N-01 | Translation representation | Add an additive tenant-safe `Translation` sidecar with `entityType`, `entityId`, `locale`, `field`, and `value`. Existing C01–C03 content columns are not changed. |
| I18N-02 | Supported locales and fallback | Support `en` and `ar`. A request for a missing locale value falls back to the entity’s English translation. |
| I18N-03 | Translation allow-list | Only `Project.description`, `DevelopmentPhase.description`, and `UnitType.description` are translatable in this increment. No other entity/field pair is accepted. |
| I18N-04 | Media localization | Locale-specific files, if needed later, are DocumentVersion variants tagged with a locale. This implementation adds no new media-localization mechanism. |
| I18N-05 | Governance | Reuse existing commercial content-management capability boundaries; do not create a role. |
| C04-01 | Hold creation | A sales-capability user creates a Hold linked to a Lead. In one tenant-safe transaction the Unit must move `AVAILABLE → HELD`; any other state fails. Lead status is unchanged. |
| C04-02 | Hold expiry and cancellation | A Hold has a required caller-supplied `holdExpiresAt`; no system-wide duration default exists. Expiry sweep and manual cancellation atomically move `HELD → AVAILABLE` only when the Unit is still held by that specific active Hold. Lead status is unchanged. |
| C04-03 | Expiry execution | Add one narrowly scoped Redis-backed repeating sweep worker. `HOLD_EXPIRY_SWEEP_INTERVAL_MS` is a required deployment configuration: absence fails loudly and no code default is supplied. The sweep is idempotent, tenant-safe, and rechecks Hold/Unit state atomically. |
| C04-04 | Reservation confirmation | Confirmation consumes an active Hold, records a Reservation, and atomically moves Unit `HELD → RESERVED`. It system-drives the associated Lead `NEGOTIATION → RESERVED`; no Hold event changes a Lead. |
| C04-05 | Price snapshot | Select the Unit’s currently published `UnitPriceRevision`. Record its lineage ID plus immutable base price, list price, and currency copies. No discount, quotation, or later repricing behavior is introduced. |
| C04-06 | Commercial terms | Reservation `amount` and `currency` derive only from the published price snapshot. A Project PaymentPlan is required and explicitly selected by the confirming user; no default plan selection, ledger, collection, escrow, or payment processing is introduced. |
| C04-07 | Confirmation authority | Add source-derived capability `commercial:reservation:confirm`, distinct from Hold creation. Map it through existing RBAC seed derivation; do not add a role. |
| C04-08 | WON / LOST | `WON` and `LOST` remain manual-only. Hold creation, release, cancellation, expiry, sweep, and Reservation confirmation must not set either. |
| C04-09 | Concurrency | Hold creation, confirmation, and expiry use the existing transactional, tenant-scoped, fail-clean-on-unexpected-state pattern. A competing Hold may not succeed for the same Unit. |

## R0 alignment

R0 requires UnitHold to be time-bound and concurrency-safe, allows at most one active Hold for a Unit, requires an immutable Reservation price snapshot, and requires hold/reservation/availability transitions to be transactional and audited. The decisions above supply the previously unspecified trigger, relation, transition, price-lineage, payment-plan, and expiry rules without changing R0’s availability/status vocabulary or excluded scope. [R0 §§6–7, §11](product-reset-blueprint.md)

The system-driven Lead transition is intentionally limited to Reservation confirmation. It preserves C03’s actual transition matrix by requiring the Lead to be at `NEGOTIATION` before C04 moves it to `RESERVED`; it does not create a bypass from earlier or terminal Lead states.

## Implementation exclusions

The following remain excluded: Wafi/REGA and any fee-cap placeholder; ZATCA/Fatoora; Nafath; electronic signature; contract generation or legal artifact workflow; escrow; payment collection/processing; finance/ERP; commission; outbound messaging/campaign automation; public reservation API; unapproved translatable fields; and Development Intelligence changes.

## Required verification

Implementation must prove, through real PostgreSQL/API tests, the translation allow-list and English fallback; atomic Hold creation with competing requests; required no-default expiry configuration; idempotent expiry release; the confirmed-Reservation race guard; manual cancellation; confirmed Reservation price and PaymentPlan snapshots; the system-driven `Lead.RESERVED` transition; and the absence of automatic `WON`/`LOST` changes. Migration clean/upgrade rehearsal, typecheck, and clean-checkout architecture generation remain mandatory.

## References

- [R0 Product Reset Blueprint](product-reset-blueprint.md) §§3, 6–7, 9–11, 13, 15–16
- [i18n Scope Gate](i18n-scope.md)
- [C04 Holds & Reservations Scope Gate](c04-holds-reservations-scope.md)
- [C03 Commercial Rule Decisions](c03-commercial-rule-decisions.md)
