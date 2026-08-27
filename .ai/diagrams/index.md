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
| [component-r4c-runtime-entry.md](component-r4c-runtime-entry.md) | Component (L3) |
| [component-r4c-scripts.md](component-r4c-scripts.md) | Component (L3) |
| [component-r4c-web.md](component-r4c-web.md) | Component (L3) |
| [container.md](container.md) | Container (L2) |
| [context.md](context.md) | Context (L1) |

Diagrams are split above 20 nodes rather than shrunk
(docs/kaaf/STANDARDS.md §5). Code-level (L4) diagrams are generated on demand and
never committed.

**Reading this diagram**

- Solid arrow: a dependency declared in a `kaaf.module.json` manifest.
- Dotted arrow: a real import discovered in the source that no manifest declares — see `.ai/drift.json`.
- Node outline reflects confidence: solid = `verified`, dashed = `documented` or `derived`.
<!-- kaaf:bodyDigest=cefca318451957d3a60af61fccf92607a18a215f5beef6897724e4e7b9b1f3da -->
