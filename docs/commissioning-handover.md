# Commissioning and handover control

Phase 10 adds governed commissioning and handover control to R4C. The bounded scope covers immutable commissioning plans, field tests, independent test review, turnover dossier requirements, document fulfillment, handover review, readiness analytics, and BIM turnover state.

## Commissioning control

- Commissioning plans are immutable revisions with a single active project plan.
- Checkpoints define system, acceptance criteria, optional WBS/IFC scope, hold-point status, and sequence.
- Tests can only be scheduled from the active plan.
- Only the assigned performer can submit readings, notes, and immutable document-version evidence.
- The performer cannot review their own test.
- Failed and conditional tests cannot be accepted.
- Every create, publish, schedule, submit, and review transition is audited.

Test lifecycle: `SCHEDULED → SUBMITTED → ACCEPTED | REJECTED`.

## Handover dossiers

- A handover package is scoped to a project WBS node and can target a BIM element.
- Each package has explicit document requirements with code, title, and document type.
- Requirements can only be fulfilled while the package is draft or returned.
- The package creator submits the dossier and cannot review it.
- Returned reviews identify the rejected requirements that must be replaced.
- Acceptance requires every requirement to be provided and an accepted commissioning `PASS` for the same BIM element or WBS scope.

Package lifecycle: `DRAFT → SUBMITTED → ACCEPTED | RETURNED`.

A returned package can be corrected and resubmitted without overwriting its review history or document-version references.

## BIM turnover state

Direct BIM test/package records take precedence. Where no direct record exists, the latest commissioning test and package state flow from linked WBS nodes.

| State | Meaning |
| --- | --- |
| `NOT_STARTED` | No applicable commissioning test |
| `COMMISSIONING` | Latest test is scheduled or submitted |
| `BLOCKED` | Latest test failed, is conditional, or was rejected |
| `READY_FOR_HANDOVER` | Latest test is an accepted pass but no package is accepted |
| `HANDED_OVER` | Commissioning passed and a handover package is accepted |

## API surface

- `GET|POST /projects/:projectId/commissioning-plans`
- `GET /projects/:projectId/commissioning-plans/active`
- `POST /projects/:projectId/commissioning-plans/:planId/publish`
- `GET|POST /projects/:projectId/commissioning-tests`
- `POST /projects/:projectId/commissioning-tests/:testId/submit`
- `POST /projects/:projectId/commissioning-tests/:testId/review`
- `GET|POST /projects/:projectId/handover-packages`
- `POST /projects/:projectId/handover-packages/:packageId/requirements/:requirementId/provide`
- `POST /projects/:projectId/handover-packages/:packageId/submit`
- `POST /projects/:projectId/handover-packages/:packageId/review`
- `GET /projects/:projectId/turnover-dashboard`
- `GET /bim-models/:bimModelId/turnover-state`

## Permissions

Provision these permission codes:

- `turnover:read`
- `commissioning:plan:create`
- `commissioning:plan:publish`
- `commissioning:test:schedule`
- `commissioning:test:submit`
- `commissioning:test:review`
- `handover:create`
- `handover:fulfill`
- `handover:submit`
- `handover:review`

## Rollout sequence

1. Apply the Phase 10 Prisma migration before enabling turnover endpoints.
2. Provision least-privilege commissioning and handover roles.
3. Assign plan author, performer, test reviewer, dossier compiler, and handover reviewer duties.
4. Publish the first commissioning-plan revision.
5. Exercise accepted, rejected, and rescheduled test scenarios with evidence.
6. Exercise dossier return, requirement replacement, resubmission, and acceptance.
7. Reconcile dashboard totals and BIM turnover coloring before operational use.
