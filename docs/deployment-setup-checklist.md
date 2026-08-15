# R4C Deployment Setup Checklist

**Status:** Prepared configuration only; no third-party account, purchase, database, Redis instance, bucket, credential, GitHub connection, DNS record, Web App, migration, or deployment has been created or changed.

**Target:** A disposable non-production R4C composition: two Hostinger Cloud Startup Node.js Web Apps, Neon PostgreSQL, Upstash Redis, and Cloudflare R2. This is not production authorization and does not permit customer data.

> **Region decision is deliberately open.** Do not select a provider region, Cloudflare R2 location hint, or R2 jurisdiction until the C03 PDPL/data-residency decision identifies the allowable location and data classification. R2 jurisdictions cannot be changed after bucket creation.[10]

## 1. Configuration prepared in this repository

| Artifact | Purpose |
| --- | --- |
| `deploy/hostinger-external/nonproduction-web-apps.manifest.yaml` | Human-readable two-Web-App build/start/health configuration; not an hPanel import format. |
| `deploy/hostinger-external/api.env.example` | Secrets-free API variable names for Neon, Upstash, R2, C04 expiry, and disabled BIM. |
| `deploy/hostinger-external/web.env.example` | Secrets-free Web variables, including build-visible `NEXT_PUBLIC_API_URL`. |
| `apps/api/src/app.module.ts` | Frozen Development Intelligence is disabled unless `BIM_ENABLED=true`; omitted/false disables the BIM module and its worker. |
| `docker-compose.prod.yml` | BIM service is behind the explicit `bim` profile and API no longer waits on it. |

The API now honors the managed-platform `PORT` value whenever `API_PORT` is absent. Existing Docker/local deployments can continue setting `API_PORT` explicitly.

## 2. Account-side decision gate

Before creating anything, record these decisions in the delivery ticket or approval note.

| Decision | Required answer | Do not infer |
| --- | --- | --- |
| Data classification | Synthetic disposable non-production data only, with no customer PII, contracts, payment data, or production documents. | Do not import live R4C data. |
| Region / residency | Privacy/legal owner selects permissible provider region and R2 bucket location/jurisdiction. | Do not use the nearest/default location as a proxy for approval. |
| Billing owner and cap | Owner accepts Neon, Upstash, and Cloudflare account terms plus an explicit monthly pilot cap. | Do not enter a card or purchase a plan in this task. |
| BIM disposition | Remain disabled for the pilot, or separately approve a real private BIM worker deployment. | Do not use a fake BIM URL/token or start the frozen worker by default. |
| Temporary hostnames | Approve non-production API and Web hostnames later, after the preceding decisions. | Do not create or change DNS now. |

## 3. PostgreSQL — recommended candidate: Neon

**Recommendation:** Use Neon for the isolated non-production PostgreSQL database, subject to the still-open region decision. Neon documents Prisma with a pooled `DATABASE_URL` for the application and a direct `DIRECT_URL` for Prisma CLI migrations; both use TLS.[1] R4C is on Prisma 6.12 and the prepared Prisma datasource uses `DIRECT_URL` for migration tooling while the running API uses `DATABASE_URL`.

Neon’s permanent Free plan has no card requirement, includes 100 CU-hours, 0.5 GB storage, and scales an inactive compute to zero after five minutes; its Launch plan is metered without a monthly minimum.[2] The idle wakeup can add latency to the first API database connection, so it is acceptable only for a non-production pilot until measured. Supabase remains a viable alternative—its documented server-based Prisma path uses the session pooler on port 5432—but is not selected here because Cloudflare R2 is the separately authorized storage choice.[3]

### What Islam must do after G0 approval

1. Create a Neon account and an **isolated non-production project** in the privacy-approved region.
2. Create a database branch intended only for the pilot; do not clone or import production data.
3. In the Neon console’s connection panel, copy both TLS connection strings:
   - the **pooled** hostname (contains `-pooler`) for `DATABASE_URL`;
   - the **direct** hostname for `DIRECT_URL`.
4. Put the values only in the Hostinger API Web App’s secret environment configuration, using the exact formats in `deploy/hostinger-external/api.env.example`.
5. Keep `sslmode=require`; do not remove TLS. Start with the documented placeholder pool controls, then adjust only after measured Hostinger concurrency.
6. Before API startup, run `pnpm --filter @r4c/api prisma:migrate:deploy` once against the empty isolated database and save the migration output.
7. Record provider project ID, selected region, plan, owner, spend control, backup/restore/export settings, and disposal date without recording passwords in a ticket or repository.

## 4. Redis — Upstash TCP/TLS, fixed plan recommended

R4C uses ioredis and BullMQ for both the C04 Hold-expiry scheduler and BIM queues. It therefore needs Upstash’s **TCP/TLS** connection, not `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`. Upstash documents the ioredis form as `rediss://:PASSWORD@ENDPOINT:PORT`, and TLS is mandatory.[4]

Upstash explicitly notes that BullMQ continuously accesses Redis even without queue work and recommends Fixed plans to avoid variable command costs.[5] The Free tier offers 256 MB and 500,000 commands/month, so it is **not approved as a sufficient ongoing C04 expiry-sweep tier**. The recommended pilot starting point is **Fixed 250 MB** at the published $10/month plus $5/read region; it has no command-count billing.[6] This still requires Founder cost approval, an actual region choice, and post-deployment usage measurement.

### What Islam must do after G0 approval

1. Create one isolated Upstash Redis database in the privacy-approved region.
2. Select **Fixed 250 MB** only after accepting the documented spend; do not use a free/REST database for the recurring C04 worker.
3. Keep **Eviction disabled**. Upstash documents this as the default; enabling it can remove volatile and nonvolatile keys, which is unsafe for BullMQ state.[7]
4. Copy the database **Endpoint**, **Port**, and **Token**. Construct `REDIS_URL` in the API template’s `rediss://` form; do not supply the REST URL/token.
5. Store `REDIS_URL` only in the Hostinger API Web App secret configuration.
6. After deployment, capture Redis metrics and prove that the C04 `r4c-commercial-hold-expiry` scheduler registers, an expired Hold returns its Unit from `HELD` to `AVAILABLE`, and a confirmed Reservation is not released by a subsequent sweep.

## 5. Object storage — Cloudflare R2

R4C’s existing `ObjectStorageService` already uses the AWS S3 SDK, a configured endpoint, S3 credentials, a bucket, and presigned `PUT`, `GET`, and `HEAD` requests. It requires no document-schema or workflow change for R2. Cloudflare documents the R2 S3 endpoint as `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and specifies `region: "auto"` for S3 SDK clients; this SDK region is not a physical-region selection.[8]

R2 supports the exact presigned operations R4C uses. Those URLs must use the R2 S3 API domain, not a custom domain.[9] R2 Standard has a monthly free allowance of 10 GB-month storage, one million Class A operations, and ten million Class B operations; direct R2 egress is free.[11]

### What Islam must do after G0 approval

1. In the Cloudflare account, create a **private** R2 bucket in the privacy-approved location/jurisdiction. Do not select Automatic, a location hint, or a jurisdiction until G0 resolves residency; an R2 bucket jurisdiction cannot be changed after creation.[10]
2. Choose **Standard** storage for the pilot. The R4C document workflow uses direct upload/download and `HEAD`; Infrequent Access adds retrieval fees and a 30-day minimum storage duration.[11]
3. In R2 API Tokens, create a token with **Object Read & Write** permission restricted to **that bucket only**. Copy the Access Key ID, Secret Access Key, bucket name, Account ID, and S3 endpoint at creation time; the Secret Access Key cannot be shown again.[8]
4. Populate `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` in the Hostinger API Web App using `deploy/hostinger-external/api.env.example`.
5. Do not make the bucket public. Before live use, set bucket CORS only for the exact approved temporary Web origin and test a R4C-generated presigned PUT, HEAD confirmation, and GET download.
6. Record bucket location/jurisdiction, storage class, lifecycle/retention setting, token scope, account owner, recovery/export procedure, and disposal date without committing credentials.

## 6. Hostinger two-Web-App configuration — prepare, then execute only after G1–G4 approval

The configuration below is prepared in `deploy/hostinger-external/nonproduction-web-apps.manifest.yaml`. It is not a deployment command.

| Web App | Repository-root build command | Start command | Health endpoint |
| --- | --- | --- | --- |
| API | `pnpm install --frozen-lockfile && pnpm --filter @r4c/api prisma:generate && pnpm --filter @r4c/api build` | `node apps/api/dist/main.js` | `/api/v1/health/ready` |
| Web | `pnpm install --frozen-lockfile && pnpm --filter @r4c/web build` | `node apps/web/.next/standalone/apps/web/server.js` | `/api/health` |

### What Islam must do after G1–G3 approval

1. Create two temporary Hostinger Node.js Web Apps only after explicitly approving G4. Do not connect GitHub or enable automatic deployments before then.
2. Confirm hPanel’s repository-root, Node 22, build command, start command, inbound port, environment-variable, deployment-log, and rollback behaviors for each separate app.
3. Pin a reviewed commit rather than enabling automatic deployments for the first deployment.
4. Set API Web App variables from `deploy/hostinger-external/api.env.example`. Keep `BIM_ENABLED=false` and leave BIM URL/token empty.
5. Set Web Web App variables from `deploy/hostinger-external/web.env.example`. Ensure `NEXT_PUBLIC_API_URL` is present **at build time**; it is compiled into the Next.js browser bundle.
6. Run the API migration command once, then start API, verify readiness, start Web, verify its health, and record build duration, startup errors, CPU/RAM/I/O observations, and health output.
7. Use only synthetic data to test English/Arabic commercial descriptions, Unit browsing, Hold creation, Reservation confirmation, expiry sweep, and race protection.
8. Decide whether to retain or dispose of all pilot resources and data; record export/backup and cost review before any next phase.

## 7. BIM worker boundary

`BIM_ENABLED` defaults to disabled. When it is absent, empty, or explicitly `false`, R4C does not import `BimModule`; its BIM routes, queue producer, and BullMQ worker do not initialize, and the API does not require `BIM_WORKER_URL` or `BIM_WORKER_TOKEN`. The C04 commercial expiry worker remains active because it belongs to `CommercialModule` and still requires `REDIS_URL` plus `HOLD_EXPIRY_SWEEP_INTERVAL_MS`.

For the Docker production topology, `bim-worker` is now in the explicit `bim` profile and the API no longer `depends_on` it. To enable BIM later requires both `BIM_ENABLED=true` and `docker compose --profile bim …`, plus a real private worker URL/token. This is a frozen-service configuration boundary, not deletion or a Development Intelligence feature change.

## 8. Evidence required before declaring a pilot ready

| Control | Required proof |
| --- | --- |
| PostgreSQL | Hostinger TLS reachability, clean `prisma migrate deploy`, API readiness, and recorded wakeup behavior if the provider scales to zero. |
| Redis | `rediss://` connection, no-eviction setting, C04 scheduler registration, expiry release, and confirmed-Reservation race protection. |
| R2 | Private bucket, restricted token, direct R4C presigned PUT/HEAD/GET round trip, and exact-origin CORS result. |
| BIM disabled | API starts with `BIM_ENABLED=false` and no BIM worker URL/token; C04 commercial behavior remains usable. |
| Hostinger | Build/start/health logs, resource observations, no unexpected automatic deployment, and a documented disposal/recovery choice. |
| Privacy | Region/residency decision, synthetic-data evidence, and no production customer data. |

## References

[1]: https://neon.com/docs/guides/prisma "Neon — Connect from Prisma to Neon"
[2]: https://neon.com/pricing "Neon Pricing"
[3]: https://supabase.com/docs/guides/database/prisma "Supabase — Prisma"
[4]: https://upstash.com/docs/redis/howto/connect-client "Upstash — Connect Your Client"
[5]: https://upstash.com/docs/redis/integrations/bullmq "Upstash — BullMQ with Upstash Redis"
[6]: https://upstash.com/pricing/redis "Upstash Redis Pricing"
[7]: https://upstash.com/docs/redis/features/eviction "Upstash — Eviction"
[8]: https://developers.cloudflare.com/r2/get-started/s3/ "Cloudflare R2 — S3"
[9]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Cloudflare R2 — Presigned URLs"
[10]: https://developers.cloudflare.com/r2/reference/data-location/ "Cloudflare R2 — Data location"
[11]: https://developers.cloudflare.com/r2/pricing/ "Cloudflare R2 Pricing"
