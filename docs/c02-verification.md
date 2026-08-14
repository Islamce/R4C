# C02 Pricing & Media Verification

**Date:** 14 August 2026  
**Status:** Passed in the local isolated verification environment.

## Verified controls

| Control | Evidence |
| --- | --- |
| Additive migration | `20260814000000_c02_pricing_media` creates the price revision, payment-plan, installment, and commercial-media reference tables without altering existing migration files. |
| Clean migration | A fresh PostgreSQL database applied `0_init`, C01, and C02 successfully. All six C02 tables were present afterward. |
| Upgrade migration | A separate database first applied only `0_init` and C01, then applied C02 successfully as the next migration. |
| API contracts | Root workspace type-check passed for API, web, and shared contracts. |
| Core API tests | The API security-contract suite passed: 6 tests, 0 failures. |
| C02 authenticated HTTP test | `pnpm --filter @r4c/api test:c02` passed: 1 test, 0 failures. It exercised real PostgreSQL, Redis, compiled API code, authentication, capability checks, price draft/publish/supersede behavior, payment-plan total validation, document-version media attachment, tenant hiding, and audit-event creation. |

## Reproduction commands

The C02 HTTP test requires a PostgreSQL database migrated through C02, Redis, and the environment values used by the API. In a local development environment with those dependencies available:

```bash
export DATABASE_URL='postgresql://…/r4c_c02_e2e?schema=public'
export REDIS_URL='redis://127.0.0.1:6379'
export S3_ENDPOINT='http://127.0.0.1:9000'
export S3_REGION='us-east-1'
export S3_BUCKET='r4c-c02'
export S3_ACCESS_KEY='…'
export S3_SECRET_KEY='…'
export JWT_ACCESS_SECRET='…'
export JWT_REFRESH_SECRET='…'
export BIM_WORKER_URL='http://127.0.0.1:65535'
export BIM_WORKER_TOKEN='…'

pnpm --filter @r4c/api prisma:migrate:deploy
pnpm --filter @r4c/api build
pnpm --filter @r4c/api test:c02
```

## Explicit boundary check

The C02 migration and service changes add no Wafi/REGA escrow, ZATCA/Fatoora invoicing, electronic-signature, contract, payment-collection, finance/ERP, buyer-ledger, commission-settlement, or Development Intelligence models, routes, or integrations.
