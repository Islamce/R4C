# AGENTS.md

Operating instructions for **every AI agent** working in this repository.

R4C follows the [Kynox AI Architecture Framework (KAAF)](https://github.com/Islamce/KAAF).
Governance and standards live in that repository; this file says what they mean here.

---

## 1. Read the generated context before you read source

```
.ai/ai-context.json  →  .ai/summary.md  →  .ai/modules/<id>.json  →  .ai/drift.json
```

These files are generated from this repository's `kaaf.module.json` manifests **and** its
real source tree, and CI fails if they are stale. They tell you what exists, where it
lives, who owns it, and how far to trust each claim.

Open the files the context points at — not the whole tree. `apps/web` alone is 43 code
files; reading everything is a defect, not diligence.

`.ai/diagrams/` shows the same facts drawn. Start at `.ai/diagrams/index.md` when
orienting in an unfamiliar area.

## 2. The modules

| Module | Path | What it is |
|---|---|---|
| `r4c-api` | `apps/api` | NestJS API — projects, WBS, documents, approvals, progress |
| `r4c-web` | `apps/web` | Next.js client, including the IFC model viewer |
| `r4c-bim-worker` | `apps/bim-worker` | Python worker extracting geometry from IFC models |
| `r4c-contracts` | `packages/contracts` | Typed contracts shared between API and web |
| `r4c-scripts` | `scripts` | Local setup and production configuration |
| `r4c-kaaf-tooling` | `scripts/architecture` | Generates this context. Vendored — fix upstream |

## 3. Confidence means something here

Each module's confidence is **computed from evidence**, never copied from its manifest:

| Level | Means |
|---|---|
| `verified` | Declared, and discovered code corroborates it |
| `documented` | Declared, but no code exists to check it against |
| `derived` | Found in the source with nothing declaring it |

Discovery is a static read of Python, TypeScript, JavaScript and Dart. It cannot see
imports built at runtime or resolved through a bundler alias, so **absence of a finding is
not proof of absence**.

## 4. If you change the architecture, regenerate

Required when you add, remove, rename or re-scope a module, change what a module exposes,
or change what it depends on.

```bash
# update the affected kaaf.module.json first — it is the input of record
./scripts/architecture/generate.sh
git add .ai && git commit -m "chore(kaaf): regenerate architecture context"
```

Verify before pushing — CI runs the same checks:

```bash
./scripts/architecture/generate.sh --check                    # is .ai/ current?
python3 scripts/architecture/validators/validate_drift.py     # do declarations match the code?
python3 scripts/architecture/validators/validate_generated.py # is provenance intact?
python3 scripts/architecture/validators/validate_index.py     # does the index fit its schema?
```

## 5. Hard rules

- **Never hand-edit anything under `.ai/`.** It is generated; an edit is destroyed by the
  next run and makes agents confidently wrong until then. CI detects it.
- **Never invent structure.** If a component is not in `.ai/` and not in the source, say
  "not found" rather than guessing.
- **Do not edit `scripts/architecture/`.** It is vendored from Islamce/KAAF. A defect there
  is fixed upstream and re-vendored — see `scripts/architecture/VENDORED.md`.
- **Declare what is true.** A `dependsOn` with no corroborating import is reported as drift,
  and a declaration that overstates a relationship is worse than none.
