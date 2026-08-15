<!-- KAAF-GENERATED — do not edit by hand. Regenerate with scripts/architecture/generate.sh. -->

# Containers (C4 L2)

Every module and the dependencies between them. 7 module(s).

```mermaid
graph LR
  r4c_api["r4c-api<br/>apps/api<br/>verified"]
  r4c_bim_worker["r4c-bim-worker<br/>apps/bim-worker<br/>verified"]
  r4c_contracts["r4c-contracts<br/>packages/contracts<br/>verified"]
  r4c_kaaf_tooling["r4c-kaaf-tooling<br/>scripts/architecture<br/>verified"]
  r4c_scripts["r4c-scripts<br/>scripts<br/>verified"]
  r4c_web["r4c-web<br/>apps/web<br/>verified"]
  root["root<br/>.<br/>derived"]
  r4c_web --> r4c_contracts
  style r4c_api stroke-width:2px
  style r4c_bim_worker stroke-width:2px
  style r4c_contracts stroke-width:2px
  style r4c_kaaf_tooling stroke-width:2px
  style r4c_scripts stroke-width:2px
  style r4c_web stroke-width:2px
  style root stroke-dasharray:2 3
```

**Reading this diagram**

- Solid arrow: a dependency declared in a `kaaf.module.json` manifest.
- Dotted arrow: a real import discovered in the source that no manifest declares — see `.ai/drift.json`.
- Node outline reflects confidence: solid = `verified`, dashed = `documented` or `derived`.
<!-- kaaf:bodyDigest=ec8912b8839f50ed48cc56a07735d4c5e26a53f22beaaf261330309112630904 -->
