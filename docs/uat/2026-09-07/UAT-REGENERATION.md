# Production UAT cleanup and neutral fixture naming — 2026-09-07

Environment: `https://r4c.kynox.io` / `https://r4c-api.kynox.io`  
Deployed commit during the operation: `57f7ac865fd0ec969f3143cf1783fd21b3b308db`

## Final outcome

An initial run of the repository's legacy UAT seed created a customer-like
`ALOMRAN` tenant and two test identities. The owner identified that this could
be confused with real projects and database content and directed its removal.

The live database was audited before cleanup. The tenant owned no projects,
customers, leads, units, reservations, transfer files, or other operational
records. It contained only five roles and the two memberships created by the
seed. The exact tenant and two exact UAT users were then removed in one
transaction. No R4C tenant or project record was included in the deletion.

The VPS `.env.production` file no longer contains any `SEED_UAT_*` values, so
the removed tenant cannot be recreated accidentally by running the UAT seed
without deliberate fresh configuration.

A follow-up audit found that the saved environment file still carried rehearsal
domain defaults even though the running containers had already been started with
the correct `R4C` tenant and KYNOX base domain. The persisted file was corrected
to `r4c.kynox.io`, `r4c-api.kynox.io`, `TENANT_DEFAULT_CODE=R4C`, and the single
allowed browser origin `https://r4c.kynox.io`. API and Web were recreated from
the existing images so the saved and effective configurations now agree.

## Final production user list

| Email | Tenant | Role | Active | Effective permissions | Result |
| --- | --- | --- | --- | ---: | --- |
| `islam@kynox.io` | `R4C` | `ADMIN` | Yes | 95 | Preserved; original user ID unchanged |

Post-cleanup queries returned zero customer-like UAT tenants and users. The
production database currently contains zero projects; this is recorded to
avoid mistaking an empty project list for a hidden or alternate-tenant dataset.

## Recovery and verification

- Pre-regeneration backup:
  `/opt/backups/r4c/pre-uat-regenerate-20260907.dump`
- Pre-removal backup:
  `/opt/backups/r4c/pre-alomran-removal-20260907.dump`
- Pre-removal environment backup, root-only on the VPS:
  `/opt/backups/r4c/env-before-alomran-removal-20260907`
- Pre-domain-correction environment backup, root-only on the VPS:
  `/opt/backups/r4c/env-before-domain-cleanup-20260907`
- Backups are mode `0600` and are not stored in Git.
- PostgreSQL, Redis, MinIO, API, and Web containers remained healthy.
- R4C Web `/api/health` and API `/api/v1/health/ready` returned HTTP 200; API
  readiness reported the database healthy.
- Effective runtime configuration now resolves the apex workspace to tenant
  `R4C` and permits only `https://r4c.kynox.io` as the browser origin.

## Source correction

Active configuration examples, UAT seed defaults, authentication resolution,
CI workflows, tests, and current operational documentation no longer use the
customer-like identity. The neutral fixture identity is now:

- tenant code: `UAT`
- tenant name: `R4C UAT Workspace`
- administrator email: `uat.admin@r4c.test` for local/test use
- tenant host example: `uat.r4c.local`

This source correction does not create the neutral UAT tenant in production.
Production retains only the explicit `R4C` tenant and `islam@kynox.io` account.
