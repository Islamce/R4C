# R4C Canonical CRM Backend Freeze

**Status:** Backend Frozen for code and domain-contract convergence; production release remains gated on controlled database migration application and authenticated UAT.

**Authority:** R4C is the sole authoritative real-estate CRM and commercial product. RCRM remains a reference implementation and was adapted deliberately; no repository merge or shared operational database was used.

## Frozen scope

The R4C Prisma/NestJS backend now contains additive, tenant-scoped canonical CRM models for `Contact`, `Opportunity`, `CrmActivity`, `CrmTask`, `Quotation`, `QuotationRevision`, and `CustomerDecision`. The existing real-estate hierarchy remains authoritative: `Project`, `DevelopmentPhase`, `Building`, `Floor`, and `Unit` are preserved, and CRM records may reference project and unit context only through tenant-scoped composite relations.

The CRM HTTP surface is registered under `/crm` and guarded by the existing global JWT and permission guards. Read operations require `crm:read`; mutations require `crm:write`; quotation revision approval requires `crm:approve`. Every service lookup includes `tenantId`, owner and assignee references must belong to the tenant, and audit events are recorded for CRM lifecycle mutations.

## Governing lifecycle rules

| Domain | Frozen rule |
| --- | --- |
| Contact | Email and phone are normalized before comparison; duplicate identity within a tenant is rejected. Lead conversion is idempotent and requires a lead-linked customer. |
| Opportunity | Stage movement is monotonic until a terminal state. Terminal opportunities cannot be reopened through the frozen service. |
| Activity and task | Each reference is resolved inside the authenticated tenant; tasks require a tenant member as assignee. Completion records `completedAt`. |
| Quotation | Every quotation starts with immutable revision 1. New revisions supersede active prior revisions rather than mutating snapshots. |
| Revision approval | A revision may be approved and then sent; sending an unapproved revision is rejected. Superseded revisions cannot be approved or decided. |
| Customer decision | A revision accepts exactly one decision record. Duplicate decisions are rejected by both service logic and a database uniqueness constraint. |

## Migration boundary

Migration `20260823130000_canonical_crm` is additive. It creates only the CRM enums, tables, indexes, unique constraints, and foreign keys. It contains no `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `DELETE FROM` operation. The migration has not been applied to a production database, and no production credential was used during this phase.

## Qualification evidence

| Check | Result |
| --- | --- |
| Prisma schema validation with non-secret placeholder datasource values | Passed |
| Prisma client generation | Passed |
| R4C API TypeScript build | Passed |
| Workspace typechecks for API, web, and contracts | Passed |
| Contracts package build | Passed |
| R4C API regression and CRM contract suite | 21 passed, 0 failed |
| Git whitespace/diff validation | Passed |
| WMS/LOGIX runtime-coupling contract check | Passed |

## Explicit release gates remaining

The freeze does not authorize deployment. A controlled environment must apply the migration with the real R4C database migration process, verify migration history and foreign-key creation, and execute authenticated tenant-isolation E2E tests using disposable or approved staging data. Populated-state UI UAT, independent penetration testing, and production rollout remain outside this no-credential implementation phase.

## Handover

The next implementation stage may build the final CRM UI against the frozen `/crm` contract. Any schema or lifecycle change after this record requires a new reconciliation decision, migration review, regression evidence, and a new freeze record; blind copying from RCRM is prohibited.
