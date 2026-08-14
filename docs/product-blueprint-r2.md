# R4C Product Blueprint (R2)

**Status:** Reconciled governing successor; documentation only.  
**Date:** 14 August 2026  
**Basis:** R0 governing baseline, reconciled against the R1 draft in [`R0_R1_RECONCILIATION.md`](R0_R1_RECONCILIATION.md).

## 1. Authority and product identity

R2 preserves R0’s decisions unless this document explicitly records an additive, validation-gated clarification. R4C is a **commercial-first digital real-estate developer platform** whose primary experience supports real-estate sales and reservations. Its intended Saudi-market positioning is a product direction, not evidence that any external regulatory integration is already implemented, approved, or available.

The platform is not being rewritten. It retains the established platform core and commercial hierarchy. Development Intelligence remains frozen, non-default, and recoverable in the active repository; it is not removed, migrated, or developed further under this blueprint.

> No statement in R2 authorizes code changes, schema changes, a destructive migration, provider selection, legal interpretation, or deployment changes.

## 2. Governing reservation journey

The MVP remains R0’s governed, audited reservation journey:

`Discover → Explore → Select → Enquire → Hold → Reserve → Contract → Pay → Track → Handover`

The immediate MVP acceptance gate remains a complete path in which an administrator configures a project hierarchy and commercial terms; a public visitor finds a permitted unit and submits an enquiry; an authorized sales user manages the lead, creates a hold, confirms a reservation; the unit’s availability changes transactionally; a conflicting transaction is blocked; and all relevant actions are audited.

Contracting and payment stages are product landmarks. Their data, legal, signature, tax, and regulatory requirements must be validated before implementation rather than inferred from this journey diagram.

## 3. Scope boundaries

| Boundary | R2 decision |
| --- | --- |
| **Platform Core** | Reuse Tenant, User/authentication/session, RBAC, audit, documents/object storage, notifications, workflow foundations, localization/RTL, and security/runtime/CI/deployment. |
| **Commercial Core** | Build the commercial profile, DevelopmentPhase, Building, Floor, UnitType, Unit, immutable price revisions, reusable payment-plan templates, commercial media references, Customer, Lead, SalesActivity, UnitHold, Reservation, and commercial analytics. |
| **Customer Experience** | Build public project and unit discovery, enquiry capture, and reservation entry. Customer portal work follows a stable reservation core. |
| **Development Intelligence** | Freeze WBS, BIM/IFC, schedule/4D, progress, 5D/cost, materials/procurement, quality, HSE, commissioning, and construction handover. Keep it behind a non-default navigation group. |
| **Future expansion** | Commission settlement, full accounting, mortgage processing, broker marketplace, facilities/community management, native apps, predictive recommendations, digital-twin work, and new Development Intelligence features are not authorized in the Commercial MVP. |

## 4. Commercial model

The canonical property hierarchy remains:

`Tenant → Project/Development → DevelopmentPhase → Building → Floor → Unit`

`Project` remains the shared anchor for tenant/project access and existing frozen relationships; it is not renamed or removed. A Customer remains a commercial party distinct from authenticated User and may later link to a portal identity.

| Domain concept | R2 status and decision |
| --- | --- |
| Lead | R0’s Lead is the commercial opportunity. It may link to Customer, Project, Unit, source/campaign, and assigned sales user. A separate Opportunity entity is not adopted without evidence that Lead cannot fulfill that role. |
| SalesActivity | Keep R0’s call, email, WhatsApp, meeting, site visit, follow-up, and note history. Provider-specific messaging integration is not selected. |
| Unit availability | Preserve `DRAFT`, `UNRELEASED`, `AVAILABLE`, `HELD`, `RESERVED`, `SOLD`, `BLOCKED`, and `WITHDRAWN`. |
| UnitHold | Preserve a time-bound, concurrency-safe unit lock with at most one active hold. |
| Reservation | Preserve immutable price snapshot, amount, currency, expiry, creator/approver, lifecycle timestamps, transactional state change, and audit trail. |
| PaymentPlan / PaymentPlanInstallment | Preserve R0’s project-level reusable commercial terms. Unit-specific overrides remain deferred until evidence requires them. The relationship of a customer contract to an accepted plan/schedule remains a design gate. |
| Contract | Add a future contract-domain boundary. Field set, lifecycle, legal template, signature method, and relation to payment terms require approved product and legal requirements. |
| Price history and media | Preserve immutable price-revision intent and reuse existing document/object storage through explicit commercial media references. Do not introduce a second file store. |
| Commission | Commission settlement remains out of scope. Any non-settlement reporting or tracking requires evidenced business rules for eligibility, rate, basis, and approval. |

## 5. Compliance and integration validation gates

R2 records these areas as **additive validation boundaries**, not implemented product claims or automatic data-model requirements.

| Area | What R2 records | Required validation before design or build |
| --- | --- | --- |
| Wafi / REGA / escrow | Reservation and payment workflow may require project, escrow, and regulatory reporting considerations. | Obtain authoritative legal/regulatory requirements, identify the applicable business flow, validate whether credentials and reporting are per developer/tenant, and approve the resulting scope. |
| Tax invoicing / Fatoora | Payment events may require compliant invoice records and external submission. | Confirm applicability, onboarding phase, credential ownership, required records, submission protocol, and tenant isolation obligations. |
| Electronic identity / signature | Contract signing may need an approved identity/signature workflow. | Validate legal acceptance, provider availability, security boundary, account ownership, data residency, and approval path. |

No fixed reservation-fee percentage, escrow movement, invoice cryptographic field, provider, regulatory deadline, penalty, or API contract is asserted by R2. Such matters require authoritative validation and an explicit implementation decision.

## 6. API, permissions, and data boundary

Retain `/api/v1`, R0’s resource-oriented commercial API map, explicit public DTOs, tenant isolation, permissions, audit creation, and the rule that public data excludes internal WBS/BIM/cost/procurement/HSE/quality data, audit metadata, margins, and internal notes.

The public/product navigation and role-aware future default remain commercial-first: Sales users receive a Commercial workspace; Development users can reach the frozen Development Intelligence area; and a Customer portal follows the reservation core.

## 7. Delivery sequence and assurance

The incumbent sequence remains governing:

1. **C01 Commercial Structure:** DevelopmentPhase, Building, Floor, UnitType, Unit.  
2. **C02 Pricing & Media:** UnitPriceRevision, PaymentPlan, PaymentPlanInstallment, media references.  
3. **C03 Customer & Leads:** Customer, Lead, SalesActivity.  
4. **C04 Holds & Reservations:** UnitHold and Reservation with mandatory concurrency proof.

Contract-domain, signature, regulatory-reporting, invoice, and any commission work are not reordered into the active sequence. They may be planned only after their validation gates are met and an approved brief defines the business and compliance boundary.

Every implemented increment requires DTO/contract validation, domain-invariant tests, PostgreSQL/API integration tests, and a real Next.js/API/PostgreSQL journey when UI is delivered. The mandatory assurance set continues to include tenant isolation, unpublished-price privacy, availability transitions, hold/reservation concurrency, immutable price snapshots, permission enforcement, audit creation, and public-DTO leakage prevention.

## 8. Runtime and hosting posture

R2 does not inherit specialized processing infrastructure from the frozen BIM scope. It does not approve a new runtime architecture or make performance claims. CRM deployment readiness requires an approved target environment and real measured runtime evidence before any successor deployment gate can clear.

## 9. Governance and open validation boundaries

Feature classification remains Commercial Core, Platform Enabler, frozen Development Intelligence, or Future Expansion. Agents may not redefine identity, personas, domain boundaries, MVP scope, availability/reservation semantics, public/private boundary, repository split, or freeze policy without an explicit operator decision.

The following are **validation gates**, not unresolved R0/R1 conflicts: contract lifecycle and fields; accepted-plan/schedule relationship; legal/regulatory treatment of reservation/escrow flows; tax-invoicing applicability and integration; electronic-signature provider; and commission rules. These topics must receive evidenced requirements before implementation.

## References

- [R0 Product Reset Blueprint](product-reset-blueprint.md)
- [R0–R1 Reconciliation](R0_R1_RECONCILIATION.md)
- [R0 provenance commit `fcae4dff`](https://github.com/Islamce/R4C/commit/fcae4dff21466d281ef701fb41b22d64f337bb4e)
