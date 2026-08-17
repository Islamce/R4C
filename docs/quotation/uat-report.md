# Buyer Sales Quotation MVP — Non-Production UAT Report

**Prepared by:** Manus AI  
**Candidate SHA:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`

**Branch:** `feat/commercial-command-center-hardening`  
**Assessment date:** 2026-08-17 UTC  
**Assessment status:** **PASS FOR REVIEW ONLY — NOT A PRODUCTION DEPLOYMENT AUTHORIZATION**

## Purpose and Boundary

This report records the non-production acceptance evidence for the governed buyer sales-quotation MVP. It covers the API-backed staff-selection design, customer decision safeguards, controlled-document preview boundary, responsive English/Arabic presentation, and local release gates. It does **not** evidence an authenticated production tenant journey, external customer delivery, a generated PDF, a database migration in Neon, a production deployment, or a completed customer transaction.

> Local UAT uses isolated synthetic fixtures only where a staff session or buyer token is unavailable. Those fixtures are labelled as UAT-only and do not represent live commercial records.

## Evidence Summary

| UAT area | Method | Result | Evidence |
|---|---|---:|---|
| Staff creation context | Read-only browser workflow selected a synthetic lead, displayed its authoritative context, and selected an eligible payment plan without submitting a draft. | Pass | `scripts/audit-quotation-interactions.py`; `staff_lead_context_and_payment_plan_selectors: passed` |
| Buyer decision flow | Read-only interaction audit covered acceptance receipt, clarification guidance, expiry-disabled decision state, and Arabic RTL presentation. | Pass | `scripts/audit-quotation-interactions.py`; six buyer and staff assertions passed |
| Buyer decision safety | Focused API suite checked opaque-token one-time use, expiry, terminal state, supersession, optimistic claim loss, malformed tokens, and mandatory clarification comment. | Pass — 10/10 | `apps/api/test/quotation-service.test.mjs` |
| Authorization and tenant isolation | Focused source-contract tests verified permission-gated staff routes, rate-limited public routes, tenant-scoped lookup, and no reservation path from acceptance. | Pass | `apps/api/test/quotation-service.test.mjs` |
| Responsive English and Arabic | Automated audit covered staff and buyer views at 1440, 1024, 768, 430, and 360 pixels in both locales with no horizontal overflow. | Pass — 20/20 | `artifacts/quotation-qa/responsive-audit.json` |
| Visual inspection | Final desktop staff and narrow Arabic buyer screenshots were inspected after the tablet-density correction. | Pass | `docs/quotation/visual-qa-notes.md` |
| Controlled document preview | Staff and buyer use explicit **Controlled document preview (HTML)** terminology. No PDF claim is made. | Pass | `docs/quotation/document-control-gap.md` |

## UAT Decisions

The staff workspace now starts with an accessible, tenant/permission-scoped lead selection. The selected lead supplies customer, project, and unit context; the workspace then requests payment plans for that lead’s project. The normal session remains API-backed, while synthetic records are isolated to explicit UAT fallback presentation. A separate project browser or free-form unit selector was intentionally not added.

The buyer page demonstrates the intended governed outcome: an acceptance records a decision but does not create an inventory hold, reservation, RFQ, delivery, or Flutter workflow. A clarification request requires a non-empty comment on the server. Public errors are deliberately generic for invalid, expired, superseded, consumed, or malformed tokens.

| Explicitly accepted for this candidate | Explicitly deferred or prohibited |
|---|---|
| API-backed staff lead context and payment-plan selection | Production mutation, production migration, and deployment |
| Draft, review, approval, withdrawal, revision, token resolution, and buyer decision service contracts | Live email, SMS, push, or customer delivery execution |
| HTML controlled-document preview with UAT checksum marker | Representing HTML preview as a PDF or generated legal document |
| English/Arabic RTL responsive evidence | Buyer Flutter application, procurement RFQ, automatic unit hold, or automatic reservation |

## Remaining UAT Limitations

Authenticated UAT remains unavailable because provider-console access was not available for this review. The exact deployed web/API SHA, deployed migration history, Neon schema state, Upstash Redis boundary, Cloudflare R2 boundary, and authenticated role matrix therefore remain **unverified**. The public health checks are a runtime baseline only; they cannot establish that this candidate SHA is deployed.

The report therefore supports an internal review and a controlled non-production acceptance decision only. A Founder G9 decision must precede any production action.

## References

[1]: https://r4c.kynox.io/api/health
[2]: https://r4c-api.kynox.io/api/v1/health
[3]: https://r4c-api.kynox.io/api/v1/health/ready
