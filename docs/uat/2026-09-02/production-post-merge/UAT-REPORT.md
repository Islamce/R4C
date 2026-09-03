# R4C production post-merge UAT

Date: 2026-09-02  
Environment: `https://r4c.kynox.io` / `https://r4c-api.kynox.io`  
Merged release: `dc283ce72edd916006d9a4eed90c5279a83806cb`

## Result

**NO-GO pending corrective permission migration.** The approved KYNOX commercial workspace is live and visually consistent on the tested desktop surface. Web health and API database readiness pass. The Sales pipeline reads persisted production data, but the Commercial Operations journey is denied for the protected administrator because the production role records predate the complete commercial permission matrix.

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| PR #86 merged | PASS | GitHub merge commit `dc283ce72edd916006d9a4eed90c5279a83806cb` |
| Web health | PASS | `/api/health` returned HTTP 200 |
| API readiness/database | PASS | `/api/v1/health/ready` returned HTTP 200 and database `ok` |
| Approved commercial shell | PASS | `01-sales-pipeline-desktop.png` |
| Persisted Sales pipeline | PASS | One production interest record rendered in the cumulative customer ledger |
| Operations permission | FAIL | ADMIN received the restricted-workflow state after opening Sales Operations |

## Corrective action

The forward-only migration `20260902183000_backfill_commercial_role_permissions` upserts the complete commercial permission set and grants the seed-defined matrix to existing `ADMIN`, `SALES_AGENT`, and `SALES_MANAGER` roles. It does not delete, reset, or reseed production data. A contract test prevents removal of the critical grants and rejects destructive SQL in this migration.

Production acceptance requires the migration to deploy, the administrator session to refresh, and the role-specific workflows to be retested.
