# Buyer Sales-Quotation MVP Execution Report

**Status:** implemented and qualified locally; **not deployed**; **not migrated against a database**; **no production communication or data mutation performed**.

## Delivered scope

The R4C buyer sales-quotation MVP is an isolated commercial extension. It creates tenant-scoped `SalesQuotation`, `QuotationApprovalToken`, `CustomerDecision`, and `QuotationDelivery` models; a committed source-only Prisma migration; protected staff lifecycle endpoints; narrow public opaque-token endpoints; immutable price/payment-plan/customer/unit/terms snapshots; snapshot checksums; internal review and separation-of-duties enforcement; hash-only single-use synthetic preview tokens; append-only customer-decision evidence; and audit events.

The internal workspace is available at `/quotations`. It supports a controlled draft form, quotation register, internal-review actions, snapshot-derived PDF-style preview, synthetic buyer test-link generation, withdrawal, and revised quotation creation. It never offers a real Send action because no verified dispatcher exists. The buyer page at `/buyer/quotation/<opaque-token>` is a responsive English/Arabic experience with a controlled PDF-style preview, accept/decline/clarification choices, a receipt, and an explicit statement that acceptance does not create a hold, reservation, sale, invoice, or payment obligation.

## Safety and lifecycle results

| Requirement | Implemented control | Result |
|---|---|---|
| Tenant isolation | All staff quotation, lead, price, plan, unit, and customer lookups require the active `tenantId`; public token hashes resolve to a quotation’s tenant. | Mock-backed tenant-scope regression passed. |
| Staff authorization | Draft, review, withdrawal, own/all read, and preview capabilities use distinct `commercial:quotation:*` permissions. | Controller guard regression passed. |
| Review separation | Creator cannot approve their own quotation. | Enforced in service. |
| Immutable evidence | Approved-to-send snapshots and checksums freeze price, payment plan, customer, unit, terms, and expiry. | Enforced before preview/token issuance. |
| Token safety | 48-byte opaque token; SHA-256 hash only; expiry/revocation/consumption checks; public generic failures; rate limiting. | Token/replay regression passed. |
| Customer decision | Decision evidence is append-only and acceptance/decline consumes the token. | Acceptance regression passed. |
| Reservation separation | Customer acceptance does not call hold, reservation, payment, invoice, sale, or lead-WON logic. | Regression passed. |
| Delivery evidence | No `SENT`, `DISPATCHED`, or `DELIVERED` claim is emitted by the MVP. Synthetic preview links are labelled as UAT-only. | Enforced in UI and service boundary. |

## Qualification summary

| Check | Result |
|---|---|
| `pnpm --filter @r4c/api test:quotations` | Passed: 5 tests covering token consumption, expiry, no hold/reservation effect, tenant scoping, and permission/rate-limit surface. |
| `pnpm --filter @r4c/web test:commercial-workflow` | Passed. |
| `pnpm build` | Passed for the full monorepo. |
| API and web TypeScript checks | Passed. |
| `prisma validate` with non-connecting placeholder URLs | Passed. The migration was not applied. |
| `git diff --check` | Passed. |
| Local synthetic browser QA | Passed for desktop internal quotation workspace, rendered controlled document view, desktop/mobile buyer page, accepted state, declined state, expired state, English and Arabic RTL, and Flutter design preview. |

The local browser evidence lives outside source control in `/home/ubuntu/r4c-quotation-qa/`. Findings are recorded in [`qa-screenshots/quotation-visual-findings.md`](qa-screenshots/quotation-visual-findings.md).

## Database validation limitation

The sandbox has no sanctioned `DATABASE_URL` for integration tests or migration rehearsal. The migration is therefore committed as source and schema-validated only. Before promotion, a controlled non-production database must run `prisma migrate deploy`, seed appropriately scoped sales identities and commercial reference data, execute lifecycle/authorization/tenant-isolation integration tests, and verify rollback/backup procedures. No migration command has been run in this task.

## Explicitly deferred

Live email/SMS/WhatsApp delivery, Firebase/FCM, APNs, VAPID, device registration, buyer Flutter app, supplier RFQ/bid workflows, payment collection, e-signature, reservation automation, sale conversion, lead-WON automation, production rollout, and all external communication remain outside this MVP.
