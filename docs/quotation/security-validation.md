# R4C Quotation Security Validation

**Scope:** source-level and local focused validation for the buyer sales-quotation MVP. This document records implemented controls and local evidence only. It is not authenticated production UAT, a penetration test, migration evidence, or deployment approval.

## Server-enforced safeguards

| Control | Server enforcement | Local evidence | Remaining boundary |
|---|---|---|---|
| Staff access | Staff quotation routes use `@RequirePermissions` for create, read, review, and withdrawal lifecycle actions. | Focused source assertion passes. | Role/permission assignment needs authenticated UAT. |
| Tenant isolation | Lead, quotation, payment-plan, unit, customer, and price lookups are tenant-scoped; own-record scope is applied unless an authorized manager can see all. | Focused foreign-tenant quotation lookup regression passes. | Database-backed integration test remains pending. |
| Public token opacity | The token is generated as 48 random bytes, stored hash-only, and resolved only by hash. Public failure paths use the generic `Quotation link is unavailable` error. | Modified/malformed-token regression passes. | Rate-limit runtime verification requires a deployed non-production environment. |
| Token expiry/revocation/consumption | Resolution rejects expired, revoked, consumed, wrong-purpose, or unknown tokens. A new synthetic preview link revokes existing active links. | Expired-token and malformed-token regressions pass. | Database/UAT evidence pending. |
| Terminal-state rejection | A quotation outside the customer-visible states cannot receive a decision. Already accepted/declined and superseded status therefore reject the decision before a token claim. | Already-decided and superseded-quotation regressions pass. | Database/UAT evidence pending. |
| Concurrent decision safety | The public decision transaction atomically claims the token with `updateMany` constrained by token ID, unconsumed/unrevoked state, and expiry. A claim count other than one returns the generic error and creates no decision. | Optimistic token-claim-loss regression passes. | A real concurrent PostgreSQL race rehearsal is pending. |
| Clarification data quality | `CLARIFICATION_REQUESTED` without a comment is rejected by `recordCustomerDecision` before the token is consumed. | Service regression and buyer UX required-field audit pass. | Authenticated UAT pending. |
| No commercial side effect | Customer acceptance records decision evidence and terminal quotation status only; it does not create a unit hold, reservation, sale, invoice, or payment obligation. | Acceptance regression confirms zero hold/reservation calls and source assertion passes. | Process policy and downstream workflow remain separate. |
| Document truthfulness | The preview endpoint returns `SYNTHETIC_HTML_DOCUMENT_PREVIEW`, and staff/buyer UI labels it a controlled HTML document preview. | Browser audit covers staff and buyer preview dialogs. | No generated/stored/downloadable PDF exists; see `document-control-gap.md`. |

## Focused local test result

On the feature branch, `pnpm --filter @r4c/api test:quotations` completed successfully with **10 passing tests** and no failures. The suite includes acceptance recording, expiry rejection, terminal quotation rejection, superseded quotation rejection, optimistic token-claim loss, malformed-token generic failure, clarification-comment enforcement, no-hold/no-reservation source separation, tenant-scoped staff lookup, and controller permission/rate-limit assertions.

## Explicit limitations

The controls above have not been authenticated against a deployed tenant, a real database migration, a provider-hosted rate limiter, or a production environment. No customer identity verification, legal signature, real dispatch provider, payment, reservation, or document-file archival is implemented or inferred by this validation. Any production release remains gated on migration rehearsal, exact deployed SHA evidence, provider/runtime checks, synthetic UAT, pull-request qualification, and explicit Founder G9 authorization.
