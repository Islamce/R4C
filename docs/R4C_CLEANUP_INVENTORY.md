# R4C Cleanup Inventory

Status: baseline forensic inventory  
Hardening branch: `codex/r4c-core-rc-hardening`  
Canonical starting point: PR #76 at `35b28ff96e684e8c9f4a930fd9f18bfbd780cf04`  
Default branch baseline: `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af`

This inventory is the evidence boundary for the release-hardening pass. A classification is not permission to delete: runtime consumers, tests and capability contracts must be traced before a removal.

## Classification legend

- **KEEP** — accepted capability or necessary platform path.
- **REFACTOR** — valid capability with a correctness or maintainability defect.
- **CONSOLIDATE** — multiple paths should become one authoritative path.
- **REMOVE** — proven obsolete or misleading residue; removal still requires verification.
- **DEFER-WITH-REASON** — valid but outside the Core RC or awaiting a stated gate.
- **EXTERNAL-GATE** — cannot be qualified from source alone.

## Repository and generated architecture

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| KAAF generated context | Six declared modules are verified; current drift has one warning for root `hostinger-web-entry.cjs` | REFACTOR | Put the Hostinger entry point under an owned module or declare its real architectural owner, then regenerate; never hand-edit `.ai/`. |
| Vendored KAAF tooling | `scripts/architecture/` is vendored; PR #74 modifies `scanners/resolve.py` | KEEP / EXTERNAL-GATE | Do not import the PR #74 tooling edit into R4C. Any defect belongs upstream in KAAF. |
| Root build/runtime scripts | Root package scripts mix general monorepo tasks with Hostinger-specific migration/build behavior | REFACTOR | Separate source build from deploy-time migration execution and document ownership. |
| Untracked Codex/audit and presentation artifacts | Local untracked files predate hardening | KEEP (user-owned) | Do not stage, modify or delete. |

## API and domain

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| Project/WBS/document/progress/cost/material/quality/HSE/turnover domains | Declared API module and existing CI coverage | KEEP | Preserve public contracts and tenant boundaries. |
| Commercial inventory, prices, plans, holds, reservations and leads | One large `commercial.service.ts` owns multiple workflows | REFACTOR | Trace state ownership; remove contradictory transitions and add lifecycle/integration tests. |
| Lead WON/LOST to Unit resolution | Present only in PR #75 | CONSOLIDATE | Deliberately adopt the transactional, optimistic-concurrency behavior and harden tests. |
| Consent withdrawal | Present only in PR #75 | CONSOLIDATE | Adopt purpose-specific withdrawal with authorization, tenant and audit negative tests. |
| User/RBAC administration | PR #76 adds administrator-only API and UI | KEEP / REFACTOR | Preserve protected admin and role matrix; extend negative tests for escalation and tenant escape. |
| Quotation lifecycle and buyer tokens | PR #74 only; schema migration `20260817100000_buyer_sales_quotation_mvp` | DEFER-WITH-REASON | Maintain on a Quotation Extension based on Core RC until sanctioned non-production PostgreSQL rehearsal. |
| Commercial aggregation | PR #74 adds aggregation service/config | DEFER-WITH-REASON | Assess independently of quotation; adopt only if it replaces, rather than duplicates, an accepted aggregate path. |
| Redis expiry processor | API startup now degrades when Redis is unavailable | REFACTOR / EXTERNAL-GATE | Preserve API availability, but make degraded scheduling explicit and observable; managed Redis remains external. |
| BIM queues/object storage | Accepted architecture; external services not operationally verified | KEEP / EXTERNAL-GATE | Preserve guarded disabled behavior; do not claim runtime qualification without worker/storage evidence. |

## Web application

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| Authenticated projects, progress, cost and BIM views | Existing accepted surfaces and phase tests | KEEP | Preserve routes and server-owned authorization. |
| Kynox commercial workspace and user directory | PR #76, fully green exact-head gates | KEEP / REFACTOR | Preserve UX; fix the API-backed available-unit selector defect and maintain Arabic/RTL. |
| `design-preview` route and static Sales Pipeline data | Preview path renders synthetic/demo records while Sales Operations is API-backed | CONSOLIDATE | Make preview unmistakably non-authoritative or remove it after accepted UI is represented by the governed path. |
| `SalesPipelineWorkspace` and `CommercialOperatorWorkspace` | Parallel static and API-backed commercial experiences | CONSOLIDATE | Establish one persisted operational workflow; retain preview only as a bounded design artifact if still required. |
| Bulk contact/campaign import | Sequential API calls, no import transaction/idempotency/progress contract | REFACTOR | Add bounded input limits, row-level results and explicit consent provenance before operational qualification. |
| Quotation staff/buyer UI | PR #74 only | DEFER-WITH-REASON | Isolate with quotation API/schema in the extension branch. |
| Flutter companion preview | PR #74 experimental design preview | REMOVE candidate | Do not carry into Core RC; prove no accepted web capability depends on it before excluding from Quotation Extension. |
| CSS systems | General, commercial, Kynox, sales-pipeline and access-admin styles overlap | REFACTOR / CONSOLIDATE | Map selectors and consumers; remove only verified unused rules and keep bilingual accessibility. |

## Database, migrations and seeds

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| Existing applied migrations | Production history exists | KEEP | Never rewrite historical migrations; use additive corrections. |
| Quotation migration | PR #74 migration not rehearsed on sanctioned non-production PostgreSQL | EXTERNAL-GATE | Static audit and exact rehearsal runbook now; execution remains blocked on sanctioned database. |
| Production bootstrap seed | PR #76 remote-safe transaction timeout and protected admin | KEEP / REFACTOR | Verify idempotency, fail-closed production inputs and no credential overwrite. |
| UAT seed/runtime synthetic data | `seed-uat.ts`, design preview and fixed UAT fixtures | REFACTOR | Ensure explicit non-production activation and no automatic real-runtime leakage. |

## Authentication, tenancy and security

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| JWT/refresh session and proxy | Existing auth/session workflow is green at PR #76 | KEEP / REFACTOR | Add negative proxy-path, stale-session and cross-tenant object-ID tests. |
| Permission definitions | KAAF lists 23 commercial permissions; seed also includes wider role matrix | CONSOLIDATE | Identify one authoritative permission catalogue and prove seed/KAAF/controller agreement. |
| Public buyer tokens | PR #74 only | DEFER-WITH-REASON | Audit generic errors, replay, expiry, revocation, response minimization and rate limits in extension. |
| Dependency advisory state | PR #76 supply-chain gate green; PR #74/#75 historical supply-chain failures | REFACTOR | Re-run production audit/SBOM on the reconciled exact head; do not suppress advisories. |

## Configuration, deployment and documentation

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| `.env.production.example` | Says VPS, Caddy, Docker service DNS, MinIO and local container topology are production truth | REMOVE / REIMPLEMENT-CLEANLY | Replace with a shared-hosting contract; keep a separately named Docker self-hosting example only if still supported and truthful. |
| `docs/deploy-hostinger-vps.md` | Detailed Ubuntu/systemd/VPS procedure | REMOVE from authoritative path | Mark historical/unsupported or remove after replacement documentation exists. VPS must not be a required target. |
| Compose/Caddy package | Useful for local/CI/self-host rehearsal, not current production | KEEP / REFACTOR | Label scope accurately; remove claims that it is the current deployment contract. |
| Hostinger Web Apps entry points | Real current shared-hosting path, with root KAAF drift | REFACTOR | Document build/start/migration separation and move under an owned deployable module. |
| `.local` tenant defaults | Server session and tenant resolution contain local-development fallbacks | KEEP locally / REMOVE in production defaults | Require explicit production environment values; retain safe localhost behavior only for local development. |
| Deployment/UAT documents | Mix implemented, CI-rehearsed, deployed and verified claims | REFACTOR | Apply explicit evidence-state vocabulary and current SHAs. |

## Tests and workflows

| Area | Evidence | Classification | Required action |
| --- | --- | --- | --- |
| CI, Security, KAAF, Auth, Seed, Phase 5/6/6.5/7 | All green at exact PR #76 head | KEEP | Final Core RC must meet or exceed this baseline. |
| API contract/unit tests | `node --test` suites plus runtime E2E suites | REFACTOR | Audit assertions, mocks and skipped paths; add #75 and unit-selector regression coverage. |
| Web `test` script | Default test only prints guidance and executes no assertions | REFACTOR | Make aggregate qualification explicit without hiding that runtime journeys need services. |
| Native CSV upload UAT | Automation cannot populate chooser (`Not allowed`) | EXTERNAL-GATE | Use manual or approved browser harness; do not call this an application failure. |
| Production UAT fixtures | Clearly named `UAT-*` records exist | DEFER-WITH-REASON | Retain artifact register; cleanup is a controlled production-data action outside this branch. |

## Immediate known defects and gates

1. API returns an `AVAILABLE` unit while the authoritative UI selector renders none.
2. Reservation UAT is blocked until the selector is fixed and a price/payment plan is published in an approved environment.
3. Current production example and deployment documentation contradict the actual shared-hosting strategy.
4. KAAF reports the Hostinger entry point as an undeclared root module.
5. PR #75 capabilities are absent from PR #76 and must be adopted deliberately.
6. PR #74 quotation is valid independent work but its migration remains behind a sanctioned non-production PostgreSQL gate.
7. Campaign import consent provenance requires business/legal validation; code must not imply legal approval.

