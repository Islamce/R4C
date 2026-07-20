# Materials and procurement control

Phase 7 adds a construction-materials control slice to R4C. It deliberately stops short of a general warehouse-management system: the scope is project takeoff, procurement commitments, site receipts, issues, balances, readiness, and BIM visibility.

## Control model

- The tenant material master owns material identity, code, unit, and lifecycle state.
- Project material takeoffs are immutable revisions. Publishing a revision supersedes the previous active revision and moves the project pointer atomically.
- Takeoff lines can reference WBS nodes and BIM elements. BIM links take precedence; WBS links provide the fallback for model coloring.
- Procurement orders require an active project budget and matching currency.
- Every procurement line creates a 5D `COMMITMENT` ledger entry with an idempotent external reference.
- Receipts and issues are append-only inventory movements. Receipt quantity cannot exceed the ordered quantity; issues cannot drive a location below zero.
- Project stock is the sum of material movements, so the ledger remains auditable and replayable.

## Readiness states

| State | Meaning |
| --- | --- |
| `SHORTAGE` | Requirement is not covered by stock plus outstanding orders |
| `ORDERED` | Coverage exists through open procurement, but stock is not yet sufficient |
| `AVAILABLE` | Current project stock covers the requirement |
| `ISSUED` | Required quantity has been issued to the work |
| `NO_REQUIREMENT` | The BIM element has no active takeoff line or WBS fallback |

The BIM viewer exposes these states as a fourth coloring mode. Red highlights shortages, amber ordered material, blue available stock, green issued material, and grey elements without a requirement.

## API surface

- `GET|POST /materials`
- `GET|POST /projects/:projectId/material-takeoffs`
- `POST /projects/:projectId/material-takeoffs/:takeoffId/publish`
- `GET|POST /projects/:projectId/inventory-locations`
- `GET|POST /projects/:projectId/procurement-orders`
- `POST /projects/:projectId/procurement-orders/:orderId/lines/:lineId/receipts`
- `POST /projects/:projectId/material-issues`
- `GET /projects/:projectId/inventory-balances`
- `GET /projects/:projectId/material-readiness`
- `GET /bim-models/:modelId/material-state`

## Permissions

Provision these permission codes before rollout:

- `materials:read`
- `materials:master`
- `materials:takeoff:create`
- `materials:takeoff:publish`
- `inventory:manage`
- `procurement:read`
- `procurement:create`
- `inventory:receive`
- `inventory:issue`

## Rollout sequence

1. Apply the Prisma migration after Phase 6 is on `main`.
2. Provision permission codes and assign least-privilege roles.
3. Load and validate the tenant material master.
4. Create and publish a project takeoff revision.
5. Configure inventory locations.
6. Raise procurement orders, then record receipts and issues.
7. Reconcile readiness totals against the source takeoff and physical count before operational use.
