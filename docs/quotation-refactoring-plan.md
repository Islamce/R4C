# Quotation MVP Controlled Refactoring Plan

## Objective

Extend the existing commercial module with a buyer sales-quotation domain without rewriting the commercial workspace, auth, i18n, Prisma conventions, API proxy, BIM, cost-control, progress, or document-management modules.

## Before and after responsibilities

| Existing responsibility | Problem if extended inline | Planned focused extraction | Regression protection |
|---|---|---|---|
| `CommercialService` handles customer, lead, hold, reservation, and activity workflows. | Quotation lifecycle, snapshot, token, and decision logic would make this service unsafe to reason about. | New `QuotationService` and `quotation` Nest module. | Focused quotation service tests plus existing commercial regression test. |
| Commercial controllers use `@RequirePermissions` and tenant-scoped session context. | Public customer access cannot use staff JWT paths. | Narrow staff controller plus narrow public token controller; no generic public commercial access. | Negative permission and foreign-token tests. |
| Price revisions and payment plans are mutable source records. | Rendering from live records could change a buyer-visible quote. | `QuotationSnapshotBuilder` freezes authorized source data on internal approval. | Snapshot stability and checksum tests. |
| Password reset tokens establish hashed, expiry-based token patterns. | Reusing password-reset purpose or fields would conflate security domains. | Quotation-specific secure token service and purpose-bound model. | Hash, expiry, revocation, single-use, and generic-error tests. |
| Documents use files/version checksum concepts. | Customer-facing quote rendering needs a dedicated snapshot contract and may not require a generalized document rewrite. | `QuotationPdfRenderer` preview contract using the approved snapshot. | English/Arabic render and checksum-consistency tests. |
| Commercial UI composes a large suite. | Embedding every quotation view into one component would obstruct testing and RTL work. | Focused quotation list, builder, review, PDF preview, and buyer-page components plus quotation API client. | Browser desktop/mobile/RTL evidence and existing command-center regression. |
| Existing i18n has commercial and shared dictionaries. | Ad hoc English text would regress Arabic operating mode. | Centralized quotation status and action translations. | Arabic UI and RTL browser checks. |

## Explicit non-refactors

The MVP will not introduce a generic workflow engine, generic document platform, global API gateway change, alternate auth system, new database abstraction, procurement RFQ domain, BIM refactor, cost-control refactor, progress refactor, or repository-wide formatting churn.

## Sequencing

1. Add a dedicated quotation Prisma migration and minimal Nest module.
2. Extract lifecycle validation, snapshot creation, token handling, and preview rendering as narrow services.
3. Add staff/public DTOs and controllers with the existing permission and rate-limit patterns.
4. Add API client/types and focused web components.
5. Add synthetic preview fixtures, test harnesses, responsive page, and browser evidence.
6. Record implementation-level report with preserved contracts and remaining dispatcher/production dependencies.
