# HSE field control

Phase 9 adds governed health, safety, and environment field control to R4C. The bounded scope covers permits to work, safety observations and incidents, investigations, corrective actions, document evidence, operational dashboards, and BIM safety state.

## Permit control

- Permit types cover hot work, confined space, excavation, lifting, electrical, work at height, and general controlled work.
- A permit is scoped to a project WBS node and can target a BIM element.
- The requester submits the permit; a different user reviews it.
- Only approved permits inside their validity window can be activated.
- Active permits can be suspended and reactivated.
- The requester cannot close their own permit.
- Risk assessment, controls, validity, evidence, actors, and timestamps remain auditable.

Lifecycle: `DRAFT → SUBMITTED → APPROVED → ACTIVE ⇄ SUSPENDED → CLOSED`.

A rejected review returns the permit to `DRAFT` with the review record preserved.

## Safety event control

Events are classified as hazards, observations, near misses, or incidents with low, medium, high, or critical severity.

- Critical events require immutable document-version evidence at reporting time.
- The reporter cannot investigate or close their own event.
- Incidents, near misses, high-severity events, and critical events require a root-cause investigation and at least one corrective action.
- Only the assigned owner can complete an action.
- The action completer cannot verify their own work.
- Rejected verification returns the action to `OPEN`.
- Every required action must be verified before event closure.

Lifecycle: `OPEN → UNDER_INVESTIGATION → ACTIONED → READY_FOR_CLOSURE → CLOSED`.

## BIM safety state

Direct element records take precedence. Where no direct record exists, safety events and permits flow from linked WBS nodes.

| State | Meaning |
| --- | --- |
| `CLEAR` | No open event and no active/suspended permit |
| `CONTROLLED` | Work is covered by an active or suspended permit and has no open event |
| `LOW` | At least one low-severity event |
| `MEDIUM` | At least one medium event and no higher severity |
| `HIGH` | At least one high event and no critical event |
| `CRITICAL` | At least one critical event |

Open events override permit coverage in the viewer.

## API surface

- `GET|POST /projects/:projectId/safety-permits`
- `POST /projects/:projectId/safety-permits/:permitId/submit`
- `POST /projects/:projectId/safety-permits/:permitId/review`
- `POST /projects/:projectId/safety-permits/:permitId/activate`
- `POST /projects/:projectId/safety-permits/:permitId/suspend`
- `POST /projects/:projectId/safety-permits/:permitId/close`
- `GET|POST /projects/:projectId/safety-events`
- `POST /projects/:projectId/safety-events/:eventId/investigate`
- `POST /projects/:projectId/safety-events/:eventId/actions`
- `POST /projects/:projectId/safety-actions/:actionId/complete`
- `POST /projects/:projectId/safety-actions/:actionId/verify`
- `POST /projects/:projectId/safety-events/:eventId/close`
- `GET /projects/:projectId/hse-dashboard`
- `GET /bim-models/:bimModelId/safety-state`

## Permissions

Provision these permission codes:

- `hse:read`
- `hse:permit:create`
- `hse:permit:submit`
- `hse:permit:review`
- `hse:permit:activate`
- `hse:permit:close`
- `hse:event:report`
- `hse:investigate`
- `hse:action:manage`
- `hse:verify`

## Rollout sequence

1. Apply the Phase 9 Prisma migration before enabling HSE endpoints.
2. Provision least-privilege HSE roles and the permission codes above.
3. Assign requester, reviewer, permit authority, investigator, action owner, verifier, and closer duties.
4. Configure document categories for risk assessments and field evidence.
5. Exercise a permit activation/suspension/closure pilot.
6. Exercise critical-event reporting, investigation, action rejection/rework, verification, and closure.
7. Reconcile dashboard totals and BIM safety coloring before operational use.
