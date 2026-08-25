# R4C Shared-Hosting Deployment Contract

## Authoritative target

R4C is source-compatible with two managed Node.js applications on Hostinger shared/cloud Web Apps:

| Application | Build | Start | Health |
| --- | --- | --- | --- |
| API | `pnpm install --frozen-lockfile && pnpm build:api:hostinger` | `node apps/api/dist/main.js` | `/api/v1/health/ready` |
| Web | `pnpm install --frozen-lockfile && pnpm build` | `node hostinger-web-entry.cjs` | `/api/health` |

The applications use managed external services. They do not require a VPS, systemd, a host-level reverse proxy, privileged ports or persistent application-local storage.

## Migration boundary

Database migration is a controlled operator step:

```text
pnpm migrate:api:hostinger
```

It must run against the reviewed target database before application startup and separately from the build. A build must never mutate a database. Production migration, restart and rollback authorization remain Founder-controlled.

## Environment contracts

Use the names-only templates below and store populated values only in the hosting provider's protected environment settings:

- `deploy/hostinger-external/api.env.example`
- `deploy/hostinger-external/web.env.example`

Required API groups are PostgreSQL, authentication secrets, exact CORS origins, tenant defaults, proxy/rate-limit policy and the public web URL. SMTP is required only for password recovery. Redis is required for durable scheduled Hold expiry. S3-compatible storage is required for document/BIM media. BIM stays disabled unless a separately approved private worker is available.

Required Web values are the server-side API URL, build-visible public API URL where still consumed, tenant base domain and default tenant code. Production values have no localhost, `.local`, Docker service-DNS or default-secret fallback.

## Evidence states

- **SOURCE-QUALIFIED:** build, type, security and configuration checks pass for an exact commit.
- **DEPLOYED:** the exact commit is reported by the hosting provider.
- **PRODUCTION-VERIFIED:** health plus authenticated, persisted workflow evidence exists for that exact deployment.
- **OPERATIONAL:** capability-specific dependencies, monitoring, backup/restore and signed business UAT are verified.

These states must not be conflated. The isolated Docker Compose Phase 7 workflow is a release rehearsal, not proof of the current hosted production topology.

## Explicitly unsupported as the authoritative target

- Hostinger VPS provisioning
- systemd service installation
- production Docker service names such as `postgres`, `redis`, `minio` or `api`
- Caddy/Cloudflare DNS automation as an application requirement
- hardcoded localhost or `.local` production endpoints
- migrations executed implicitly during a build

The Compose/Caddy artifacts remain bounded CI/local self-hosting rehearsal assets. They are not the current production contract.

