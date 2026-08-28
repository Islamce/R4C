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

## Remaining product work

- Replace the promotional project library's demonstration assets with a fully API-backed upload/list/download experience.
- Execute authenticated browser UAT for the new object-storage upload using the target deployment environment.
- Execute role-specific production UAT with sales-agent, sales-manager, and administrator accounts.
