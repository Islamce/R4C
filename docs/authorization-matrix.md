# Commercial authorization matrix

The browser receives `permissions[]` from the authenticated session. UI visibility is convenience only; Nest guards and service-level tenant/ownership checks remain authoritative. Role names are never an authorization bypass.

## Existing capabilities and roles

The commercial controllers already exposed inventory read/manage/status, published/draft price operations, media/translation management, Customer/Lead/activity operations, Hold release/create, and Reservation confirmation. Existing bootstrap roles remain `ADMIN` and `VIEWER`; `ADMIN` receives all source-derived permissions and `VIEWER` retains the established read-only mapping.

## Implemented commercial roles

| Capability | Sales Agent | Sales Manager | Admin/Owner |
| --- | ---: | ---: | ---: |
| `project:read` | Yes | Yes | Yes |
| `commercial:read` | Yes | Yes | Yes |
| `commercial:price:view-published` | Yes | Yes | Yes |
| `commercial:payment-plan:view` | Yes | Yes | Yes |
| `commercial:customer:create/view` | Yes | Yes | Yes |
| `commercial:lead:create/view-own/qualify/disqualify` | Yes | Yes | Yes |
| `commercial:activity:view/log` | Yes | Yes | Yes |
| `commercial:hold:create/release` | Yes | Yes | Yes |
| `commercial:lead:view-all/reassign` | No | Yes | Yes |
| `commercial:reservation:confirm` | No | Yes | Yes |
| `commercial:manage/status` | No | No | Yes |
| Price draft/create/publish | No | No | Yes |
| `commercial:payment-plan:manage` | No | No | Yes |
| `commercial:media:manage` | No | No | Yes |

`SALES_MANAGER` is the union of the Sales Agent mapping and its three manager capabilities. Seed reconciliation deletes stale role-permission links before restoring the exact mapping, so reruns do not accumulate privilege. Optional UAT users are created only when both password variables are privately configured; no password is stored in source.

## Enforcement evidence

- Own Lead reads use `assignedToId = session.userId`; all-Lead reads have a separate guarded route.
- Status, disqualification, activity read/log, Hold create, and Hold release check Lead ownership or manager visibility in the service.
- Assignee lookup is tenant-scoped, active-user-only, and guarded by `commercial:lead:reassign`; it returns ID, display name, and role code/name only.
- Payment-plan GET uses `commercial:payment-plan:view`; POST/PUT retain `manage`.
- Unit localized descriptions use `commercial:read` and return only resolved descriptions, not arbitrary translation records.
- Agent confirmation and payment-plan administration are negative-tested; Manager confirmation and cross-tenant exclusion are covered by the C04 runtime suite.

## Residual gaps

Production memberships do not exist until a separately authorized seed/administrative operation is performed. The source fixtures do not authorize or perform that operation. Customer discovery remains deliberately bounded to Lead-returned data; no broad customer search was added.
