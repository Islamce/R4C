# R4C Non-Production Hostinger Web App Qualification

**Status:** Evidence-gated, not deployed.
**Baseline:** `c1740ec415bc3276ec00586ef881c1e83086cfda` — `feat: implement commercial i18n and holds reservations`.
**Scope:** A non-production technical pilot only. This document neither authorizes production traffic nor replaces `docs/deploy-hostinger-vps.md`, which remains the documented full-stack VPS topology.

> **Hard boundary:** Do not create a Hostinger Web App, external database, Redis database, bucket, GitHub connection, domain mapping, deployment, purchase, or billing action from this runbook unless the Founder gives a separate explicit approval for the exact action.

## 1. Qualification conclusion

R4C is a pnpm monorepo with two deployable Node applications: `apps/api` (NestJS) and `apps/web` (Next.js standalone). Hostinger Cloud Startup officially supports ten Node.js websites and publishes 4 CPU cores, 4 GB RAM, 100 GB disk, and 20,480 KB/s I/O at the plan level.[1] The currently inspected account is a Cloud Startup plan with three existing Node.js applications; no R4C resource has been created.

A two-Web-App commercial pilot is technically **plausible**, but is **not ready to create or deploy**. The candidate requires external PostgreSQL, Redis over TCP/TLS, and S3-compatible object storage. It also currently loads the BIM module unconditionally, which requires `BIM_WORKER_URL` and `BIM_WORKER_TOKEN` at API startup. Commercial source does not directly import BIM, but a harmless placeholder endpoint would not be defensible evidence that the required BIM dependency has been safely deferred. The pilot remains blocked until the BIM decision is resolved as an actual tested component or an explicitly authorized architecture change.

| Component | Candidate behavior verified in source | Non-production Hostinger composition | Status |
|---|---|---|---|
| API | NestJS; `node apps/api/dist/main.js`; binds `API_PORT` (default 4000); global `/api/v1` prefix | One dedicated Hostinger Node.js Web App | **Conditional** |
| Web | Next.js 15 standalone; compiled entry is `apps/web/.next/standalone/apps/web/server.js`; binds `PORT` | A separate dedicated Hostinger Node.js Web App | **Conditional** |
| PostgreSQL | Prisma PostgreSQL provider; five committed additive migrations; source reads `DATABASE_URL` only | Separate isolated Supabase PostgreSQL project or equivalent | **Not created / untested** |
| Redis | BullMQ queues and workers; `IORedis(REDIS_URL, { maxRetriesPerRequest: null })`; C04 scheduler persists in Redis | Separate TCP/TLS Redis such as an approved Upstash database with eviction disabled | **Not created / untested** |
| Object storage | S3 SDK, forced path-style addressing, presigned `PutObject`, `GetObject`, and `HeadObject` | Separate private Supabase Storage bucket or compatible service | **Not created / untested** |
| BIM worker | `BimModule` is imported by the normal API module; its processor requires `BIM_WORKER_URL` and `BIM_WORKER_TOKEN` | Separate real BIM worker only if the Founder approves the component for the pilot | **Blocking decision** |
| Caddy / wildcard tenant routing | Docker Compose uses Caddy for Cloudflare DNS certificate issuance, `*.TENANT_BASE_DOMAIN`, compression, and headers | Hostinger-managed TLS/routing must be explicitly tested; no equivalence is assumed | **Unknown** |

## 2. Candidate source evidence

The API starts on `0.0.0.0` with `API_PORT` and enables credentialed CORS only for the comma-separated `CORS_ORIGINS` list. The web application resolves its API endpoint by preferring `API_URL`, then `NEXT_PUBLIC_API_URL`. Its production tenant resolver additionally reads `TENANT_BASE_DOMAIN`; the first Web App pilot should use a single approved non-production hostname until wildcard behavior is proven.

C04 creates the `r4c-commercial-hold-expiry` Redis queue and Worker inside the API process. It rejects a missing or invalid `HOLD_EXPIRY_SWEEP_INTERVAL_MS`; this configuration has **no code default** and must be a safe integer of at least 1000 milliseconds. The approved starting deployment value is `300000` (five minutes), but it must be supplied explicitly.

The hold expiry transition is tenant-scoped and uses serializable transactions. It first compare-and-sets an active Hold, then compare-and-sets the Unit from `HELD` to `AVAILABLE`; it writes an audit event for a system expiry and returns `null` for an already processed or ineligible Hold. The verified C04 integration suite covers expired-Hold release and the confirmed-reservation race path.

The candidate’s migration ledger is ordered as follows. The C04 migration is additive, but there is no automated down migration; a rejected non-production deployment must restore an isolated test database or discard the test project rather than infer a rollback.

| Order | Migration |
|---:|---|
| 1 | `0_init` |
| 2 | `20260812090000_commercial_domain_foundation` |
| 3 | `20260814000000_c02_pricing_media` |
| 4 | `20260814120000_c03_customer_leads` |
| 5 | `20260814150000_i18n_c04_holds_reservations` |

## 3. External-service qualification criteria

### PostgreSQL

Supabase documents its shared session pooler on port 5432 for persistent IPv4-only backend clients, and its Prisma guidance uses that connection string for server-based deployments and migrations.[2] [3] R4C does not declare a separate `DIRECT_URL`; therefore, **do not add one or silently change the Prisma datasource**. The approved test must use a real isolated project and record which provider endpoint was used.

| Required verification | Evidence to capture | Pass condition |
|---|---|---|
| Network reachability | API deployment log; provider region and endpoint class, without secrets | API can establish TLS PostgreSQL connection from Hostinger |
| Migration | `prisma migrate deploy` output and migration ledger | All five committed migrations apply to an empty isolated database |
| Runtime data path | Health/readiness response and a commercial HTTP smoke test | API starts and persists test tenant-scoped data |
| Recovery | Provider backup/export settings and a documented test disposal/recovery plan | Database recovery path is recorded; no production data is involved |
| Cost and quota | Provider plan, limits, region, billing owner, spend/usage cap | Founder accepts a bounded non-production cost exposure |

Supabase Storage supports AWS Signature V4 presigned URLs and the exact object operations used by R4C, but it does not support S3 versioning.[4] The R4C client forces path-style addressing. The provider must therefore be tested with a real private bucket for upload URL, upload, head, download URL, and download; no compatibility claim is valid before that test.

### Redis

BullMQ requires Redis connections and needs a duplicated blocking connection for a Worker. Its documentation requires `maxRetriesPerRequest: null` for a manually supplied ioredis Worker connection and warns that queue durability requires a no-eviction policy.[5] The candidate implements the required retry setting. IORedis supports a `rediss://` URL, and Upstash documents BullMQ over Redis TCP/TLS.[6] [7]

Upstash documents that eviction is disabled by default and writes are rejected at storage capacity; enabling eviction may remove nonvolatile data.[8] Therefore, **eviction must remain disabled** for this R4C queue database. The actual provider configuration, region, client/connection limit, retention, and billing plan remain unverified until an external database is approved and created.

| Required verification | Evidence to capture | Pass condition |
|---|---|---|
| TLS and authentication | Sanitized connection configuration and Node test output | `rediss://` connection succeeds from both Hostinger Web Apps as applicable |
| BullMQ queues | Queue names, scheduler registration, worker logs, provider metrics | `r4c-commercial-hold-expiry` scheduler registers without duplicate schedules |
| C04 sweep | Seeded expired Hold, API/worker log, database assertion | Unit changes `HELD → AVAILABLE`; Lead is unchanged |
| Race guard | Confirmed Reservation before a sweep run, database assertion | Sweep does not release the reserved Unit or alter its converted Hold |
| Durability policy | Provider configuration screenshot/export, without credentials | Eviction disabled; policy does not remove BullMQ keys |
| Cost and quota | Provider plan, region, usage limit, billing owner | Founder accepts the bounded pilot exposure |

### BIM decision

The architecture document requires Commercial and Customer Experience to operate independently of Development Intelligence. The candidate commercial source has no BIM imports. However, the standard API imports `BimModule`, and `BimProcessor` requires `BIM_WORKER_URL` and `BIM_WORKER_TOKEN` at construction. This creates an implementation-to-architecture discrepancy for a commercial-only Hostinger pilot.

> **Do not satisfy the BIM requirement with a fake endpoint, mock, blank value, or unrelated existing service.** The pilot may proceed only after one of the following evidence-gated choices is authorized: (a) deploy and test a real separate BIM worker; or (b) authorize a source-level, KAAF-governed feature boundary that makes Development Intelligence explicitly optional and test the resulting behavior. Neither choice is authorized by this document.

## 4. Proposed Web App configuration — not yet executed

These are candidate values derived from the current source and Dockerfiles. They are **not a record of a completed Hostinger deployment**. Before entering any value in hPanel, confirm the UI’s working-directory behavior and whether build-time environment variables are available to the Next.js build.

| Field | API Web App candidate | Web Web App candidate |
|---|---|---|
| Source | Private `Islamce/R4C` repository, commit-pinned source/branch selected only after Founder approval | Same repository, separate Web App |
| Node version | 22.x | 22.x |
| Repository root | Repository root; monorepo behavior must be confirmed | Repository root; monorepo behavior must be confirmed |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @r4c/api prisma:generate && pnpm --filter @r4c/api build` | `pnpm install --frozen-lockfile && pnpm --filter @r4c/web build` |
| Start command | `node apps/api/dist/main.js` | `node apps/web/.next/standalone/apps/web/server.js` |
| Port variable | `API_PORT` set to the platform-assigned inbound port only after hPanel confirms the contract | `PORT` set only if hPanel requires it; source defaults to 3000 |
| Health endpoint | `/api/v1/health/ready` | `/api/health` |
| Public host | Separate temporary non-production API hostname | Separate temporary non-production web hostname |
| Auto-deployment | Disabled for first test unless the Founder separately approves branch-triggered deployments | Disabled for first test unless separately approved |

Hostinger documents Node.js build settings, start commands, environment variables, deployment logs, GitHub branch redeployment, and resource monitoring.[9] [10] It does not remove the need to test R4C’s exact monorepo layout and external TCP/TLS dependencies.

## 5. Required environment variables

The templates under `deploy/hostinger/` list names only. Do not place secrets in Git, screenshots, logs, messages, or pull requests. Use a password manager or the authorized provider/Hostinger secret-management UI.

| Variable | API | Web | Source basis |
|---|:---:|:---:|---|
| `NODE_ENV` | Yes | Yes | Runtime mode |
| `API_PORT` | Yes | No | API entry point |
| `CORS_ORIGINS` | Yes | No | API entry point |
| `DATABASE_URL` | Yes | No | Prisma datasource |
| `REDIS_URL` | Yes | No | C04 and BIM BullMQ clients |
| `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Yes | No | Object storage client |
| `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, `S3_REGION` | Yes | No | Object storage client; defaults exist only for region/presign endpoint |
| `JWT_ACCESS_SECRET` | Yes | No | Auth module |
| `HOLD_EXPIRY_SWEEP_INTERVAL_MS` | Yes | No | Required C04 configuration; **no default** |
| `BIM_WORKER_URL`, `BIM_WORKER_TOKEN` | Yes | No | Required by the currently unconditional BIM module |
| `API_URL`, `NEXT_PUBLIC_API_URL` | No | Yes | Web server/client API base URL |
| `TENANT_BASE_DOMAIN` | No | Yes | Production tenant resolver |
| `PORT` | No | Yes | Next.js runtime port |

## 6. Execution gates and required evidence

The sequence below is deliberately constrained. Stop at the first unsatisfied gate. No production domain, live tenant data, billing change, payment, escrow, invoice, Wafi, ZATCA, Nafath, contract, e-signature, finance, or WMS change is included.

| Gate | Authorized scope after separate approval | Required evidence | Stop condition |
|---|---|---|---|
| G0 — Provider decision | Name the PostgreSQL, Redis, storage providers; select region and non-production data classification | Provider plan, cost/quota, owner, region, data handling, retention | Any purchase, billing, or unclear ownership |
| G1 — Resource creation | Create isolated non-production PostgreSQL, Redis, and private bucket only | Sanitized resource IDs, configuration checklist, no credentials in evidence | Missing no-eviction policy, missing private bucket, or no recovery plan |
| G2 — External compatibility | Run direct PostgreSQL, Redis/BullMQ, and S3 presigned-object tests | Command output, timestamps, service metrics | Any connectivity, TLS, migration, queue, or object-operation failure |
| G3 — BIM disposition | Run a real BIM worker or approve/test a source-level optionality design | Startup and commercial-boundary evidence | Required BIM values cannot be safely supplied |
| G4 — Hostinger deploy | Create two temporary Web Apps, pin source, disable auto deploy initially, set secrets, deploy | Deployment IDs, commit SHA, build/start logs, health responses | Unexpected main traffic, unapproved domain, failed build/start, or resource pressure |
| G5 — C04 smoke | Seed only approved disposable non-production data and test commercial path | English/Arabic, Hold, Reservation, expiry/race evidence | Any business invariant failure |
| G6 — Teardown / retain | Decide whether to destroy pilot data/resources or retain under written ownership | Resource inventory, backup/export decision, cost review | Ownership/retention unclear |

## 7. Local evidence completed for this candidate

The following was run locally against isolated PostgreSQL databases and local Redis, with no external provider or Hostinger deployment:

| Check | Result |
|---|---|
| Candidate generated architecture context | Current — 20 artifacts |
| Prisma schema validation | Passed |
| API TypeScript typecheck | Passed |
| API build | Passed |
| Clean `r4c_c04_e2e` migration reset | All five committed migrations applied |
| C04 real HTTP/integration suite | Passed — one suite, including i18n, Hold, Reservation, expiry sweep, and race condition coverage |
| Clean `r4c_c03_e2e` migration reset | All five committed migrations applied |
| C03 real HTTP/invariant regression suite | Passed — two suites |

The first C04 attempt against an unmigrated local `r4c` database failed with `The table public.Tenant does not exist`. That was a local test-environment preparation failure, not a candidate source failure; rerunning against the dedicated clean migrated `r4c_c04_e2e` database passed. This is evidence that deployment verification must run `prisma migrate deploy` before API startup.

## 8. Open Founder decisions

1. **Provider composition:** Identify the PostgreSQL, Redis, and S3-compatible storage accounts/providers, billing owner, country/region, and non-production data classification.
2. **BIM boundary:** Approve one tested disposition: real worker deployment or governed optionality design. No dummy configuration is permitted.
3. **Hostinger app count and domains:** Approve two temporary Node.js Web App slots and two non-production hostnames. The account capacity is not a decision to create a resource.
4. **Cost cap:** Approve provider plan/quota/region only after the exact advertised cost and limits are displayed in the provider account.
5. **Test-data rules:** Approve disposable synthetic test data only; no personal data, customer data, commercial contracts, payments, invoices, or production tenant data.

## References

[1]: https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/ "Hostinger — Parameters and limits of hosting plans"
[2]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase — Connecting to Postgres"
[3]: https://supabase.com/docs/guides/database/prisma "Supabase — Prisma"
[4]: https://supabase.com/docs/guides/storage/s3/compatibility "Supabase — S3 Compatibility"
[5]: https://docs.bullmq.io/guide/connections "BullMQ — Connections"
[6]: https://github.com/redis/ioredis "ioredis README"
[7]: https://upstash.com/docs/redis/integrations/bullmq "Upstash — BullMQ with Upstash Redis"
[8]: https://upstash.com/docs/redis/features/eviction "Upstash — Eviction"
[9]: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ "Hostinger — How to add a Node.js Web App"
[10]: https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/ "Hostinger — How to redeploy a Node.js application"
