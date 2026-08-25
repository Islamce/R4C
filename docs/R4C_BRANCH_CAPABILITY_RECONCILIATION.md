# R4C Branch Capability Reconciliation

Verified on 2026-08-25 from GitHub refs:

- `main`: `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af`
- PR #74: `1076118ddf5085b9a29ff00fa14ec76a15e2255c`
- PR #75: `36e0040b4c11bd25e6349459c1d95465f18348f8`
- PR #76: `35b28ff96e684e8c9f4a930fd9f18bfbd780cf04`
- Core hardening branch base: PR #76 exact head

`SUPERSEDED` is intentionally unused at baseline because no independent branch capability has yet been proven incorporated elsewhere.

| Capability | main | #74 | #75 | #76 | Final requirement | Final action |
| --- | --- | --- | --- | --- | --- | --- |
| Commercial workspace | Baseline | Major redesign/aggregation | Baseline | Kynox workspace + operational surfaces | Preserve accepted #76 experience; adopt only non-duplicative corrections | PRESERVE |
| Sales pipeline | Baseline | Attention-first alternative | Baseline | Bilingual pipeline + bulk import | One clearly authoritative persisted pipeline | CONSOLIDATE |
| API-backed sales operations | Baseline | Extended aggregates | Lifecycle changes | Present | Correct available-unit integration and retain governed actions | REIMPLEMENT-CLEANLY |
| Quotation lifecycle | Absent | Present | Absent | Absent | Clean extension, separate from Core RC | DEFER |
| Immutable quotation snapshot | Absent | Present | Absent | Absent | Preserve after static/migration audit | DEFER |
| Buyer tokens/decisions | Absent | Present | Absent | Absent | Preserve isolation; keep acceptance outside sale/reservation | DEFER |
| Lead RESERVED to WON/LOST Unit resolution | Absent | Absent | Present | Absent | Transactional, concurrent, tenant-safe lifecycle | ADOPT |
| Consent capture | Baseline | Quotation/buyer context | Withdrawal correction | Bulk import adds enquiry metadata | One purpose/provenance model | CONSOLIDATE |
| Consent withdrawal | Absent | Absent | Present | Absent | Authorized, purpose-specific, audited, deterministic | ADOPT |
| Roles/permissions | Baseline | Related commercial permissions | Uses existing permissions | ADMIN/SALES_MANAGER/SALES_AGENT/VIEWER matrix | One server-owned catalogue with KAAF/seed agreement | PRESERVE |
| User directory | Absent | Absent | Absent | Admin-only directory | Preserve protected admin and least privilege | PRESERVE |
| Tenant isolation | Baseline | Quotation scope added | Cross-tenant lifecycle checks | Preserved baseline | Fail closed across every adopted capability | CONSOLIDATE |
| Auth/session | Baseline | Buyer public boundary added | Existing auth | Green exact-head session workflow | Preserve Core; audit extension tokens separately | PRESERVE |
| Audit trail | Baseline | Quotation audit events | Lifecycle/withdrawal audit | User/commercial audit | One auditable transition path per domain action | CONSOLIDATE |
| Seed behavior | Baseline | Adds quotation permissions | No seed change | Remote-safe protected admin and role matrix | Idempotent; never overwrite established credentials | PRESERVE |
| Commercial expiration jobs | Baseline | Baseline | Baseline | Redis-degraded startup behavior | Explicit observable degraded mode | REIMPLEMENT-CLEANLY |
| WBS/commercial data | Baseline | WBS import + aggregates | Baseline | Commercial UX | WBS import assessed independently; no quotation coupling | DEFER |
| Admin surfaces | Baseline | Baseline | Baseline | Users/access + commercial admin | Preserve and harden negative authorization | PRESERVE |
| Environment config | Docker/VPS-oriented | Inherits baseline | Inherits baseline | Partially Hostinger-adjusted but still stale | Shared-hosting authoritative contract | REIMPLEMENT-CLEANLY |
| Deployment workflows | Compose rehearsal | Inherits | Inherits | Green Phase 7 plus Hostinger build scripts | Preserve CI rehearsal; separate current hosted contract | CONSOLIDATE |
| Database migrations | Existing history | Adds quotation migration | None | Existing history | Additive only; quotation rehearsal gated | PRESERVE / DEFER |
| KAAF generated context | Baseline | Regenerated plus forbidden vendored edit | Stale at head | Green, one current root warning locally | Regenerate only from truthful manifests/source | REIMPLEMENT-CLEANLY |
| BIM worker | Baseline | Base image update | Baseline | Base image update | Preserve accepted module, no fake operational claim | PRESERVE |
| Flutter companion preview | Absent | Experimental preview | Absent | Absent | Not part of stabilization scope | REMOVE |

## Branch disposition at start

- **PR #76:** engineering reference and Core RC starting point; preserve its accepted capabilities without merging to `main`.
- **PR #75:** source donor for Lead/Unit terminal consistency and consent withdrawal; reapply cleanly with expanded tests.
- **PR #74:** preserve as an independent quotation source donor; rebuild a clean Quotation Extension on the final Core RC and keep its database rehearsal gate explicit.
- **PR #74 KAAF tooling edit:** excluded because `scripts/architecture/` is vendored and must be fixed upstream.
- **PR #74 screenshots, audit scripts and Flutter preview:** evidence/experimental artifacts, not automatically accepted runtime capability.

