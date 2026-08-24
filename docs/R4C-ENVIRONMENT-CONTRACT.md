# R4C Environment Contract

This contract lists names and roles only. Secret values must be injected through the approved deployment secret manager and must never be committed, printed, or placed in chat.

| Category | Variables | Status |
| --- | --- | --- |
| Core runtime | `NODE_ENV`, `WEB_PORT`, `API_PORT`, `WEB_APP_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS` | REQUIRED |
| PostgreSQL | `DATABASE_URL`, `DIRECT_URL` | REQUIRED |
| Redis | `REDIS_URL`, `HOLD_EXPIRY_SWEEP_INTERVAL_MS` | REQUIRED where holds, sessions, or queues are enabled |
| Authentication | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, tenant defaults | REQUIRED |
| Object storage | `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | REQUIRED only when accepted upload/media workflows are enabled |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | DISABLED FOR INITIAL RELEASE unless separately approved |
| UAT seed | `SEED_UAT_*`, `SEED_*` variables | STAGING ONLY; synthetic identities and private passwords only |
| Rate limits | `RATE_LIMIT_GLOBAL_PER_MINUTE`, `RATE_LIMIT_LOGIN_PER_MINUTE`, `RATE_LIMIT_AUTH_SESSION_PER_MINUTE`, `RATE_LIMIT_PASSWORD_RESET_PER_MINUTE`, `RATE_LIMIT_TENANT_LOOKUP_PER_MINUTE`, `RATE_LIMIT_UPLOAD_PER_MINUTE`, `RATE_LIMIT_SEARCH_EXPORT_PER_MINUTE` | REQUIRED defaults; verify at deployment boundary |
| BIM | `BIM_ENABLED`, `BIM_WORKER_URL`, `BIM_WORKER_TOKEN`, `BIM_MAX_ELEMENTS`, `BIM_MAX_FILE_BYTES`, `BIM_ALLOWED_SOURCE_HOSTS` | DISABLED FOR INITIAL RELEASE unless explicitly enabled |
| Production-only values | production database, Redis, storage, mail, domain, cookie, and provider values | PRODUCTION ONLY; not requested or used in this handoff |

The repository `.env.example` contains local development defaults and placeholders, not deployable credentials. The `.env.production.example` file must be reviewed by the infrastructure owner before production authorization. No production values are present in this handoff.
