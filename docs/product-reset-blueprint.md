# R4C Product Reset Blueprint

**Status:** R0 governing baseline

**Date:** 2026-08-11

## 1. Decision

R4C is being reoriented from a development-control-first product into a commercial-first digital real-estate developer platform.

The platform is not being rewritten. Existing Development Intelligence capabilities are retained and frozen while a Commercial bounded context and customer-facing experience are added.

## 2. Product north star

`Discover → Explore → Select → Enquire → Hold → Reserve → Contract → Pay → Track → Handover`

The immediate MVP stops at a governed, audited reservation journey.

## 3. Product domains

### Platform Core — KEEP/REUSE

- Tenant
- User/authentication/session
- RBAC/permissions
- Audit
- Documents/object storage
- Notifications
- Workflow foundations
- Localization/RTL
- Security/runtime/CI/deployment

### Commercial — BUILD NOW

- Project/Development commercial profile
- DevelopmentPhase
- Building
- Floor
- UnitType
- Unit
- UnitPriceRevision
- PaymentPlan / PaymentPlanInstallment
- Commercial media references
- Customer
- Lead
- SalesActivity
- UnitHold
- Reservation
- Commercial analytics

### Customer Experience — BUILD MVP/P1

- Public project catalog/showcase
- Unit finder
- Unit detail
- Compare/shortlist later in P1 if needed
- Enquiry capture
- Reservation entry journey
- Customer portal after reservation core is stable

### Development Intelligence — FREEZE

- WBS
- IFC/BIM worker and viewer
- Schedule/4D
- Progress
- 5D/cost
- Materials/procurement/site inventory
- Quality
- HSE
- Commissioning
- Construction handover

## 4. Personas

### Buyer / Investor

Browse developments and units, inspect price/payment plan, enquire, reserve, then later track documents, payments, project progress, and handover.

### Sales Agent

Search live inventory, manage assigned leads and activities, create holds/reservations, and follow conversions.

### Sales Manager

Monitor inventory, pipeline, conversion, reservation expiry, agent workload, and commercial exceptions.

### Commercial Administrator

Configure project hierarchy, units, media, pricing, payment plans, release/block states, and publishable data.

### Customer Service / Handover

Support purchased units, documents, payment schedules, progress communications, requests, and future handover.

### Development Manager

Uses the existing frozen Development Intelligence capability layer; not the primary MVP persona.

## 5. Canonical Commercial hierarchy

`Tenant → Project/Development → DevelopmentPhase → Building → Floor → Unit`

`Project` is retained. It is not renamed or replaced during R0/R1 because it already anchors existing tenant/project access and Development Intelligence relationships.

## 6. Proposed domain model

### DevelopmentPhase

Core fields: `id`, `tenantId`, `projectId`, `code`, `name`, `description?`, `status`, `sequence`, `launchDate?`, `expectedCompletionDate?`, `salesOpenAt?`, `salesCloseAt?`, timestamps.

### Building

Core fields: `id`, `tenantId`, `projectId`, `phaseId`, `code`, `name`, `buildingType?`, `status`, `floorsCount?`, location fields, `handoverTargetDate?`, timestamps.

### Floor

Core fields: `id`, `tenantId`, `buildingId`, `code`, `name`, `floorNumber`, `sequence`, optional floor-plan document reference, timestamps.

### UnitType

Core fields: `id`, `tenantId`, optional `projectId`, `code`, `name`, bedroom/bathroom defaults, default area, description, timestamps.

### Unit

Core fields: `id`, `tenantId`, `projectId`, `phaseId`, `buildingId`, `floorId`, `unitTypeId`, `code`, `number`, `status`, area fields, bedrooms/bathrooms, orientation/view, parking, publish state, release timestamp, timestamps.

Approved initial availability states:

- `DRAFT`
- `UNRELEASED`
- `AVAILABLE`
- `HELD`
- `RESERVED`
- `SOLD`
- `BLOCKED`
- `WITHDRAWN`

### UnitPriceRevision

Immutable published pricing history: unit, revision, base/list price, currency, validity, status, creator, published timestamp.

### PaymentPlan / PaymentPlanInstallment

Project-level reusable commercial payment terms. Unit-specific overrides are deferred until evidence requires them.

### Commercial media

Reuse existing storage/document/version infrastructure through explicit `ProjectMedia`, `BuildingMedia`, and/or `UnitMedia` references. Do not introduce a second file store.

### Customer

Separate commercial party from authenticated `User`. A customer may exist before registration. Optional `userId` may link a portal identity later.

### Lead

Tenant-scoped commercial opportunity linked optionally to Customer, Project and Unit, with assigned sales user, source/campaign and status.

Initial statuses:

`NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON/LOST`

`DISQUALIFIED` is an allowed terminal branch.

### SalesActivity

Call/email/WhatsApp/meeting/site visit/follow-up/note history.

### UnitHold

Time-bound, concurrency-safe lock on a unit. At most one active hold may exist for a unit.

Initial statuses: `ACTIVE`, `EXPIRED`, `CONVERTED`, `RELEASED`, `CANCELLED`.

### Reservation

Captures unit, customer, lead, payment plan, immutable price snapshot, reservation amount, currency, expiry, creator/approver and lifecycle timestamps.

Initial statuses: `DRAFT`, `PENDING`, `CONFIRMED`, `EXPIRED`, `CANCELLED`, `CONVERTED_TO_SALE`.

## 7. Critical invariants

- Commercial records are tenant isolated.
- Public APIs expose only explicitly published/released data.
- Commercial property inventory is not construction material inventory.
- One unit cannot have two simultaneous active holds/reservations.
- Reservation captures immutable pricing snapshot.
- Published price history is revision-controlled; no silent destructive price mutation.
- Hold/reservation/availability transitions are transactional and audited.
- Commercial does not require BIM/WBS to execute.

## 8. Navigation target

### Public

- `/`
- `/projects`
- `/projects/[projectSlug]`
- `/projects/[projectSlug]/units`
- `/units/[unitId]`
- `/enquiry`
- `/reserve/[unitId]`

### Authenticated Commercial

- Overview
- Inventory
- Leads
- Sales
- Reservations
- Customers
- Analytics
- Administration

### Inventory subnavigation

Developments → Phases → Buildings → Floors → Units → Unit Types → Pricing → Payment Plans → Media

### Development Intelligence

Existing construction routes move behind a Development Intelligence navigation group and are not the default Commercial experience.

## 9. API map

Keep `/api/v1`.

Commercial privileged endpoints are grouped by resource:

- `/projects/:projectId/phases`
- `/projects/:projectId/buildings`
- `/buildings/:buildingId/floors`
- `/units`
- `/units/:unitId`
- `/units/:unitId/release`
- `/units/:unitId/block`
- `/units/:unitId/prices`
- `/unit-prices/:priceId/publish`
- `/projects/:projectId/payment-plans`
- `/customers`
- `/leads`
- `/leads/:leadId/assign`
- `/leads/:leadId/activities`
- `/units/:unitId/holds`
- `/holds/:holdId/release`
- `/holds/:holdId/convert`
- `/reservations`
- `/reservations/:reservationId/confirm`
- `/reservations/:reservationId/cancel`

Restricted public boundary:

- `/api/v1/public/projects`
- `/api/v1/public/projects/:slug`
- `/api/v1/public/units`
- `/api/v1/public/units/:id`
- `/api/v1/public/enquiries`

## 10. Permission map

Initial planned permissions:

- `inventory:commercial:read`
- `unit:create`, `unit:update`, `unit:release`, `unit:block`
- `pricing:read`, `pricing:create`, `pricing:publish`
- `payment-plan:read`, `payment-plan:manage`
- `lead:read`, `lead:create`, `lead:update`, `lead:assign`
- `customer:read`, `customer:create`, `customer:update`
- `sales-activity:manage`
- `hold:create`, `hold:release`
- `reservation:read`, `reservation:create`, `reservation:confirm`, `reservation:cancel`, `reservation:approve`
- `commercial-analytics:read`

Do not rename construction `inventory:*` permissions into commercial meanings.

## 11. Migration strategy

All Product Reset migrations are additive.

Prohibited during R0/R1:

- editing migration baseline;
- Prisma `db push` for governed schema changes;
- destructive Project rename/removal;
- deleting WBS/BIM/development data;
- automatically converting WBS nodes into property hierarchy.

Sequence:

- **C01 Commercial Structure:** DevelopmentPhase, Building, Floor, UnitType, Unit.
- **C02 Pricing & Media:** UnitPriceRevision, PaymentPlan, PaymentPlanInstallment, media references.
- **C03 Customer & Leads:** Customer, Lead, SalesActivity.
- **C04 Holds & Reservations:** UnitHold, Reservation with mandatory concurrency proof.

Each migration must pass clean-database rehearsal and upgrade-from-current-schema rehearsal.

## 12. Public/private data boundary

Public responses must use explicit DTOs. Never expose raw Prisma records.

Public responses must exclude internal WBS/BIM/cost/procurement/HSE/quality data, audit metadata, margins, internal notes and other non-customer information.

## 13. Frontend strategy

Reuse existing Next.js application, session boundary, AppShell, i18n/RTL foundation, API client and error-state patterns.

Reset information architecture; do not rewrite the frontend foundation.

Default route should become role-aware in future implementation: Sales → Commercial workspace, Development role → Development Intelligence, Customer → customer portal.

## 14. Shared contracts strategy

Commercial cross-boundary types belong in `packages/contracts`.

Initial candidates: `ProjectCommercialSummary`, `UnitSummary`, `UnitDetail`, `UnitSearchQuery`, `PaymentPlanSummary`, `LeadSummary`, `CustomerSummary`, `HoldResult`, `ReservationSummary`, `AvailabilityStatus`.

## 15. Test strategy

Every Commercial increment requires:

- DTO/contract validation;
- domain invariant tests;
- real PostgreSQL/API integration tests;
- real Next.js + API + PostgreSQL journey tests where UI is delivered.

Mandatory tests include tenant isolation, unpublished-price privacy, availability transitions, hold/reservation concurrency, immutable reservation price snapshot, permission enforcement, audit creation, and public DTO leakage prevention.

## 16. Product MVP acceptance

Commercial MVP exists only after one real path proves:

Admin configures Project → Phase → Building → Floor → Unit → publishes price/payment plan → public visitor browses/filter units → opens Unit → submits enquiry → Lead appears → permitted Sales user creates Hold → Reservation confirms → Unit status updates → conflicting second transaction is blocked → relevant actions are audited.

## 17. Non-goals

Not authorized in the Commercial MVP: full ERP/accounting, mortgage processing, broker marketplace, commission settlement, facilities/community management, native mobile app, advanced AI valuation/recommendation, digital twin/IoT expansion, and further Development Intelligence feature expansion.

## 18. Governance

Feature classification before coding:

- **Commercial Core:** active roadmap.
- **Platform Enabler:** allowed if required for Commercial.
- **Development Intelligence:** frozen backlog unless maintenance/integration exception.
- **Future Expansion:** not authorized.

Agents may not autonomously redefine product identity, primary personas, domain boundaries, MVP definition, availability semantics, reservation semantics, public/private data boundary, repository split, or freeze policy.

## 19. R0 exit gate

Before C01 product code:

- Product definition updated.
- MVP scope updated.
- Architecture boundary updated.
- Development freeze register recorded.
- Commercial model/API/navigation/migration strategy recorded.
- Open PRs reconciled.
- Current `main` baseline understood.
- C01 brief approved.
- No destructive migration planned.

R0 itself is documentation/governance only.
