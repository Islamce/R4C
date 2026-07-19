# BIM Processing Contract

## Controlled flow

1. An authorized user confirms an uploaded IFC document version.
2. The API creates or resets its BIM model and a durable processing-job record.
3. BullMQ queues the job with three exponential-backoff attempts.
4. The Node orchestrator produces a five-minute signed object URL.
5. The internal Python worker authenticates the request, validates the source host and streams the IFC to a bounded temporary file.
6. IfcOpenShell validates IFC2X3/IFC4, extracts the spatial hierarchy, elements, types and bounded property sets.
7. The orchestrator replaces model extraction data transactionally and marks the model ready.
8. Authorized users link verified model elements to WBS nodes from the same tenant and project.

## State model

Model: PENDING → QUEUED → PROCESSING → READY or FAILED.

Job: QUEUED → RUNNING → SUCCEEDED; retryable failures become FAILED and the final failed attempt becomes DEAD_LETTER.

## Safety controls

- worker endpoint requires an internal bearer token
- worker only downloads from configured object-storage hosts
- redirects are disabled
- streamed file size and extracted element count are bounded
- temporary files are always removed
- worker error text is truncated before persistence
- duplicate GlobalIds and properties are ignored through database uniqueness
- processing is replace-on-success and safe to retry
- tenant and project boundaries are checked before WBS linkage

## Extracted data

- IFC schema and model name
- project/site/building/storey/space/zone hierarchy
- element GlobalId, IFC type, name, tag and predefined type
- up to 200 normalized properties per element
- optional element containment in a spatial node
- many-to-many BIM-element to WBS links with progress weight

Geometry conversion and browser rendering artifacts are the next controlled increment; this phase establishes the trustworthy semantic model they depend on.
