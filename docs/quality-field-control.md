# Field quality control

Phase 8 adds governed inspection and non-conformance control to R4C. It covers project inspection plans, field inspections, findings, corrective actions, independent verification, evidence, analytics, and BIM visibility.

## Control model

- Quality plans are immutable revisions. Publishing supersedes the previous plan and atomically changes the project's active-plan pointer.
- Checkpoints define inspection type, acceptance criteria, optional WBS/IFC scope, sequence, and hold-point status.
- Inspections can only be scheduled from the active plan.
- Only the assigned inspector can submit an inspection.
- The inspector cannot review their own submission.
- Failed or conditional inspections require a linked finding before acceptance.
- NCR and punch findings require corrective action. The assigned user completes an action and a different user verifies it.
- The finding raiser cannot close their own finding.
- Evidence references immutable project document versions.
- Every transition creates an append-only audit event.

## Finding lifecycle

`OPEN → ACTIONED → READY_FOR_VERIFICATION → CLOSED`

A rejected verification returns the action to `OPEN` and the finding to `ACTIONED`. Observations may be closed independently when no corrective action is required. Closed and void findings are excluded from active BIM quality state.

## BIM quality state

Direct BIM-element findings take precedence. When no direct finding exists, open WBS findings flow to linked elements.

| State | Meaning |
| --- | --- |
| `CLEAR` | No open direct or WBS fallback finding |
| `MINOR` | At least one minor finding |
| `MAJOR` | At least one major finding and no critical finding |
| `CRITICAL` | At least one critical finding |

The viewer uses green for clear, blue for minor, amber for major, and red for critical.

## API surface

- `GET|POST /projects/:projectId/quality-plans`
- `GET /projects/:projectId/quality-plans/active`
- `POST /projects/:projectId/quality-plans/:planId/publish`
- `GET|POST /projects/:projectId/quality-inspections`
- `POST /projects/:projectId/quality-inspections/:inspectionId/submit`
- `POST /projects/:projectId/quality-inspections/:inspectionId/review`
- `GET|POST /projects/:projectId/quality-findings`
- `POST /projects/:projectId/quality-findings/:findingId/actions`
- `POST /projects/:projectId/quality-actions/:actionId/complete`
- `POST /projects/:projectId/quality-actions/:actionId/verify`
- `POST /projects/:projectId/quality-findings/:findingId/close`
- `GET /projects/:projectId/quality-dashboard`
- `GET /bim-models/:bimModelId/quality-state`

## Permissions

Provision these permission codes before rollout:

- `quality:read`
- `quality:plan:create`
- `quality:plan:publish`
- `quality:inspection:schedule`
- `quality:inspection:submit`
- `quality:inspection:review`
- `quality:finding:create`
- `quality:action:manage`
- `quality:verify`

## Rollout sequence

1. Apply the Phase 8 Prisma migration before enabling quality endpoints.
2. Provision the permission codes and least-privilege quality roles.
3. Map project members to inspector, reviewer, action owner, and verifier duties.
4. Create and publish the first inspection-plan revision.
5. Schedule a controlled pilot inspection with document-version evidence.
6. Exercise failed inspection, finding, corrective action, verification, and closure end-to-end.
7. Reconcile dashboard counts and BIM coloring before operational use.
