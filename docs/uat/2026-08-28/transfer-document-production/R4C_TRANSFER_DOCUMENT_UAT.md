# R4C transfer-document production UAT

Date: 2026-08-28  
Scope: production-backed title-transfer case loading, document upload, document review, and manager approval.

## Result

PASS for build and contract gates. The transfer workspace no longer treats uploaded files or manager decisions as browser-only state when running outside preview mode.

## Verified controls

- Transfer cases are loaded from the authenticated tenant-scoped commercial API.
- PDF, PNG, JPG, and JPEG files are limited to 25 MB and uploaded through a 15-minute presigned object-storage URL.
- The API confirms object existence and exact declared size before changing a document to `UPLOADED`.
- Uploading or replacing a document clears prior reviewer metadata and returns the item to review.
- Sales agents, sales managers, and administrators may upload; only sales managers and administrators may verify or reject.
- Case readiness is recalculated from persisted document decisions.
- Final manager approval remains blocked until all applicable documents are verified.
- Government transmission remains deliberately deferred and disabled pending an authority agreement.

## Executed gates

| Gate | Result |
| --- | --- |
| Prisma schema validation with local environment | PASS |
| Migration deployment to local UAT PostgreSQL | PASS |
| API TypeScript | PASS |
| Web TypeScript | PASS |
| API security suite | PASS — 14/14 |
| Commercial workflow contract | PASS — 10/10 |
| Full production build | PASS |
| KAAF generation/check/validators | PASS |

## Deferred by decision

- Production SMS-provider integration.
- Government title-transfer submission.

## Follow-on completed in the same hardening cycle

- The production promotional project library now lists tenant/project-scoped stored assets.
- Administrators can upload PDF, PNG, JPG, JPEG, and PPTX assets up to 100 MB through presigned object-storage URLs.
- Object existence and size are confirmed before publication; sales users receive short-lived download links.
- Customer dispatches now use persisted project, customer, and media identifiers and create governed dispatch records.

## Remaining product work

- Execute authenticated browser UAT for the new object-storage upload using the target deployment environment.
- Execute role-specific production UAT with sales-agent, sales-manager, and administrator accounts.

## Live-UAT correction

The first live-browser pass identified that the main sales-pipeline cards and customer ledger still used preview fixtures in the authenticated production page. This was corrected immediately: production now loads permission-scoped leads from the API, calculates the visible KPIs from those records, advances stages through the governed lead-status endpoint, and routes new-customer creation to the persisted sales-operations form. Preview fixtures remain available only in preview mode.

## Production verification — 2026-08-31

Authenticated browser verification was executed against `https://r4c.kynox.io` with the administrator identity. The deployed runtime is healthy enough to authenticate and read tenant-scoped projects, users, inventory, and the persisted Lead pipeline, but it does **not** match the release candidate on `codex/restore-approved-product`.

| Check | Production result |
| --- | --- |
| Administrator authentication | PASS |
| Projects and user-directory routes | PASS |
| Persisted Lead and activity retrieval | PASS |
| English/Arabic locale switch | PASS with residual mixed-language record and role labels |
| Customer portal `/explore` | FAIL — production returns 404 |
| Dedicated customer/unit/transfer/operations workspace views | FAIL — navigation query changes, but the deployed page renders the same legacy combined workspace |
| Persisted project media library | NOT PRESENT in the deployed UI |
| Persisted transfer-document upload/review/approval UI | NOT PRESENT in the deployed UI |

Release decision: **NO-GO for final acceptance of the current deployment.** The verified branch must be deployed as one atomic Web/API/migration release before the remaining role-specific and object-storage UAT can be completed. Existing production data must be preserved; no seed or reset operation is authorized as part of that deployment.

## Production release verification — 2026-08-31 (post-deployment)

Release PR #79 was approved, all required checks passed, and merge commit `f2605c0227ebfa1f38ba9b0b8c0e1f17cae179e8` was deployed. Hostinger Web auto-deployed from `main`. The API application was still connected to `codex/kynox-users-access-release`; that branch was safely fast-forwarded to the same merge commit so the existing API environment and database configuration were preserved.

| Live check | Result |
| --- | --- |
| Web deployment commit/branch | PASS — `f2605c02`, `main` |
| API health | PASS |
| Public portfolio API route | PASS — deployed and tenant-scoped |
| Customer portal `/explore` | PARTIAL — route and API work, but no project is visible because the only persisted project remains `DRAFT` |
| Authenticated administrator login | PASS |
| Persisted Lead/customer ledger | PASS |
| Project library, task/team, performance/alert views | PASS for loading and access |
| Project/unit, transfer-file, sales-operations views | PASS for loading and access |
| Project media upload | FAIL — browser upload reaches the storage step then returns `Failed to fetch`; production has S3 credentials and bucket but lacks `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, and `S3_REGION` variables |
| Project publication workflow | FAIL — administrator UI/API has no governed transition from `DRAFT` to `ACTIVE`, so the customer portal cannot publish an otherwise valid project |
| Hosting capacity | RISK — Hostinger reports that hosting resource limits have been reached |

Post-deployment decision: **NO-GO for customer-portal launch and document/media acceptance.** Internal authenticated read workflows are available, but final acceptance requires a governed project publication transition, a configured browser-reachable object-storage endpoint with CORS, a successful media/transfer upload retest, and resolution or measured acceptance of the Hostinger resource-limit warning.

## Storage and permission remediation retest — 2026-09-01

The first storage remediation attempt was invalid. The three endpoint/region values added to Hostinger were traced to the local MinIO development configuration, not to an independently verified Cloudflare R2 production service. The earlier conclusion that the missing-endpoint failure was resolved is therefore withdrawn. No production storage provider is currently qualified.

The upload attempt did expose a separate production-data drift: the existing `ADMIN` role predated `commercial:media:manage`. A forward-only migration was reviewed, merged in PR #80, applied to production without reset/reseed, and grants the permission to each tenant `ADMIN` role.

After explicit operator confirmation, only `S3_ENDPOINT`, `S3_PRESIGN_ENDPOINT`, and `S3_REGION` were removed from Hostinger. Access-key, secret-key, bucket, database, JWT, and unrelated application variables were left unchanged. Hostinger completed the resulting deployment of `6c4d50a2` from `codex/kynox-users-access-release`; it became `Current`, and repeated API health checks returned HTTP 200 with `status: ok`. The web login route also returned HTTP 200 and the protected commercial route redirected to authentication as expected.

Final media acceptance remains **NO-GO** until a real production object-storage service is provisioned, its endpoint/region/bucket/credentials and browser CORS contract are independently verified, and an authenticated upload/confirm/download/delete UAT passes. Placeholder credentials or local MinIO endpoints must not be treated as production evidence.
