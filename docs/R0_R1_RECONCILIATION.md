# R0–R1 Product Blueprint Reconciliation

**Date:** 14 August 2026  
**Status:** Documentation reconciliation; no code, schema, or deployment changes.  
**Incumbent:** R0 — [`product-reset-blueprint.md`](product-reset-blueprint.md)  
**Challenger:** R1 — Claude draft appended to the operator instruction dated 14 August 2026.

## Provenance

R0 was introduced in commit `fcae4dff21466d281ef701fb41b22d64f337bb4e`, authored by **Islamce `<sam612345@gmail.com>`** on **12 August 2026 at 10:33:05 +03:00**. The introducing commit message is:

> `R0: reset R4C to commercial-first product direction (#47)`

The full `git log --follow` history contains that single record. R0 therefore predates the 14 August R1 draft and remains the governing baseline under the reconciliation rules.

## Classification method

| Classification | Meaning | Treatment |
| --- | --- | --- |
| **MATCH** | R0 and R1 make materially compatible decisions. | Preserve R0 wording or merge only editorial clarification. |
| **ADDITIVE** | R1 covers a point on which R0 is silent. | Add it to R2 with any required validation boundary. |
| **CONFLICT** | R0 and R1 make incompatible decisions about the same scope, entity, or sequence. | Retain R0 unless an evidenced staleness case is presented; expose the disposition visibly. |

## Structured comparison

| Design point | R0 position | R1 position | Classification | Reconciled disposition |
| --- | --- | --- | --- | --- |
| **Product identity** | A commercial-first digital real-estate developer platform; existing Development Intelligence is retained and frozen while Commercial is added. | A Saudi real-estate sales CRM, not a construction-management or BIM-control product. | **MATCH** | R2 uses R0’s commercial-first identity and clarifies sales CRM as the primary experience. The Saudi market framing is **ADDITIVE** positioning, not a replacement of R0’s product boundary. |
| **MVP definition** | A governed, audited reservation journey: discover through handover; MVP stops at reservation. | Eight-step governed reservation journey from lead capture through servicing. | **MATCH** | R2 retains R0’s reservation-journey acceptance path. R1’s numbered presentation is an editorial expansion; its compliance-specific steps are addressed separately below. |
| **Commercial hierarchy and implemented base** | Retains `Project`; defines DevelopmentPhase, Building, Floor, UnitType, Unit, and approved availability states. | Explicitly preserves the same implemented hierarchy and unit states. | **MATCH** | Retain R0 hierarchy, states, and no-rename policy. |
| **Lead, customer, and activity** | Defines Customer, Lead, and SalesActivity; Lead is a tenant-scoped commercial opportunity linked optionally to Customer, Project, and Unit; activity covers call/email/WhatsApp/meeting/site-visit/follow-up/note. | Lists Lead, Customer/Contact, and Communication/SalesActivity as not implemented. | **MATCH** | R2 preserves R0’s names and definitions; the current code gap remains a delivery fact, not a change to R0 design. |
| **Separate Opportunity entity** | Defines Lead as the commercial opportunity and does not define a separate Opportunity model. | Requires a distinct `Opportunity` linked to Lead/Customer and Unit of interest. | **CONFLICT** | **R0 retained.** A separate Opportunity entity would alter the incumbent entity structure without evidence that Lead-as-opportunity is inadequate. It is not added to R2. A future evidence-backed need may reopen this decision. |
| **Contracts** | Includes Contract in the product north star but does not define a Contract model in its Commercial build-now domain or proposed model. | Requires a Contract model with unit/customer link and e-signature status. | **ADDITIVE** | R2 adds a contract-domain placeholder and explicitly defers contract fields, legal templates, signature provider, and lifecycle semantics to approved requirements. |
| **Payment plans and installments** | Defines a reusable project-level PaymentPlan / PaymentPlanInstallment; unit-specific overrides are deferred until evidence requires them. | Defines PaymentPlan installments tied to a Contract with milestone dates, amounts, and per-installment status. | **CONFLICT** | **R0 retained.** R2 keeps the project-level reusable plan as the governing commercial term. A contract-specific accepted-plan snapshot or schedule is an open design question; R2 does not silently redefine the template relationship. |
| **Reservation fee / Wafi / escrow** | Reservation stores amount, currency, expiry, approval, lifecycle; no fee percentage, escrow mechanism, or Wafi integration is specified. | Assumes a ≤5% reservation cap, escrow deposit, and Wafi submission/transaction records. | **ADDITIVE** | R2 records a compliance-integration boundary only. The asserted regulatory rule, per-tenant credential model, project-license prerequisites, escrow workflow, and required data objects need legal/regulatory and product-owner validation before schema or workflow design. |
| **ZATCA / Fatoora invoicing** | Does not address tax invoicing or Fatoora. | Adds TaxInvoice/ZatcaSubmission and details invoice identifiers, signing, XML, and submission. | **ADDITIVE** | R2 adds a deferred compliance-integration boundary. Applicability, onboarding, credential ownership, integration method, and required tax fields remain validation gates, not implemented requirements. |
| **Nafath / e-signature** | Does not name Nafath or an e-signature provider. | Names Nafath for contract e-signature. | **ADDITIVE** | R2 records electronic-identity/signature integration as a provider-selection and legal-validation gate; it does not select or implement a provider. |
| **Commission** | Explicitly excludes commission **settlement** from the Commercial MVP non-goals. | Places commission tracking after core payment/invoicing work. | **MATCH** | R2 permits future non-settlement commission visibility only if requirements are evidenced; commission calculation, settlement, and payout remain outside the MVP. |
| **Development Intelligence / BIM disposition** | Freeze WBS, BIM/IFC, schedule, progress, cost, materials, quality, HSE, commissioning, and handover; move construction routes behind a non-default navigation group; prohibit deletion of WBS/BIM/development data during R0/R1. | Leave the legacy stack frozen; revisit only on real demand or measured storage cost. | **MATCH** | R2 retains R0’s freeze and no-deletion posture. No archive/removal action follows from this reconciliation. |
| **Build sequence** | C01 Commercial Structure; C02 Pricing & Media; C03 Customer & Leads; C04 Holds & Reservations. | Lead/Opportunity/Customer/Contract first; then payment/escrow; then invoicing; then commission/communications. | **CONFLICT** | **R0 retained.** C01 is already implemented; R2 retains R0’s next sequencing because no evidence establishes that bypassing pricing/media before customer/leads reduces delivery risk. Compliance integrations become gated future increments, not a reordered commitment. |
| **Hosting / runtime implications** | Reuses existing platform runtime; requires tests and no destructive migration but makes no CRM-specific hosting escalation. | Does not supply a different runtime architecture. | **MATCH** | R2 retains the existing runtime baseline. No new service, viewer, or specialized processing infrastructure is justified by this documentation reconciliation. |

## R0 answers to the reconciliation checklist

| Checklist question | Answer from R0 | Effect on R2 |
| --- | --- | --- |
| Payment-plan structure | Yes. Project-level reusable terms and installments; defer unit-specific overrides pending evidence. | R0 wins over R1’s contract-tied model. |
| Commission model | No implementation model. Only commission settlement is explicitly out of MVP scope. | Tracking may be revisited; settlement remains excluded. |
| Reservation-fee percentage | No percentage or regulatory mechanism is specified. | R1 is additive but validation-gated. |
| Development Intelligence long-term disposition | Yes. Frozen, non-default navigation, no deletion of development data during R0/R1. | R0’s freeze/no-deletion policy remains governing. |

## Outcome

The comparison contains **7 MATCH** rows, **4 ADDITIVE** rows, and **3 CONFLICT** rows. Each conflict is resolved in R0’s favor by the incumbent-governance rule; no evidence was presented that R0 is stale. Therefore R2 can be published as a reconciled successor **without replacing R0**. R0 remains the preserved baseline and R2 will cite it directly.

## Explicit non-actions

This document does not authorize product-code work, schema changes, compliance claims, provider selection, archive/removal work, history rewrites, or deployment changes.
