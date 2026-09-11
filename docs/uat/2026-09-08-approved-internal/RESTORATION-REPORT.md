# Approved R4C internal design restoration — 2026-09-08

## Acceptance source

This historical report is superseded by the operator's latest near-accepted references:
`docs/design-source/near-accepted-2026-09-08/01-opportunity-detail.jpg` and
`docs/design-source/near-accepted-2026-09-08/02-opportunities-worklist.jpg`.
Those two files are now the only visual implementation targets.

## What was wrong

PR #90 replaced the compact dark KYNOX workspace with a wide desktop rail and a
partially light commercial canvas. Although technically healthy, that was not the
agreed interface. The former rejected-state capture is no longer retained as an active
design reference.

## Restoration

- Reverted the PR #90 shell and color-direction changes.
- Restored the exact approved `AppShell` structure from commit `628755b`:
  Developments, Commercial Sales, Users & Access, Progress, and Cost reports in the
  primary rail, with the compact Portfolio/Customers/Units/Transfer/Operations tool rail.
- Restored the approved commercial header and five dashboard tabs while retaining the
  newer governed worklist, saved-view, quick-action, and live-data behavior.
- Restored Kanban as the initial pipeline presentation so the first authenticated view
  follows the approved card-based workflow; table and split views remain available.
- Restored the compact 112 px desktop rail and the approved blueprint-dark workspace.
- Updated the commercial workflow contract so the approved two-level navigation and
  dashboard tab structure are required behavior.

## Evidence

The earlier comparison screenshots were removed from the active repository to prevent
accidental fallback to a rejected or superseded direction. This markdown remains for
historical rationale; use the canonical references above for implementation.

## Verification

- Commercial workflow contract: 12/12 passing.
- Web TypeScript check: passing.
- Optimized Next.js production build: passing.
- Generated architecture context: current.
