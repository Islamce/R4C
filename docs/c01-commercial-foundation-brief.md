# C01 — Commercial Domain Foundation Brief

**Status:** Implementation brief; product code remains blocked until R0 merge/review.

## Objective

Deliver the first Commercial vertical foundation:

`Project → DevelopmentPhase → Building → Floor → UnitType → Unit`

with tenant isolation, secure CRUD, commercial inventory listing/filtering, bilingual UI integration, audit coverage, and real database/API verification.

## In scope

### Database

Add only:

- `DevelopmentPhase`
- `Building`
- `Floor`
- `UnitType`
- `Unit`
- necessary Commercial enums and indexes

Use additive Prisma migration(s). Do not modify historical migrations.

### API

Implement tenant-scoped privileged endpoints required to:

- create/list/read/update phases;
- create/list/read/update buildings;
- create/list/read/update floors;
- create/list/read/update unit types;
- create/list/read/update units;
- release/block units using explicit domain commands where state transition rules apply;
- filter units by project/phase/building/floor/type/bedrooms/bathrooms/area/status and other approved C01 attributes.

C01 does not implement price revisions, leads, holds, or reservations.

### Frontend

Add an authenticated Commercial Inventory workspace with:

- hierarchy navigation;
- unit list;
- filters;
- unit create/edit administration appropriate to permissions;
- English and Arabic/RTL support;
- loading/empty/error states using existing foundation.

Do not redesign the entire application shell in C01.

### Shared contracts

Cross-boundary unit/inventory DTOs and search types belong in `packages/contracts` where practical.

## Proposed Unit baseline

Availability states:

- `DRAFT`
- `UNRELEASED`
- `AVAILABLE`
- `HELD`
- `RESERVED`
- `SOLD`
- `BLOCKED`
- `WITHDRAWN`

C01 may expose all states in schema, but it must not implement fake hold/reservation semantics before C04. State transitions reserved for future transaction domains must not be freely writable through generic PATCH.

## Security requirements

- Every tenant-owned entity includes/enforces `tenantId`.
- Project ownership must agree with authenticated tenant.
- Parent-child links must be validated within the same tenant/project hierarchy.
- Cross-tenant IDs must not leak existence.
- Unknown DTO fields are rejected using existing validation conventions.
- Write permissions are distinct from read permissions.

## Data integrity requirements

- Unique project/phase/building/floor/unit codes within an explicitly defined scope.
- A Floor cannot point to a Building from another project/tenant.
- A Unit cannot combine phase/building/floor IDs from inconsistent hierarchy branches.
- Existing `Project`, WBS, BIM and construction records remain unchanged.
- No WBS-to-building/unit conversion.

## Audit requirements

At minimum audit:

- phase create/update;
- building create/update;
- floor create/update;
- unit type create/update;
- unit create/update;
- unit release/block transitions.

## Verification gates

C01 is not complete until the PR proves:

1. clean PostgreSQL migration deployment;
2. upgrade from current `main` schema without destructive reset;
3. Prisma validate/generate and drift checks;
4. tenant isolation for all new primary resources;
5. parent-child hierarchy integrity;
6. authenticated API CRUD/list/filter journey;
7. bilingual Commercial Inventory UI journey where UI is in scope;
8. audit evidence for governed writes;
9. existing auth/security/core and frozen Development Intelligence regression gates remain green or any pre-existing failure is explicitly evidenced as unrelated;
10. no BIM/WBS runtime dependency is required for Commercial inventory.

## Explicit non-goals

Do not add in C01:

- pricing revisions;
- payment plans;
- media redesign;
- Customer/Lead/CRM;
- holds/reservations;
- public project portal;
- contract/collections;
- new BIM/4D/5D capabilities;
- new materials/quality/HSE/commissioning capabilities.
- quotations, discount approval or contracting;
- invoices, ZATCA/FATOORA integration or ERP posting;
- buyer payment ledger or collection allocation;
- `FinancialDimensionMapping` or cost-center posting;
- `RegulatoryProfile`, `TaxTreatment` or regulatory decision automation;
- sales SLA or sales KPI engines.

The enterprise and regulatory boundaries governing these exclusions are defined in `docs/r0-1-enterprise-regulatory-architecture.md`.

## Approval and evidence gate

C01 is **not authorized by documentation alone**. Before implementation, the Founder/Product owner must approve the exact C01 scope after PR #47 is merged to a validated `main`. The implementation branch must start from that updated `main`, not from this documentation branch.

The approved brief must retain the non-goals above and identify the migration owner, hierarchy uniqueness scopes, UI inclusion, permission map and acceptance evidence. Any proposal to add Customer/Lead, reservations, financial integration or regulatory automation returns to product/legal/business approval rather than expanding C01 implicitly.

## Branching rule

Start C01 from the latest validated `main` after R0 Product Reset is merged. Do not stack C01 on an unmerged reset branch.
