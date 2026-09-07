# Production UAT regeneration — 2026-09-07

Environment: `https://r4c.kynox.io` / `https://r4c-api.kynox.io`  
Deployed commit: `57f7ac865fd0ec969f3143cf1783fd21b3b308db` (PR #88 merge)

## Outcome

The repository-defined, idempotent Alomran UAT seed completed twice against the
production Docker deployment. The first run created the missing UAT tenant,
administrator, progress-submitter role, and progress-submitter account. The
second run made no changes, proving the regenerated state is idempotent.

No reset, truncate, volume removal, or user deletion was executed. A PostgreSQL
backup was captured before the operation at
`/opt/backups/r4c/pre-uat-regenerate-20260907.dump` on the VPS. The backup is
mode `0600` and is not stored in Git.

## Maintained user list

| Email | Tenant | Role | Active | Effective permissions | Result |
| --- | --- | --- | --- | ---: | --- |
| `islam@kynox.io` | `R4C` | `ADMIN` | Yes | 95 | Preserved; original user ID unchanged |
| `uat.admin@alomran.example.com` | `ALOMRAN` | `ADMIN` | Yes | 95 | Created by configured UAT seed |
| `uat.submit@alomran.example.com` | `ALOMRAN` | `PROGRESS_SUBMITTER` | Yes | 13 | Created by configured UAT seed |

The progress submitter can submit progress and cannot review it, preserving the
intended separation of duties. Commercial sales-agent and sales-manager UAT
accounts were not created because their optional password variables are not
configured in the VPS environment; no credentials were invented.

## Verification

- Second UAT seed run: zero tenants, permissions, roles, users, memberships, or
  role-permission links created, updated, or removed.
- User totals: 3 users, all active, all with tenant memberships.
- Membership integrity: zero orphan memberships.
- Runtime: PostgreSQL, Redis, MinIO, API, and Web containers all remained
  healthy after the operation.
- Public checks: R4C Web `/api/health` and API `/api/v1/health/ready` returned
  HTTP 200 before the operation; the API readiness response reported the
  database healthy.

## Scope note

`seed:uat` is the repository's authentication/RBAC UAT seed. It creates and
reconciles the UAT tenant and its configured test identities; it does not invent
project, unit, customer, lead, reservation, or transfer-file records. Any later
business-scenario fixture generation must use an approved, separately defined
procedure and must retain this user list.
