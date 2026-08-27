# R4C Final Cleanliness and Qualification Report

Date: 2026-08-25

Hardening branch: `codex/r4c-core-rc-hardening`

Core RC qualified source SHA: `3d3ec7245e6ab6a51bc9e2b5d9dd39bd3e52f13a`

Draft review: PR #77

## 1. Executive result

**PARTIALLY QUALIFIED.** The **R4C Core RC is clean and ready for review** at the SHA above. The complete requested product convergence is not finished because the PR #74 Quotation Extension has not yet been rebuilt on Core RC, contains a confirmed tenant-integrity migration defect, and still requires its sanctioned non-production PostgreSQL rehearsal.

No production deploy, restart, database change, migration, credential change, DNS change, VPS provisioning, protected-branch push, PR merge or PR closure was performed.

## 2. Final architecture summary

Core RC has seven KAAF-owned modules: NestJS API, Next.js web, BIM worker, shared contracts, scripts, vendored KAAF tooling and the shared-hosting runtime entry. Production `/commercial` uses the governed API-backed workspace. Synthetic commercial design data is development-only. Lead/Unit terminal transitions and consent withdrawal are server-owned and audited. Production configuration is explicit and fail closed.

## 3. Authoritative SHAs

| Line | SHA |
| --- | --- |
| Original `main` | `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af` |
| PR #74 | `1076118ddf5085b9a29ff00fa14ec76a15e2255c` |
| PR #75 | `36e0040b4c11bd25e6349459c1d95465f18348f8` |
| PR #76 | `35b28ff96e684e8c9f4a930fd9f18bfbd780cf04` |
| Hardening branch / Core RC | `3d3ec7245e6ab6a51bc9e2b5d9dd39bd3e52f13a` |
| Quotation Extension | Not yet created from Core RC |

## 4. Cleanup summary

Against PR #76, the branch changes 51 tracked files: 914 insertions and 838 deletions. It removes the 603-line VPS deployment guide, introduces one authoritative shared-hosting contract, separates build and migration execution, replaces shell-specific build copying with a portable Node script, patches the PostCSS advisory path, declares runtime ownership in KAAF, isolates synthetic preview code, fixes stale inventory response ordering, adopts PR #75 behavior and expands lifecycle/privacy tests. No broad framework modernization was performed.

## 5. Capability preservation

| Capability | Result |
| --- | --- |
| PR #76 commercial workspace, user directory, roles and permissions | PRESERVED |
| Auth/session, tenant isolation, seed guardrails and audit | PRESERVED; exact-head gates pass |
| Projects, progress, cost, BIM and wider API domains | PRESERVED; CI and phase journeys pass |
| Arabic/RTL commercial contracts | PRESERVED |
| PR #75 Lead WON/LOST Unit synchronization | ADOPTED and hardened |
| PR #75 consent withdrawal | ADOPTED and hardened |
| PR #74 quotation lifecycle/snapshots/buyer tokens | PRESERVED as source donor; not yet incorporated |

## 6. PR convergence

| Capability source | Final disposition |
| --- | --- |
| #76 | Core RC engineering base; preserve accepted progress |
| #75 lifecycle and consent | Incorporated cleanly; original PR remains independent/open |
| #74 quotation | Quotation Extension donor; source correction and DB rehearsal required |
| #74 Flutter preview/screenshots/audit utilities | Excluded experimental/evidence residue |
| #74 vendored KAAF tooling edit | Excluded; fix belongs upstream |

## 7. Test and quality matrix

| Gate | Result |
| --- | --- |
| Typecheck, API/web production builds | PASS locally and/or CI |
| API source/security/commercial tests | PASS |
| Lead/Unit lifecycle and consent tests | PASS |
| Auth session | PASS exact-head GitHub |
| Seed | PASS exact-head GitHub |
| Tenant/RBAC negative contracts | PASS within API/CI suites |
| KAAF architecture/contract/drift/generated evidence | PASS exact-head GitHub |
| Security and dependency scan | PASS exact-head GitHub |
| Phase 5, 6, 6.5 | PASS exact-head GitHub |
| Phase 7 isolated deployment rehearsal | PASS exact-head GitHub; not a production deployment |
| Core Prisma validation/migration state | PASS locally |
| Quotation source tests and migration rehearsal | BLOCKED pending corrected extension and sanctioned non-production DB |

## 8. Security result

`pnpm audit --prod` reports no known vulnerabilities and the exact-head Security workflow passes JavaScript/Python audits, Trivy HIGH/CRITICAL vulnerability/secret/misconfiguration scans, BIM image scan, and generates/uploads a CycloneDX SBOM. Auth/session, seed, tenant, permission, stale/concurrent Unit and consent negative paths pass. No advisory was suppressed.

## 9. Database result

The Core Prisma schema validates and its six existing migrations showed no pending change on the disposable verification database. Historical migrations were not rewritten. Static PR #74 review found missing composite tenant-bound foreign keys between quotation parents and child/token records. The exact clean-install and upgrade rehearsal is documented in `docs/quotation/non-production-migration-rehearsal.md`; production execution is prohibited.

## 10. Deployment contract

VPS/systemd guidance is removed from the authoritative source. Shared hosting is the declared target. Production has no localhost, `.local`, Docker service-DNS or default-secret fallback. Local/CI `.local` values remain intentionally scoped to tests and local development. Build and migration commands are separate. Actual provider/service compatibility remains external environment evidence.

## 11. Code cleanliness result

No unresolved HIGH/CRITICAL production dependency warning is known. Remaining reported items are:

- Quotation Extension source convergence, tenant-FK correction and non-production DB rehearsal.
- Campaign-import consent provenance: business/legal external gate.
- Bulk-import idempotency/progress/row-result improvements remain recorded technical debt and were not expanded during the feature freeze.
- Managed Redis, object storage, BIM processing, SMTP, backup/restore, monitoring and formal production UAT are external operational gates.
- Prisma's `package.json#prisma` deprecation warning remains; a Prisma 7 major modernization is intentionally outside this defect-focused hardening pass.
- `apps/web` aggregate `test` script remains informational; executable suites are explicit workflow commands and are green.

All retained localhost, `.local`, debug-output and fixed-password matches are confined to local development, CI/UAT fixtures or test diagnostics, not production defaults.

## 12. Quotation status

**IMPLEMENTED IN PR #74 — NOT YET CORE-RC-BASED — SOURCE CORRECTION AND NON-PRODUCTION DB REHEARSAL REQUIRED.** Buyer acceptance must remain unable to create a reservation, sale, invoice, payment or Lead WON automatically.

## 13. Remaining external gates

1. Sanctioned non-production PostgreSQL for corrected quotation clean-install and upgrade rehearsal.
2. Founder/reviewer decision for PR disposition and protected-branch merge.
3. Business/legal decision for campaign-import consent provenance.
4. Provider credentials/services for shared-hosting operational qualification, followed by formal UAT; none are needed to review Core RC source.

## 14. Recommended PR disposition

- Keep #77 draft until review of this evidence, then treat it as the Core RC candidate.
- Do not merge or close #74/#75/#76 automatically.
- After Core RC approval, create a clean quotation-extension branch from the approved Core RC, selectively port accepted #74 domain/API/web code, correct tenant constraints, run source/security suites, and execute the sanctioned non-production rehearsal.
- Once reviewers confirm #75 and #76 capabilities are preserved in the eventual approved release line, close/supersede those PRs through normal governance. Keep #74 open until its clean extension has equivalent evidence.
