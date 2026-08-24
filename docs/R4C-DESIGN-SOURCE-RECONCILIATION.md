# R4C design-source reconciliation

## Decision

The final product keeps the Manus Sales Command Center as the approved visual and information-architecture foundation, while retaining the recovered branch's stronger runtime, accessibility, responsive, and CRM-contract refinements. Neither branch was accepted wholesale.

## Source comparison

| Surface | Manus handoff | Recovered/refined branch | Final selection |
| --- | --- | --- | --- |
| Sales route and CRM client | Present | Present and qualified | Preserved |
| Command Center composition | Approved source | Faithful responsive implementation | Manus composition with refined implementation |
| Mobile layout | Basic `<=680px` handoff | Intentional one-column flow with bounded controls | Refined implementation |
| Contextual actions | Inline/basic implementation | Focus-managed drawers with Escape and Tab containment | Refined drawers |
| Arabic/RTL | Present | Extended copy and logical responsive behavior | Extended implementation |
| API/schema companion | Present | Present with qualification evidence | Preserved |
| BigInt API serialization | Absent in Manus delta | Present | Preserved |
| Locale route portability | POSIX-oriented test/path behavior | Windows-safe contract | Preserved |
| Commercial/Projects | Preserved by both | Responsive containment fixes included | Refined implementation |
| Design handoff provenance | Explicit branch and manifest | Recovery evidence and QA | Both recorded |

## Rejected regressions

- Removing the API BigInt JSON replacer.
- Replacing focus-managed action drawers with a permanent form wall.
- Removing mobile overflow containment and compact navigation refinements.
- Reducing the CRM UI contract suite from six checks to two.
- Replacing the Windows-safe test root resolver with a pathname concatenation.
- Deleting qualification evidence or recovered handoff documentation.

## Final product boundary

The production Sales route remains contract-backed. The development-only design preview uses deterministic synthetic data to make the approved state reviewable without authentication or a live API. Commercial, Projects, CRM schema/API support, tenant boundaries, reservation authority, and bilingual behavior remain intact. No production deployment was performed.
