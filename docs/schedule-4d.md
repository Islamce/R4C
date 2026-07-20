# Schedule and 4D Control

## Controlled schedule revisions

A project schedule is an immutable revision containing dated activities, activity-to-WBS mappings, and typed dependencies. Draft revisions may be created and checked without changing the live project plan.

Publishing is an explicit audited action. The project stores one active schedule pointer; publishing a draft supersedes the prior published revision in the same serializable transaction.

## Schedule API

- `GET /projects/:projectId/schedules` — revision register
- `GET /projects/:projectId/schedules/active` — active revision and network
- `POST /projects/:projectId/schedules` — create a validated draft
- `POST /projects/:projectId/schedules/:scheduleId/publish` — publish a draft
- `GET /bim-models/:bimModelId/4d-state?date=YYYY-MM-DD` — date-driven element state

Schedule creation rejects:

- duplicate activity identifiers
- activities linked outside the project WBS
- finish dates earlier than start dates
- missing or self-referencing dependency endpoints
- duplicate dependencies
- cyclic dependency networks

The current import boundary is normalized JSON. Primavera P6 and Microsoft Project adapters remain deferred integrations; they should translate into this governed contract rather than write schedule tables directly.

## 4D state

The active schedule supplies planned dates through WBS mappings. BIM elements inherit their schedule windows through existing BIM-to-WBS links.

For any playback date the API returns:

- planned state: unscheduled, future, active, or planned complete
- earliest planned start and latest planned finish
- time-phased expected progress
- latest approved actual WBS progress
- actual-minus-expected variance
- schedule-level counts for active, complete, and behind elements

The browser control room provides progress and 4D modes. Future elements are ghosted, active work is amber, work more than ten percentage points behind is red, planned-complete work is blue, and actual-complete work is green.

## Governance

- all reads and writes are tenant- and project-scoped
- schedule creation requires `schedule:create`
- publishing requires `schedule:publish`
- 4D viewing reuses `bim:read`
- schedule creation and publishing emit audit events
- only approved progress is treated as actual performance
- historical schedule revisions remain available for audit and later comparison
