# R4C Commercial MVP Scope

## Product objective

Provide a governed, bilingual, tenant-aware commercial journey for a real-estate developer from project/unit discovery through enquiry, controlled hold, and reservation.

The Commercial MVP must be independently usable without BIM, WBS, 4D, 5D, quality, HSE, materials, or commissioning modules.

## Primary personas

- Property buyer / investor
- Sales agent
- Sales manager
- Developer commercial administrator
- Customer service / handover team

Development/project managers remain supported by the existing Development Intelligence capability layer but are not the primary persona for this MVP.

## Commercial hierarchy

The canonical property inventory hierarchy is:

`Tenant → Project/Development → Phase → Building → Floor → Unit`

The existing `Project` model remains the development root. New Commercial entities are additive; existing WBS nodes must not be reinterpreted as phases, buildings, floors, or units.

## In scope — P0

### Platform reuse

- Tenant isolation and subdomain resolution
- Authentication and secure sessions
- RBAC/permissions
- Append-only audit history
- Document/object-storage foundation
- Notifications where required
- Arabic/English UI with RTL support
- Existing Next.js server API/session boundary

### Property inventory

- Development/project commercial metadata
- Phases
- Buildings
- Floors
- Unit types
- Units
- Availability states
- Unit search/filtering
- Unit media/floorplans using existing storage infrastructure

### Pricing and payment plans

- Immutable published unit-price revisions
- Payment plans and installment definitions
- Public exposure of published/current commercial data only

### Lead capture

- Customer/contact master independent from authenticated User identity
- Enquiry/lead creation
- Lead assignment and basic sales activity history

### Holds and reservations

- Time-bound unit hold
- Reservation creation and confirmation
- Immutable reservation pricing snapshot
- Authoritative unit availability transitions
- Concurrency protection so one unit cannot be actively held/reserved twice
- Audited transitions

### Public customer-facing experience

- Project catalog/showcase
- Project detail
- Unit finder
- Unit detail
- Enquiry capture
- Controlled reservation entry path

## Commercial MVP acceptance journey

The MVP is accepted only when a real end-to-end journey proves all of the following:

1. Admin configures a project/development.
2. Admin creates phase, building, floor, and units.
3. Admin publishes unit pricing and a payment plan.
4. Public visitor browses the project without internal credentials.
5. Visitor filters available units.
6. Visitor opens a unit detail page.
7. Visitor submits an enquiry.
8. The enquiry appears as a lead in the Sales workspace.
9. A permitted user creates a unit hold.
10. A reservation is confirmed using a price snapshot.
11. Unit availability updates authoritatively.
12. A simultaneous/conflicting second hold or reservation cannot succeed.
13. Cross-tenant access is rejected.
14. Unpublished prices are not exposed publicly.
15. Relevant commercial transitions produce audit events.

## Unit availability baseline

The approved baseline states for the initial design are:

- `DRAFT`
- `UNRELEASED`
- `AVAILABLE`
- `HELD`
- `RESERVED`
- `SOLD`
- `BLOCKED`
- `WITHDRAWN`

Implementation may not broaden or redefine these semantics without Product/Founder approval.

## Commercial workflow baseline

The initial lead pipeline is:

`NEW → CONTACTED → QUALIFIED → APPOINTMENT → NEGOTIATION → RESERVED → WON/LOST`

A `DISQUALIFIED` terminal branch is allowed.

Hold and reservation lifecycles shall use domain-specific state machines rather than reuse the generic construction `WorkflowStatus` enum.

## Explicitly frozen — Development Intelligence

No new product capability is authorized during the Commercial MVP for:

- WBS
- IFC/BIM processing or viewer enhancement
- 4D schedule visualization
- 5D cost/earned-value expansion
- Construction materials/procurement/site inventory
- Quality/NCR/punch enhancement
- HSE/permits enhancement
- Commissioning enhancement
- Construction-handover enhancement

Maintenance is allowed only for security, runtime/production, data integrity, migration compatibility, or explicitly approved Commercial integration.

## Explicitly deferred beyond Commercial MVP

- Full contract lifecycle
- Full collections/payment processing engine
- Accounting/ERP
- Mortgage processing
- Broker marketplace
- Commission settlement
- Facilities/property/community management
- Native mobile apps
- Advanced AI recommendations/predictive valuation
- Digital twin/IoT expansion
- Automated BIM-to-unit linkage

## Migration policy

- Additive Prisma migrations only.
- Do not edit the existing migration baseline.
- Do not use `prisma db push` for governed schema changes.
- Do not destructively rename/remove existing development-control models during R0/R1.
- Rehearse clean migration and upgrade-from-current-schema paths before merge.

## Architecture independence rule

Commercial must work for both:

- a developer using the existing BIM/5D/Development Intelligence stack; and
- a developer using only property inventory, sales, reservation, and customer experience.

Therefore Commercial must not require Development Intelligence internals to execute core sales journeys.
