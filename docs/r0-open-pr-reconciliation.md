# R0 Open PR Reconciliation

**Date:** 2026-08-11

This register classifies open R4C pull requests against the Commercial Product Reset before any C01 feature work.

| PR | Title | Classification | Decision | Rationale |
|---|---|---|---|---|
| #44 | docs(recovery): isolate RC restore rehearsals | PLATFORM_ENABLER / DEVELOPMENT_MAINTENANCE | CARRY FORWARD INDEPENDENTLY | Recovery/runbook hardening only; no product capability, schema, dependency, or architecture expansion. Compatible with reset. Do not mix into R0 Product Reset PR. |
| #31 | docs: add durable AI agent project handoff | SUPERSEDED | CLOSE | Built from an older product baseline and records the development-control/BIM-first product state as the continuation frame. A new reset-aware handoff/governance baseline supersedes it. |

## Rules for any newly opened PR before C01

1. Product/code expansion in frozen Development Intelligence is blocked unless a documented freeze exception applies.
2. Security/runtime/recovery maintenance may remain independent and should not be bundled into the Product Reset.
3. Commercial feature work must not start until the R0 documentation PR is reviewed and merged and its C01 brief is the active scope authority.
4. Stale documentation that describes CRM/Sales as globally deferred or BIM/Development Control as the product identity must not be merged after the reset without reconciliation.

## Current decision

PR #44 is not a blocker to defining R0, but its final merge should still satisfy its own recovery/CI gates.

PR #31 is superseded by the reset because durable agent continuity must point to the new product definition, freeze policy, and active Commercial roadmap.
