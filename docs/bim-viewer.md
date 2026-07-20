# BIM Geometry and Viewer

## Derived geometry

The IFC worker now creates a GLB artifact after semantic extraction. Each rendered node is named with its IFC GlobalId so browser selections resolve back to the authoritative BIM element record.

The worker uploads the GLB through a short-lived signed URL. The API verifies the stored size before transactionally recording the artifact. The source IFC remains the controlled document version and the GLB is disposable derived data.

## Viewer workflow

1. Request an authorized viewer manifest.
2. Load the five-minute signed GLB URL.
3. Load the model visual-state map.
4. Color each selectable GlobalId:
   - grey: unlinked
   - purple: linked without approved progress
   - red: 0–24%
   - amber: 25–74%
   - blue: 75–99%
   - green: 100%
5. Select geometry to inspect IFC metadata and properties.
6. Link the selected BIM element to a WBS node in the same project.
7. Submit physical progress against a WBS node.
8. A separate reviewer approves or rejects progress; only approved progress changes model colors.

## Governance

- geometry artifacts are tenant-scoped and accessed through signed URLs
- source and artifact storage hosts are allowlisted
- GLB output is bounded by the IFC file and element limits
- WBS progress uses submit/review separation
- concurrent reviews use compare-and-update protection
- progress submissions, decisions, BIM processing, and element links are audited
- the artifact can be regenerated from the immutable source IFC

## Current boundary

The viewer supports a single processed model. Model federation, revision comparison, clash workflows, section planes, measurements, annotations, and persisted camera viewpoints remain future controlled increments.
