# Managed-hosting compatibility

## Runtime shape

- Node.js: repository engine `>=22`; production images use Node 22. Local verification used Node 24.19.0.
- Install: `pnpm install --frozen-lockfile` with pnpm 10.13.1.
- API build/start: Prisma generate, Nest build, then `node apps/api/dist/main.js` from an installation containing API production dependencies and generated Prisma client.
- Web build/start: root `pnpm build` creates the standalone Next output and copies static assets; managed hosting starts `node hostinger-web-entry.cjs`. Container deployments may use `node server.js` in the standalone web directory.
- Health: Web `/api/health`; API `/api/v1/health/live` and `/api/v1/health/ready`.

## Configuration names (values intentionally omitted)

Core names are `NODE_ENV`, `PORT`/`API_PORT`, `API_URL` (or legacy `NEXT_PUBLIC_API_URL`), `CORS_ORIGINS`, `TENANT_BASE_DOMAIN`, `TENANT_DEFAULT_CODE`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `HOLD_EXPIRY_SWEEP_INTERVAL_MS`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TRUST_PROXY_HOPS`, `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`. BIM remains disabled with `BIM_ENABLED=false`; no worker URL workaround was added. Seed variable names are documented in `.env.example`, including optional Sales Agent/Manager UAT credentials.

## External services and hosting behavior

PostgreSQL remains the Prisma database; there was no MySQL conversion. The JavaScript PostgreSQL adapter fix is preserved. Redis/BullMQ performs recurring Hold-expiry sweeps and therefore must be an external durable service. R2/S3-compatible object storage remains external. Runtime application code adds no persistent local filesystem writes. Native/runtime concerns remain those already locked by the project (Prisma client and package binaries); no new native dependency was introduced.

The browser calls same-origin Next route handlers, which forward allow-listed paths to `API_URL` with the secure server-side session. API CORS continues to use the configured origins and credentials. The commercial refactor adds no port, process, daemon, filesystem, or VPS assumption.

## Migration and gate status

Committed Prisma migrations are executed separately with `prisma migrate deploy` from a privately configured environment. This task did not run migration tooling against production, mutate Neon/Redis/R2, deploy, restart, or change environment variables.

Current runtime classification: `DEPLOYED BUT VALIDATION-BLOCKED — SPLIT SHA AND UNINITIALIZED DATABASE SCHEMA`.

Remaining gate: exact-SHA unification, Prisma migration, readiness, Redis validation, R2 validation, synthetic UAT, then controlled restart/persistence validation. No VPS is required or introduced.
