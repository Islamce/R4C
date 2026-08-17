# Buyer Sales Quotation MVP — Shared-Hosting Compatibility Record

**Candidate SHA:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`

**Target topology:** Hostinger managed Node.js web/API services, Neon PostgreSQL, Upstash Redis, Cloudflare R2  
**Assessment status:** **LOCAL COMPATIBILITY QUALIFIED; PROVIDER BOUNDARIES UNVERIFIED**

## Compatibility Position

The quotation MVP is designed to operate within the existing Node.js application topology. It does not require a VPS, a browser automation daemon, a long-running document-rendering worker, or a new persistent service. The local monorepo build completed for the exact candidate SHA, including Prisma client generation, Nest compilation, Next.js production compilation, standalone static-asset copying, and the buyer quotation route.

> This record is intentionally conservative: a successful local build does not prove that a managed Hostinger runtime has the required environment, filesystem behavior, deployment command, or external-service credentials.

| Area | Candidate behavior | Qualification result | Production boundary |
|---|---|---:|---|
| Web application | Next.js build includes the staff quotation route, buyer token route, backend proxy routes, and static WBS template. | Local pass | Exact deployed web SHA is not provider-verified. |
| API application | NestJS build includes quotation lifecycle, token, authorization, and document-preview endpoints. | Local pass | Exact deployed API SHA and runtime variables are not provider-verified. |
| Database migration | Seven source migrations, including `20260817100000_buyer_sales_quotation_mvp`, deployed and reported up to date in an isolated PostgreSQL rehearsal database. | Local disposable pass | Neon connection, schema state, backup posture, and migration history are unverified and must not be changed without G9. |
| Redis | Buyer/public route limits and commercial expiry processing use the configured Redis boundary. | Code and local seed/API boot pass | Upstash connection, namespace, TTL behavior, and production credentials are unverified. |
| Object storage | The API expects S3-compatible storage configuration for existing storage services. | Local construction with inert placeholders only | Cloudflare R2 bucket, CORS, credentials, and object access are unverified. |
| Controlled document preview | Server returns a labelled HTML preview payload; the UI says **Controlled document preview (HTML)**. | Qualified | No server-side PDF rendering, worker, or Chromium dependency is claimed. |

## Document-Control Constraint

The candidate deliberately does not create or promise a PDF. Adding server-side browser rendering, a background job, or an OS-level document processor would require a separate hosted-runtime compatibility decision and evidence. The current managed-hosting release scope is therefore a controlled HTML preview only. This preserves truthful buyer and staff terminology and avoids silently introducing a runtime the target environment has not qualified.

## Production Verification Required Before Authorization

The following verification is deliberately deferred because performing it would require provider access or could mutate a shared production environment:

| Required check | Why it remains blocked | Required evidence before deployment |
|---|---|---|
| Deployed web/API SHA | Hostinger deployment console was unavailable. | Screenshot or export showing both services on the approved immutable SHA. |
| Neon migration state | Production database access was not authorized. | Read-only status/revision evidence, then a separately approved migration execution record if needed. |
| Upstash Redis boundary | Provider configuration was unavailable. | Connection and rate-limit/expiry namespace evidence from a non-production or production-safe validation. |
| R2 storage boundary | Provider configuration was unavailable. | Bucket, CORS, credential-scope, and read/write verification using a non-sensitive test object. |
| Authenticated role UAT | No provider-backed user session or approved test tenant was supplied for this phase. | Sales-agent and sales-manager evidence using a non-production account with known permissions. |

No deployment, `prisma db push`, production migration, live notification, or customer delivery action was performed while preparing this record.

## References

[1]: https://r4c.kynox.io/api/health
[2]: https://r4c-api.kynox.io/api/v1/health/ready
