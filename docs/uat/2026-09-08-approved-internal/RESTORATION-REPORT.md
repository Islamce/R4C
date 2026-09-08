# Approved R4C internal design restoration — 2026-09-08

## Acceptance source

The source of truth is the repository's previously approved capture:
`docs/uat/2026-09-01/production-interface-audit/02-approved-design-preview.png`,
introduced with commit `628755b` (`fix(web): route navigation to approved commercial interface`).

## What was wrong

PR #90 replaced the compact dark KYNOX workspace with a wide desktop rail and a
partially light commercial canvas. Although technically healthy, that was not the
agreed interface. Production capture `01-rejected-production.png` records the rejected
state.

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

1. `01-rejected-production.png` — authenticated production after PR #90; rejected.
2. `02-restored-approved-preview.png` — restored candidate at the same audit viewport.
3. `../2026-09-01/production-interface-audit/02-approved-design-preview.png` — approved
   reference used for direct comparison.

The restored candidate and approved reference have the same shell proportions,
blueprint-dark surface, information hierarchy, primary rail, five commercial dashboard
tabs, sales command bar, pipeline sub-navigation, metrics, and filters. Any displayed
records in the development-only preview remain fictional fixtures; production continues
to use the live tenant's own data.

## Verification

- Commercial workflow contract: 12/12 passing.
- Web TypeScript check: passing.
- Optimized Next.js production build: passing.
- Generated architecture context: current.
