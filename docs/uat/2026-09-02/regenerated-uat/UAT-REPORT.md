# R4C Regenerated UAT — Canonical KYNOX Workspace

Date: 2026-09-02  
Candidate: `codex/unify-commercial-workspace` / PR #86  
Scope: release-candidate UI and automated persisted-workflow qualification. This is not a production acceptance because PR #86 is not merged or deployed.

## Verdict

**CONDITIONAL PASS — READY FOR INDEPENDENT REVIEW**

The candidate passes the available functional, visual, responsive, build, security and seeded CI gates. Production promotion remains blocked by the protected-branch independent approval requirement. Production-authenticated smoke/UAT must be repeated after deployment.

## Executed steps

| # | Workflow | Result | Evidence |
|---|---|---|---|
| 1 | Open Arabic KYNOX commercial workspace and inspect sales pipeline | PASS | `01-sales-pipeline.png`; complete Arabic labels, KYNOX theme, navigation and pipeline rendered with no browser errors. |
| 2 | Open executive overview and switch project context | PASS | `02-executive-overview.png`; project tabs and portfolio view responded. |
| 3 | Open project/unit control and inspect floor 12 with eight mapped units | PASS | `03-project-units.png`; inventory, plan image, eight hotspots and unit details rendered. |
| 4 | Select available unit A-1201 and open reservation | PASS | `04-reservation-dialog.png`; modal opened, focusable controls and Arabic labels rendered. |
| 5 | Complete a reservation using synthetic Saudi-format phone data | PASS | `05-reservation-confirmed.png`; confirmation message created and linked to A-1201. No real customer data was used. |
| 6 | Open title-transfer workspace | PASS | `06-transfer.png`; 34 active records reconcile with 14 ready + 20 pending; filtered table and readiness metrics rendered. |
| 7 | Open sales operations | PASS AFTER FIX | `07-operations.png`; initial rerun exposed white-on-white panel copy. Dark KYNOX panel/input overrides were added and the recapture has readable contrast. |
| 8 | Validate 390 × 844 mobile layout | PASS | `08-mobile.png`; fixed bottom navigation, document overflow `0`, sidebar bottom `0px`, no browser errors. |
| 9 | TypeScript validation | PASS | `pnpm --filter @r4c/web typecheck`. |
| 10 | Commercial workflow contracts | PASS | 11/11, including real project loading, real hold/reservation APIs, permissions, Arabic/English, mass import, transfers and media dispatch. |
| 11 | Production web build | PASS | Next.js production build generated all 22 routes successfully. |
| 12 | GitHub qualification matrix | PASS | PR #86: CI, authentication, cost, progress, UX, seed, security and KAAF checks all successful. |

## Role and workflow coverage

- ADMIN: navigation and project/user administration exposure verified by session-permission contracts.
- SALES_MANAGER: lead-all, reassignment, reservation confirmation, task management and transfer-review permission contracts verified in CI.
- SALES_AGENT: own leads, customer capture, activities, unit hold and document-upload permission contracts verified in CI.
- VIEWER: commercial read-only permission boundary remains enforced by server contracts.
- Full production persistence is backed by the API test matrix; the visual reservation exercised here is intentionally the development preview and does not mutate production.

## Issues found and corrected in this run

1. Local `.next` cache conflict after running build while development server was active. The invalid capture was rejected, the stale generated folder was moved to `.next-stale-uat-20260902`, and a clean server session was used.
2. Sales Operations preview contained insufficient contrast because legacy light `create-panel` styling leaked into the dark KYNOX suite. The candidate now applies KYNOX dark panel, label and input tokens; the corrected state is shown in `07-operations.png`.

## Remaining release gates

1. Independent approval of PR #86 — **BLOCKED by repository policy**, reviewer requested.
2. Merge and Hostinger deployment — not yet performed.
3. Post-deployment authenticated production smoke: login, live project list, available unit selection, temporary hold, manager confirmation and transfer review.
4. SMS verification and object-storage uploads remain separately deferred infrastructure integrations; they are not claimed as accepted here.

## Final acceptance state

- Release candidate: **PASS**.
- Production deployment: **NOT YET ACCEPTED**.
- Recommended action: approve PR #86, merge, deploy, then run the same authenticated production flow before GO.
