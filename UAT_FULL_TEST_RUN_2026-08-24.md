# R4C Full UAT Test Run

Run date: 2026-08-24  
Timezone: Asia/Riyadh  
Scope: API, authenticated web application, commercial sales workspace, inventory, reservations, project media, team tasks, performance, title transfer, security, data, builds, and architecture gates.

## Executive verdict

**Conditional pass — 54 checks passed, 1 product/test-contract failure, 5 credential-gated suites blocked, and 1 generated-architecture gate blocked by workspace artifacts.**

The current commercial operational journeys pass browser UAT. The release should not be declared fully green until the stale BIM HTTP expectation is reconciled and credential-gated legacy web suites are rerun with their required UAT tenant and credentials.

## Result summary

| Area | Passed | Failed | Blocked | Result |
| --- | ---: | ---: | ---: | --- |
| Static validation and production builds | 5 | 0 | 0 | Passed |
| Automated API/web contracts and integrations | 39 | 1 | 0 | Conditional |
| Critical commercial browser journeys | 15 | 0 | 0 | Passed |
| Credential-gated legacy web journeys | 0 | 0 | 5 | Blocked |
| KAAF architecture gates | 2 | 1 | 0 | Conditional |

## Static validation and builds

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript — API, web, contracts | Passed | `pnpm typecheck` completed for all three workspaces. |
| Prisma schema validation | Passed | Schema valid after supplying `DIRECT_URL` from the active database URL for validation only. |
| Prisma client generation | Passed | Prisma Client 6.19.3 generated successfully. |
| NestJS API build | Passed | `pnpm --filter @r4c/api build`. |
| Next.js production build | Passed | 19/19 routes generated; `/commercial` and `/design-preview` built successfully. |

The root `pnpm build` wrapper is not Windows-compatible because it invokes slash-separated `node_modules/.bin` commands and Unix `cp`. The equivalent API, Prisma, and web build steps were executed separately and passed.

## Automated test suites

| Suite | Checks | Result |
| --- | ---: | --- |
| API contract/security tests | 13/13 | Passed |
| Commercial web contract | 4/4 | Passed |
| Password-reset web contract | 2/2 | Passed |
| BIM-disabled API bootstrap | 1/1 | Passed |
| C02 pricing, payment plans, media, tenant, audit | 8/8 | Passed |
| C03 customers, leads, consent, activities, audit | 2/2 | Passed |
| C04 holds, reservations, expiry, i18n | 1/1 | Passed |
| Seed guardrail and idempotency | 1/1 | Passed |
| Rate limiting | 1/1 | Passed |
| Refresh-session rotation, reuse, logout, tenant isolation | 1/1 | Passed |
| Full authenticated API HTTP integration | 5/6 | **Failed** |

### Failing automated check

`apps/api/test/http-e2e.mjs` expected `POST /api/v1/document-versions/:id/bim/process` to return 201, but the running API returned 404 because the BIM processing route is not registered while the Development Intelligence/BIM capability is frozen or disabled.

This conflicts with the dedicated BIM-disabled bootstrap suite, which passes and explicitly verifies startup without BIM credentials. The release decision must clarify whether the endpoint should remain disabled and the old HTTP test should be updated, or whether the endpoint must be restored.

## Browser UAT — commercial operational journeys

All checks below passed in the local in-app browser against `/design-preview`:

1. Add lead and update cumulative customer ledger.
2. Open complete customer dossier.
3. Create customer follow-up task.
4. Open project media repository.
5. Attach approved project media to an email and add it to the sending queue.
6. Assign a task to a sales-team member with due date and priority.
7. Display operational alerts and representative scores.
8. Display all five projects in the project/unit workspace.
9. Open the reservation modal from the unit layout.
10. Confirm a reservation, create an `RSV-*` reference, and change unit status to reserved.
11. Reconcile the title-transfer KPI with 34 source files and show the selected-project subset as `7 من أصل 34`.
12. Expose nine upload/replace controls for each customer transfer checklist.
13. Enforce the sales-manager/supervisor review gate.
14. Review an individual document and persist its reviewed state in the active preview session.
15. Open the deferred government-integration contract with connection testing disabled pending authority agreement.

## Blocked legacy web suites

These suites did not execute their product assertions because required UAT configuration was absent:

| Suite | Missing prerequisite |
| --- | --- |
| Frontend project journey | `JOURNEY_TENANT_ID` |
| Cost dashboard | `JOURNEY_TENANT_ID` |
| Progress workspace | `JOURNEY_TENANT_ID` |
| UX loop closers | `JOURNEY_UAT_ADMIN_PASSWORD` |
| Local BIM journey | `SEED_UAT_ADMIN_PASSWORD` |

No password or tenant identifier was invented or exposed during this run.

## Architecture and repository gates

- KAAF drift validation: passed with two non-blocking undeclared-module warnings (`hostinger-web-entry.cjs` and `.codex-tmp/r4c-operational-deck/build.mjs`).
- KAAF index validation: passed.
- Generated-context validation: failed because `.ai` is stale relative to current workspace inputs and the untracked operational-deck temporary source is being discovered as a module.

The `.ai` directory was not hand-edited. Regeneration should occur only after excluding or relocating the temporary deck source so generated architecture does not record a transient artifact as a product module.

## Release conditions

1. Decide the intended BIM route behavior and align `http-e2e.mjs` with the frozen/disabled BIM policy or restore the endpoint.
2. Provide the UAT tenant ID and UAT passwords through the approved secret channel, then rerun the five blocked web suites.
3. Remove or exclude the transient `.codex-tmp/r4c-operational-deck` source, regenerate `.ai`, and rerun KAAF validation.
4. For production email and document uploads, connect the verified UI queues to SMTP and persistent object storage; the preview currently proves interaction and governance behavior, not external delivery persistence.

## Final UAT status

**Conditional pass. Commercial operational UAT is green; the complete repository release gate remains open for the BIM expectation, credential-gated legacy suites, and generated architecture context.**
