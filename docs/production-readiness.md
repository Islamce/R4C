# Production readiness and release controls

Phase 11 turns the existing compile-only gate into an executable release rehearsal.

## CI release gate

Every pull request and push to `main` must now:

1. reject committed secret files;
2. install the exact frozen lockfile;
3. validate and generate the Prisma client;
4. start PostgreSQL 17 and wait for database health;
5. apply the complete Prisma schema to a clean database;
6. compare the deployed database back to the schema and fail on drift;
7. type-check the monorepo;
8. build all TypeScript applications;
9. run API security and governance contracts;
10. lint and test the BIM worker.

The database rehearsal proves that schema relations, constraints, indexes, and PostgreSQL types are executable—not merely syntactically valid.

## API contracts

The contract suite verifies:

- authorization denies missing permissions;
- critical separation-of-duties policies;
- commissioning acceptance rules;
- HSE investigation thresholds;
- turnover state cannot bypass commissioning;
- tenant-owned Prisma models declare `tenantId`;
- sensitive domain controllers protect every route with `@RequirePermissions`.

These are architecture guardrails. They complement, but do not replace, future service integration and browser end-to-end tests.

## Health endpoints

- `GET /api/v1/health` is the liveness probe. It confirms the API process can respond.
- `GET /api/v1/health/ready` is the readiness probe. It executes `SELECT 1` through Prisma and reports database latency and process uptime.

Recommended orchestration behavior:

- liveness failure: restart the API container;
- readiness failure: remove the instance from traffic without immediately destroying diagnostic state;
- alert when database latency or readiness failures exceed the operating threshold.

## Deployment sequence

1. Confirm the release PR is green and record its head SHA.
2. Create and verify a PostgreSQL backup.
3. Apply the reviewed production migration or schema deployment step.
4. Deploy the API and workers.
5. Wait for `/health/ready` to return `ready`.
6. Run smoke tests for authentication, project read, document read, BIM manifest, and one domain dashboard.
7. Deploy the web application.
8. Monitor errors, job failures, database saturation, and readiness for the observation window.
9. Record the release SHA, operator, timestamps, and evidence.

## Rollback sequence

Application rollback and database rollback are separate decisions.

1. Remove unhealthy instances from traffic.
2. Roll back the application image to the last known-good SHA when the schema remains backward compatible.
3. Do not reverse a production schema change automatically.
4. For destructive or incompatible database changes, restore only under the approved recovery procedure and after preserving incident evidence.
5. Re-run readiness and smoke checks.
6. Record the incident and corrective action in the audit/operations record.

## Backup and restore drill

Before production acceptance:

- define RPO and RTO;
- encrypt backups and store at least one copy offsite;
- verify backup checksums;
- restore into an isolated environment;
- validate row counts and critical tenant/project records;
- run Prisma drift comparison against the restored database;
- document elapsed restore time and any manual steps.

## Remaining production gates

Phase 11 establishes the executable baseline. The following remain explicit follow-up gates:

- service-level integration tests against PostgreSQL, Redis, and object storage;
- authenticated HTTP end-to-end tests;
- load and concurrency tests for serializable transitions;
- dependency and container vulnerability scanning;
- centralized logs, metrics, traces, alert routing, and SLOs;
- tested backup/restore and disaster-recovery evidence;
- penetration testing and formal UAT sign-off.
