# Buyer Sales Quotation MVP — Release Candidate Record

**Release candidate:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`

**Review branch:** `feat/commercial-command-center-hardening`  
**Pull request:** [#74](https://github.com/Islamce/R4C/pull/74)  
**Release state:** **READY FOR FOUNDER REVIEW — AWAITING G9 AUTHORIZATION**

## Candidate Scope

This candidate delivers a governed buyer sales-quotation MVP. Staff creation is lead-context-first and uses commercial API lead and payment-plan contracts in normal sessions. Buyer actions resolve an opaque token and record an acceptance, decline, or clarification request under server-side lifecycle and tenant controls. Acceptance is explicitly non-reserving. The staff and buyer experiences label the available artifact as a controlled HTML-document preview rather than a PDF.

| Included in candidate | Excluded from candidate |
|---|---|
| API-backed staff lead context and eligible payment-plan selection | Production deployment or merge without G9 |
| Quotation draft/review/approval/withdrawal/revision service surface | `prisma db push`, unapproved migration, or any production database mutation |
| Opaque token resolution and recorded buyer decision | Automatic unit hold or reservation from acceptance |
| Negative buyer-token, concurrency, terminal-state, and comment-rule tests | Live email, SMS, push, or customer delivery |
| Bilingual English/Arabic responsive evidence | PDF generation claim, buyer Flutter app, or procurement RFQ workflow |
| CI seed-permission correction and WBS spreadsheet dependency hardening | Hostinger, Neon, Upstash, or R2 configuration changes |

## Exact-SHA Qualification

The following gates were run from a clean worktree at the candidate SHA.

| Gate | Result | Notes |
|---|---:|---|
| API TypeScript check | Pass | `pnpm --filter @r4c/api typecheck` |
| Web TypeScript check | Pass | `pnpm --filter @r4c/web typecheck` |
| Buyer quotation focused suite | Pass — 10/10 | Lifecycle, token, authorization, isolation, and no-reservation checks |
| Commercial workflow contract suite | Pass — 4/4 | Session authorization, i18n/RTL, and bounded proxy checks |
| WBS import service suite | Pass — 5/5 | Preview, ordering, integrity, and tenant-scoping checks |
| Seed/API end-to-end suite | Pass — 1/1 | Guardrails, idempotence, persisted manager quotation permission, real API login |
| Disposable migration rehearsal | Pass | All seven source migrations applied; status reported up to date in isolated local PostgreSQL |
| Production dependency audit | Pass | `pnpm audit --prod --audit-level high`: no known vulnerabilities |
| Production build | Pass | Nest, Next, and static asset build completed |
| Generated architecture context | Pass | `scripts/architecture/generate.py --check` completed after regeneration |
| Working-tree integrity | Pass | `git diff --check`; clean worktree |

The build emits existing Autoprefixer compatibility warnings in `apps/web/app/cost-control.css` for `start` and `end` values. These warnings are unrelated to the quotation candidate, did not fail compilation, and remain recorded rather than silently changed outside the requested scope.

## CI Remediation Record

PR #74’s prior checks ran against an earlier head SHA (`888004fe17ca92acbaec73537db78fe2dc3cef7a`). The seed-dependent workflow failures shared one root cause: the `SALES_MANAGER` role definition included `commercial:quotation:read-all`, but the seed’s decorator-derived permission universe did not persist that explicit role permission before linking it. The candidate persists the union of source-derived and configured commercial permissions and adds an end-to-end assertion for that manager permission.

The prior KAAF context check reported generated `.ai` artifacts as stale. They were regenerated and checked. The prior supply-chain job reported high-severity SheetJS `xlsx` vulnerabilities. The browser WBS flow now uses Papa Parse for CSV, `read-excel-file/browser` for XLSX input, and a committed static XLSX template; the production audit is now clean.

> PR #74 was re-run on this exact candidate SHA after the remediation commits. It completed with **12 successful checks**, no failures or pending checks, and one intentionally skipped announce check. The resolved checks include KAAF generated-context verification, seed verification, supply-chain verification, CI validation, auth-session verification, commercial workspace regressions, and the Phase 7 deployment verification workflow.

## Deployment Gate

This record is not deployment authorization. Provider-console verification and authenticated non-production UAT remain outstanding, as documented in `uat-report.md` and `shared-hosting-compatibility.md`. The only permissible next action is an explicit G9 Founder decision for the exact candidate SHA and a named environment.

## References

[1]: https://github.com/Islamce/R4C/pull/74
[2]: https://r4c.kynox.io/api/health
[3]: https://r4c-api.kynox.io/api/v1/health/ready
