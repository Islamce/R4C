# R4C Quotation Capability Evidence Matrix

**Candidate SHA:** `888004fe17ca92acbaec73537db78fe2dc3cef7a`

**Classification rule:** a capability is not called production-ready unless its runtime/provider evidence is recorded for this exact SHA. Source inspection and local focused tests are evidence of implementation only.

| Capability | Classification | Evidence | Boundary / gap |
|---|---|---|---|
| Staff quotation list/detail | Implemented and API-backed | `GET /quotations`, `GET /quotations/:id`; `commercial:quotation:read-own` guard. | Database-backed execution still requires UAT. |
| Staff draft creation | Implemented and API-backed | `POST /quotations`; server resolves tenant-scoped lead, current published price, payment plan, available unit, future expiry, and audit record. The normal workspace now passes only selected lead and payment-plan IDs from authorized sources. | Authenticated database-backed UAT is pending. |
| Draft editing | Implemented and API-backed | `PATCH /quotations/:id`; draft-only and creator/all-scope checks. | UAT pending. |
| Internal review and return | Implemented and API-backed | `POST /quotations/:id/submit`, `/return`; permission-gated lifecycle. | UAT pending. |
| Approval to send | Implemented and API-backed | `POST /quotations/:id/approve-to-send`; separate reviewer and creator denial. | No live delivery action follows approval. |
| Immutable price/payment/customer/unit/terms snapshot | Implemented and API-backed | `buildSnapshot()` at approval; stored checksums and audit record. | Database rehearsal pending. |
| Controlled document | Implemented with synthetic HTML preview only | `GET /quotations/:id/preview-document` returns `SYNTHETIC_PDF_PREVIEW` and a snapshot payload. | No generated, stored, or downloadable PDF artifact; must not be labelled a PDF. |
| Synthetic buyer test link | Implemented and API-backed | `POST /quotations/:id/synthetic-preview-link`; 48-byte token, hash-only storage, TTL cap, rotation/revocation. | UAT-only; no email/SMS/WhatsApp dispatch. |
| Public buyer quotation resolution | Implemented and API-backed | `POST /buyer/quotation/resolve`; rate limited, generic failure, token/expiry/revocation/consumption checks. | Public page uses token in route for the current design preview; future production delivery/identity policy remains gated. |
| Buyer accept / decline | Implemented and API-backed for synthetic preview tokens | `POST /buyer/quotation/decision`; decision evidence, one-token claim, terminal status, audit event. | Acceptance has no hold, reservation, payment, sale, or legal-signature side effect. |
| Buyer clarification | Implemented and API-backed for synthetic preview tokens | Same decision endpoint supports `CLARIFICATION_REQUESTED`; server requires a comment. | UAT pending. |
| Token replay safety | Implemented and locally focused-test-backed | Atomic `updateMany` token claim and consumption/revocation checks. | Concurrent database race test still needs disposable PostgreSQL. |
| Cross-tenant isolation | Implemented and locally focused-test-backed | Tenant-scoped quotation, lead, price, plan, unit, and customer lookups; focused mock regression. | Database-backed integration test pending. |
| Staff lead selector | Implemented and API-backed | The normal workspace calls `GET /commercial/leads` and falls back to `/commercial/leads/all` only when the caller has that manager capability. It filters the returned tenant/capability-scoped records for complete customer/project/unit context, with local search of loaded records. | Lists are bounded by the existing endpoint pagination; authenticated UAT remains pending. |
| Project/unit selector | Existing API capability; UI gap | Lead response includes project/unit. `GET /commercial/units` is available for permitted users. | Quotation creation is lead-context-driven; unit reassignment requires an existing lead workflow, not a quotation UI shortcut. |
| Eligible payment-plan selector | Implemented and API-backed | After a lead is selected, the workspace calls `GET /commercial/projects/:projectId/payment-plans` using the lead's authoritative project context. | Empty and permission-denied states are explicit; server revalidates plan scope at draft creation. |
| Real Send / delivered / viewed provider evidence | Missing | No dispatcher implementation or verified provider configuration. | Hard gate: retain synthetic-only labeling. |
| Buyer Flutter application | Missing by approved scope | A design preview exists at `/design-preview?surface=flutter`. | Implementation is explicitly deferred. |
| Procurement RFQ / supplier bid | Missing by approved scope | No change is required by this quotation increment. | Must remain distinct from buyer sales quotation. |
| English/Arabic/RTL visual preview | Implemented with synthetic local evidence | Local Playwright and screenshot evidence exist. | Exact-SHA committed evidence is being refreshed; no authenticated UAT evidence. |
| Production Web/API exact SHA | Blocked | Public health is stable but does not disclose release identity. | Requires authenticated read-only provider deployment inspection. |
| Migration state and schema | Blocked | Source migration exists and `prisma validate` passed locally. | Requires private configured disposable/UAT database for status/deploy/rehearsal; no `db push`. |
| Hostinger managed Node.js compatibility | Partially verified | Standalone/static-asset procedure is documented; local production build passes. | Exact provider configuration, deployed static asset, and restart behavior remain blocked. |

## Selector enhancement decision

The raw-ID form has been removed from the normal staff experience. The verified path is lead-context-first: select a tenant/capability-scoped eligible lead, display its authoritative customer/project/unit context, then load eligible payment plans for that project. The server remains authoritative on every draft-creation request. A quotation screen must **not** invent a client-side project/unit assignment because quotation creation requires an existing lead that already relates to an available unit.

The synthetic UAT fallback uses explicitly labelled fixtures in `quotation-preview-adapter.ts`; it is isolated from authenticated commercial queries and exists solely to exercise the visual workflow. The read-only local interaction audit records successful lead selection, payment-plan selection, and context rendering without submitting a draft.
