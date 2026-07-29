# Vendored from Islamce/KAAF

This directory is a copy of the KAAF architecture tooling. **Do not edit it here.**

| | |
|---|---|
| Source | `Islamce/KAAF` — `scripts/architecture/` |
| Generator version | `0.7.0` |
| Vendored at commit | `d28018f72c6e71ef7930f1f7bdbc0f40906bde29` |
| Runtime | Python 3.11+, standard library only — no dependencies to install |

## Why vendored rather than installed

KAAF ships no package. Copying keeps this repository buildable with nothing but Python,
which is what makes the CI gates cheap enough to run on every pull request.

## What was deliberately left out

`tests/` and `run-tests.sh` — they test the tooling itself, which is verified in KAAF's own
CI. R4C consumes the tooling; it does not develop it.

Everything else is vendored, including `validators/validate-structure.sh`. That validator
distinguishes the *core* checks every KAAF repository must satisfy from the *framework*
checks that apply only to KAAF itself, and reads which set to run from `"kaafRole"` in
`kaaf.repo.json`. This repository declares no role, so it is treated as an adopter and the
framework checks are reported as skipped rather than silently omitted.

## Fixing a defect

Fix it in `Islamce/KAAF`, let its CI verify it, then re-vendor here and update this file.
A local patch will be silently overwritten by the next re-vendor and makes this copy
diverge from every other adopter's.

## Re-vendoring

```bash
# from a KAAF checkout, into this repository
for d in scanners generators utils validators; do
  mkdir -p scripts/architecture/$d
  cp <kaaf>/scripts/architecture/$d/*.py scripts/architecture/$d/
done
cp <kaaf>/scripts/architecture/{generate.py,generate.sh,aggregate.py,compat.py} scripts/architecture/
./scripts/architecture/generate.sh
```
