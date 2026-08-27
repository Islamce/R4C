# Managed-hosting compatibility

## Runtime shape

- Node.js: repository engine `>=22`; production images use Node 22. Local verification used Node 24.19.0.
- Install: `pnpm install --frozen-lockfile` with pnpm 10.13.1.
- API build/start: Prisma generate, Nest build, then `node apps/api/dist/main.js` from an installation containing API production dependencies and generated Prisma client.
- Web build/start: root `pnpm build` creates the standalone Next output and copies static assets; managed hosting starts `node hostinger-web-entry.cjs`. Container deployments may use `node server.js` in the standalone web directory.
- Health: Web `/api/health`; API `/api/v1/health/live` and `/api/v1/health/ready`.

## Configuration names (values intentionally omitted)

Core names are `NODE_ENV`, `PORT`/`API_PORT`, `API_URL` (or legacy `NEXT_PUBLIC_API_URL`), `CORS_ORIGINS`, `TENANT_BASE_DOMAIN`, `TENANT_DEFAULT_CODE`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `HOLD_EXPIRY_SWEEP_INTERVAL_MS`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TRUST_PROXY_HOPS`, `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`. Password recovery additionally requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `WEB_APP_URL`, and `RATE_LIMIT_PASSWORD_RESET_PER_MINUTE`. BIM remains disabled with `BIM_ENABLED=false`; no worker URL workaround was added. Seed variable names are documented in `.env.example`, including optional Sales Agent/Manager UAT credentials.

## External services and hosting behavior

PostgreSQL remains the Prisma database; there was no MySQL conversion. The JavaScript PostgreSQL adapter fix is preserved. Redis/BullMQ performs recurring Hold-expiry sweeps and therefore must be an external durable service. R2/S3-compatible object storage remains external. Password-reset delivery uses authenticated TLS SMTP and stores only hashed, expiring, single-use tokens in PostgreSQL. Runtime application code adds no persistent local filesystem writes. Native/runtime concerns remain those already locked by the project (Prisma client and package binaries); no new native dependency was introduced.

The browser calls same-origin Next route handlers, which forward allow-listed paths to `API_URL` with the secure server-side session. API CORS continues to use the configured origins and credentials. The commercial refactor adds no port, process, daemon, filesystem, or VPS assumption.

## Migration and gate status

Committed Prisma migrations are executed separately with `prisma migrate deploy` from a privately configured environment. This task did not run migration tooling against production, mutate Neon/Redis/R2, deploy, restart, or change environment variables.

Current source classification: `SHARED-HOSTING COMPATIBLE — MANAGED DEPENDENCIES REQUIRE INDEPENDENT RUNTIME EVIDENCE`.

The repository build and start paths support separate Hostinger Node.js Web Apps and a managed PostgreSQL database. Redis, object storage, SMTP and BIM remain capability-specific external dependencies and must not be reported operational without direct evidence. Migrations are a separate operator action and are never part of the application build command. No VPS is required or introduced.
