# R0 Open PR Reconciliation

**Date:** 2026-08-12
**Enumeration:** GitHub open-PR query on 2026-08-12; do not treat this as a permanent fixed list.

This register classifies open R4C pull requests against the Commercial Product Reset before any C01 feature work.

| PR | Title | Classification | Decision | Rationale |
|---|---|---|---|---|
| #47 | R0: reset R4C to commercial-first product direction | COMMERCIAL GOVERNANCE | BLOCKS C01 / MERGE AFTER GATES | Product Reset authority and R0.1 addendum live here. Documentation only. C01 must start from validated `main` after this PR is approved and merged. Current GitHub state before the R0.1 push: open and blocked; generated context was refreshed locally and still requires CI confirmation on the new head. |
| #46 | build(deps): bump pnpm/action-setup 6.0.9 → 6.0.10 | SAFE MAINTENANCE | DOES NOT BLOCK C01 / REVIEW AND CARRY FORWARD INDEPENDENTLY | Patch workflow-action update across eight workflows. Its recorded checks passed. Keep independent of R0 and confirm current workflow provenance before merge. |
| #45 | build(deps): Python security and maintenance group | DEVELOPMENT_MAINTENANCE | FREEZE / NEEDS SEPARATE REVIEW / DOES NOT BLOCK C01 | Includes the `trimesh` 5.0.0 major update in the frozen BIM worker. Requires BIM regression and compatibility review; do not bundle with the reset. |
| #44 | docs(recovery): isolate RC restore rehearsals | PLATFORM_ENABLER / DEVELOPMENT_MAINTENANCE | CARRY FORWARD INDEPENDENTLY / DOES NOT BLOCK C01 | Recovery/runbook hardening only; no product capability, schema, dependency, or architecture expansion. Compatible with reset but must pass its own recovery/CI gates. |
| #40 | build(deps): JavaScript security and maintenance group | CROSS-CUTTING MAJOR DEPENDENCIES | FREEZE / NEEDS SEPARATE REVIEW / DOES NOT BLOCK C01 | Changes 18 dependencies and crosses Prisma, Next.js, TypeScript, BullMQ and ioredis risk boundaries. Review migration generation/runtime, queue/Redis behavior and full UI/API regression separately. |
| #18 | build(deps): Python 3.12-slim → 3.14-slim | DEVELOPMENT RUNTIME | FREEZE / NEEDS SEPARATE REVIEW / DOES NOT BLOCK C01 | Major interpreter/base-image change for the frozen BIM worker. Requires IfcOpenShell/native-wheel, container and BIM regression proof. |

## Rules for any newly opened PR before C01

1. Product/code expansion in frozen Development Intelligence is blocked unless a documented freeze exception applies.
2. Security/runtime/recovery maintenance may remain independent and should not be bundled into the Product Reset.
3. Commercial feature work must not start until the R0 documentation PR is reviewed and merged and its C01 brief is the active scope authority.
4. Stale documentation that describes CRM/Sales as globally deferred or BIM/Development Control as the product identity must not be merged after the reset without reconciliation.

## Closed PR retained as historical context

PR #31 is already closed. It was superseded without merge because it described the pre-reset product baseline; it is not part of the current open-PR count.

## Current decision

PR #44 is not a blocker to defining R0, but its final merge should still satisfy its own recovery/CI gates.

PR #47 is the only open PR that blocks authorization to begin C01. The other open PRs require their own review but do not need to be merged into, or resolved by, the Product Reset.

The local 2026-08-12 investigation reproduced `KAAF-E006-generated-output-stale` and classified it as legitimate source-fingerprint staleness caused by newly added Markdown paths. The official generator refreshed 11 artifacts, changing only provenance/input digests; it did not add or reclassify a module or claim Commercial implementation. Generator freshness, drift, provenance and index validation pass locally. GitHub CI on the pushed head remains the merge-gate authority.

No PR was merged, closed, rebased or deployed by this reconciliation.
