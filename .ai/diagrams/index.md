<!-- KAAF-GENERATED — do not edit by hand. Regenerate with scripts/architecture/generate.sh. -->

# Generated diagrams

Generated from the same facts as `../architecture.json`. There is no separate
diagram source to keep in step — a module boundary change appears here in the
same commit that makes it.

| Diagram | Level |
|---|---|
| [component-r4c-api.md](component-r4c-api.md) | Component (L3) |
| [component-r4c-bim-worker.md](component-r4c-bim-worker.md) | Component (L3) |
| [component-r4c-contracts.md](component-r4c-contracts.md) | Component (L3) |
| [component-r4c-kaaf-tooling.md](component-r4c-kaaf-tooling.md) | Component (L3) |
| [component-r4c-scripts.md](component-r4c-scripts.md) | Component (L3) |
| [component-r4c-web.md](component-r4c-web.md) | Component (L3) |
| [component-root.md](component-root.md) | Component (L3) |
| [container.md](container.md) | Container (L2) |
| [context.md](context.md) | Context (L1) |

Diagrams are split above 20 nodes rather than shrunk
(docs/kaaf/STANDARDS.md §5). Code-level (L4) diagrams are generated on demand and
never committed.

**Reading this diagram**

- Solid arrow: a dependency declared in a `kaaf.module.json` manifest.
- Dotted arrow: a real import discovered in the source that no manifest declares — see `.ai/drift.json`.
- Node outline reflects confidence: solid = `verified`, dashed = `documented` or `derived`.
<!-- kaaf:bodyDigest=26af51c55a6b1cee370599bd57f16b949569fb382e5652ca0dbffb1a4b44297d -->
