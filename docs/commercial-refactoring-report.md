# Commercial refactoring report

## Completed

Before, the browser had one inventory administration component and no commercial journey client boundary. After, `CommercialOperatorWorkspace` owns presentation/state while `commercialApi` owns typed HTTP paths and JSON setup. The existing `CommercialInventory` remains unchanged and is rendered inside a clear admin boundary.

Before, payment-plan reads shared an administration capability and localized descriptions required translation administration. After, read and manage capabilities are separate, and Unit reads return only locale-resolved Project/Phase/UnitType descriptions with deterministic Arabic-to-English-to-source fallback.

Before, activity reads and Hold create/release did not all apply the same accessible-Lead rule. After, the existing owner-or-manager guard is reused at each touched operation. Assignee discovery is a focused tenant-scoped projection rather than exposing memberships or arbitrary users.

Before, bootstrap seed logic reconciled two roles with duplicated loops. After, one declarative reconciliation path preserves `ADMIN`/`VIEWER` and adds exact `SALES_AGENT`/`SALES_MANAGER` mappings. Optional UAT users follow the existing environment-gated password pattern.

## Regression protection and deferred debt

API contract tests protect read/manage separation, tenant-scoped assignees, ownership guards, and credential-free roles. Existing C03/C04 runtime tests protect lifecycle, append-only activities, concurrency, expiry, price snapshots, and tenant isolation; C04 now exercises the new reads and assignee isolation. Web contracts protect permission-only UI logic, English/Arabic integration, RTL logical CSS, and proxy scope.

The large CommercialService remains intact because file length alone is not justification. No generic repository, CQRS layer, route rename, database field rename, or unrelated formatting pass was introduced.
