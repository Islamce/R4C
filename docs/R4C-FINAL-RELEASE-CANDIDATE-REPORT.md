# R4C Release-Candidate Qualification Report

**Qualification date:** 23 August 2026  
**Product:** R4C — Real Estate Delivery Control  
**Repository:** `Islamce/R4C`  
**Branch:** `master`  
**Candidate revision:** `cce16216e5b835959300de4d3537a10429320117`  
**Runtime classification:** synthetic-data-only disposable qualification

## Decision

> **CONDITIONAL GO for the local synthetic release candidate; NO-GO for production deployment.**

The R4C authoritative full-stack candidate is qualified for continued release-candidate review on the disposable PostgreSQL/Redis runtime. The frozen responsive frontend communicates with the canonical NestJS API, Prisma schema, tenant-scoped JWT/RBAC enforcement, and Commercial/CRM domain services on the tested positive and negative paths. The release is not a production deployment decision: no production deployment, production database mutation, live provider activation, real customer communication, governmental transaction, banking transaction, or authenticated populated-state production UAT was performed.

## Verified capability

The full-stack tree at `/home/ubuntu/R4C` was assembled as the authoritative R4C product from the committed API workspace, frozen web experience, and canonical CRM deltas. The API migration chain was applied to a fresh disposable PostgreSQL database, with Redis available to the runtime. The actual synthetic UAT journey passed **29/29** checks and the actual Commercial journey passed **23/23** checks. These covered tenant-bound authentication, Contacts, Opportunities, Leads, Activities, Tasks, holds, reservations, lifecycle behavior, duplicate/invalid paths, exact SAR money handling, and BigInt-safe Opportunity responses.

The actual API negative security matrix passed **17/17** checks. It verified Administrator, Sales Manager, and Sales Agent login; tenant resolution failure; unauthenticated CRM denial; role-specific CRM boundaries; Agent denial of project creation; safe malformed Opportunity denial; refresh-token rotation; old-token reuse rejection; logout revocation; and post-logout refresh rejection. The Sales Manager and Sales Agent receiving `403 Insufficient permissions` on the Administrator-scoped Contacts collection is recorded as an expected authorization boundary, not a product failure.

The database backup/restore gate passed. A PostgreSQL custom-format backup of the disposable source was restored into a clean disposable database. The source and restored public-schema hashes matched, and the counts for Tenant, User, Contact, Opportunity, Lead, Reservation, and AuditEvent records matched. The temporary restore database and dump artifact were removed after verification.

## Evidence matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Actual CRM/API journey | PASS, 29/29 | [`actual-api-qualification.json`](../evidence/fullstack-qualification/actual-api-qualification.json) |
| Commercial journey | PASS, 23/23 | [`commercial-api-qualification.json`](../evidence/fullstack-qualification/commercial-api-qualification.json) |
| API security/RBAC/session matrix | PASS, 17/17 | [`security-matrix.json`](../evidence/fullstack-qualification/security-matrix.json) |
| Security contract suite | PASS | [`api-security-suite-2026-08-23.log`](../evidence/fullstack-qualification/api-security-suite-2026-08-23.log) |
| PostgreSQL backup/restore | PASS; schema and counts equal | [`backup-restore.json`](../evidence/fullstack-qualification/backup-restore.json) |
| Responsive visual closure | PASS for accepted English/Arabic Sales surface | [`RESPONSIVE-EVIDENCE-MANIFEST.md`](../evidence/responsive-closure/RESPONSIVE-EVIDENCE-MANIFEST.md) |
| Portfolio isolation/reconciliation | PASS | R4C reconciliation and isolation evidence under `docs/` and `evidence/` |

## Release-integrity checks

The candidate retains the frozen KYNOX-aligned Sales composition, intentional <=680px single-column mobile flow, compact mobile navigation, English/Arabic localization, LTR/RTL handling, contextual drawers, reservation authority, and tenant-scoped authorization. The proven Opportunity BigInt serialization defect was corrected at the API entry point without changing the domain contract. Login status convention `201` was preserved and reflected only in the temporary qualification harness.

The stale broad journey assertion for `/api/projects` is **retired from the accepted R4C qualification surface**. It targets a legacy web harness contract, while the authoritative API exposes `/api/v1/projects` and the accepted product journey is `/projects` plus `/commercial` and `/sales`. The stale assertion remains historical evidence in `evidence/final-closure/` and is not presented as a failing R4C product capability.

## Known warnings and remaining gates

The working tree contains the assembled R4C candidate and generated qualification artifacts; the exact candidate revision above is the source identity used for this report. A final checkpoint must be created after this report and the updated ledger are reviewed. Production publication remains outside this task and must be initiated only by the authorized owner through the project management flow.

The following were intentionally not performed: production deployment; production data changes; independent external penetration testing; live Meta or LinkedIn activation; real email delivery; real governmental, identity, bank, escrow, payment, or settlement operations; and authenticated populated-state UAT against a deployed environment. These are release-boundary items, not silently assumed to pass.

## Rollback and recovery

For source rollback, use the R4C checkpoint/version history and restore the last known-good checkpoint; do not rewrite history or use a destructive reset. For data recovery, retain the approved PostgreSQL backup procedure and restore into a clean disposable database first, then verify schema and record-count parity before any authorized environment recovery. The qualification restore was disposable and did not modify the source database.

## Authorized next action

Create the final checkpoint for this handoff. If the owner accepts the stated synthetic RC boundary, proceed to the separately authorized deployment/UAT gate. Do not treat this report as authorization to publish or to connect live customer, government, bank, social, or payment providers.
