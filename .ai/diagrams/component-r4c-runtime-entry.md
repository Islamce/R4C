<!-- KAAF-GENERATED — do not edit by hand. Regenerate with scripts/architecture/generate.sh. -->

# Component — r4c-runtime-entry (C4 L3)

`r4c-runtime-entry` at `.` — confidence `verified`. 2 declared public entry point(s), 1 dependency(ies), 0 dependent(s).

```mermaid
graph TB
  subgraph r4c_runtime_entry_box["r4c-runtime-entry"]
    ep_hostinger_web_entry_cjs["hostinger-web-entry.cjs"]
    ep_package_json["package.json"]
  end
  r4c_web["r4c-web<br/>apps/web<br/>verified"]
  r4c_runtime_entry_box --> r4c_web
```

**Reading this diagram**

- Solid arrow: a dependency declared in a `kaaf.module.json` manifest.
- Dotted arrow: a real import discovered in the source that no manifest declares — see `.ai/drift.json`.
- Node outline reflects confidence: solid = `verified`, dashed = `documented` or `derived`.
<!-- kaaf:bodyDigest=aebdd19d277bb0bc153abb3eeb5bd308e26bff932fab2f6c44b930808ba9c5a3 -->
