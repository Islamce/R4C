# Architecture

## Monorepo

- `apps/web`: Next.js web application
- `apps/api`: NestJS API and domain services
- `apps/bim-worker`: Python IFC processing service
- `packages/contracts`: shared API schemas and domain types
- `packages/ui`: reusable design-system components where present

R4C remains a single monorepo. The Product Reset does not authorize a repository split or application rewrite.

## Product bounded contexts

### Platform Core

Identity & Access; Tenancy; RBAC; Audit; Notifications; Documents/Object Storage; shared workflow foundations; localization; security; runtime/deployment.

### Commercial — active priority

Property Inventory; Phases; Buildings; Floors; Units; Unit Types; Pricing; Payment Plans; Customers; Leads; Sales Activities; Holds; Reservations; Commercial Analytics.

### Customer Experience — active MVP/P1

Public Project Showcase; Unit Finder; Unit Detail; Enquiry; Reservation Journey; later Customer Portal.

### Development Intelligence — frozen capability layer

WBS & Scheduling; Documents & Design Control where construction-specific; BIM/IFC; Progress; 4D; 5D Cost; Materials/Procurement/Site Inventory; Quality; HSE; Commissioning; Construction Handover.

Existing Development Intelligence code remains supported but receives no new capability during Commercial MVP except approved maintenance/integration work.

## Aggregate strategy

The existing `Project` model remains the canonical development/project root because it already anchors historical WBS, BIM, schedules, budgets, materials, quality, HSE, commissioning, documents, and access relationships.

Commercial property hierarchy is additive:

`Tenant → Project/Development → DevelopmentPhase → Building → Floor → Unit`

Do not rename or replace `Project` during R0/R1. Do not convert WBS nodes into Commercial phases/buildings/floors/units.

## Dependency direction

Commercial and Customer Experience must be independently operable without Development Intelligence.

Allowed integration direction:

`Development Intelligence → controlled adapter/published snapshot → Commercial/Customer Experience`

Examples:

- approved internal progress may later publish a customer-friendly progress snapshot;
- commissioning readiness may later feed customer handover readiness;
- BIM may later link an apartment/space to a Commercial Unit through an explicit optional bridge.

Disallowed:

- Unit availability depending on BIM worker availability;
- Reservation requiring WBS or BIM data;
- Public unit APIs exposing construction internals;
- reusing construction material inventory tables for property inventory.

## Commercial API boundary

API remains versioned under `/api/v1`.

Privileged Commercial domains should live under the existing authenticated API boundary, with modules conceptually grouped under `apps/api/src/commercial/` as implementation evolves.

Public customer-facing responses shall use explicit DTOs under a restricted public API boundary, recommended as:

- `/api/v1/public/projects`
- `/api/v1/public/projects/:slug`
- `/api/v1/public/units`
- `/api/v1/public/units/:id`
- `/api/v1/public/enquiries`

Public DTOs must not expose internal WBS, BIM, cost, procurement, audit, margin, or private sales data.

## Shared contracts

Cross-boundary Commercial contracts belong in `packages/contracts` rather than being duplicated only in the frontend.

Initial target contracts include:

- `ProjectCommercialSummary`
- `UnitSummary`
- `UnitDetail`
- `UnitSearchQuery`
- `PaymentPlanSummary`
- `LeadSummary`
- `CustomerSummary`
- `HoldResult`
- `ReservationSummary`
- `AvailabilityStatus`

## Runtime flow — Commercial MVP

1. Admin configures Project/Development and Commercial hierarchy.
2. API persists tenant-scoped Phase/Building/Floor/Unit records in PostgreSQL.
3. Pricing is published as immutable revisions.
4. Existing object storage/document infrastructure serves commercial media through controlled references.
5. Public API returns only released/published project and unit data.
6. Visitor submits an enquiry; API creates a tenant-scoped Lead/Customer context.
7. Authorized Sales user creates a time-bound UnitHold transaction.
8. Reservation confirmation captures an immutable commercial price snapshot.
9. Unit availability changes atomically and all relevant state changes are audited.

## Runtime flow — existing Development Intelligence

Existing BIM flow remains intact:

1. Web/API requests signed object-storage operations.
2. IFC is uploaded without passing file bodies through API memory.
3. API queues BIM-processing work in BullMQ.
4. BIM worker validates/extracts IFC data and derived geometry.
5. API persists normalized BIM records in PostgreSQL.
6. Viewer uses authorized artifacts and WBS links.
7. Approved internal progress rolls up through Development Intelligence dashboards.

This flow is retained but is not the current Commercial MVP.

## Architecture rules

- Tenant ID is mandatory on tenant-owned records and enforced in services/repositories.
- Business transitions belong in domain services, not controllers or UI code.
- File metadata lives in PostgreSQL; file bodies live in object storage.
- Published/revision-controlled business records remain immutable; correction creates a new revision or governed reversing transition.
- Availability/Hold/Reservation state changes must be concurrency-safe and transactional.
- Reservation must persist a commercial pricing snapshot rather than derive history from current price.
- All sensitive commercial transitions create append-only audit events.
- Public DTOs are explicit allowlists, never raw Prisma serialization.
- APIs remain versioned and documented.
- Prisma changes use additive migrations during the reset; no `db push`, baseline rewrite, or destructive model removal is authorized.

See `docs/product-reset-blueprint.md`, `docs/mvp-scope.md`, and `docs/development-freeze-register.md` for the governing product boundaries.
