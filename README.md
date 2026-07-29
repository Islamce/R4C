# R4C — Real Estate Development Control Platform

R4C is a BIM-centered platform for governed real-estate development delivery, connecting projects, WBS, design documents, IFC models, approvals, progress, and executive visibility.

## AI Architecture (KAAF)

This repository follows the [Kynox AI Architecture Framework](https://github.com/Islamce/KAAF).
Its architecture is described in machine-readable form under [`.ai/`](.ai/), generated from
the `kaaf.module.json` manifests and cross-checked against the real source tree.

AI agents must:

1. Read `.ai/ai-context.json`, then `.ai/summary.md`
2. Read `.ai/modules/<id>.json` for the module the task touches
3. Read `.ai/drift.json` before trusting a declaration
4. Inspect only the source files those steps referenced
5. Never hand-edit anything under `.ai/` — regenerate instead

See [`AGENTS.md`](AGENTS.md) for the full instructions.

| Module | Path | Confidence |
|---|---|---|
| `r4c-api` | `apps/api` | verified |
| `r4c-web` | `apps/web` | verified |
| `r4c-bim-worker` | `apps/bim-worker` | verified |
| `r4c-contracts` | `packages/contracts` | verified |
| `r4c-scripts` | `scripts` | verified |
| `r4c-kaaf-tooling` | `scripts/architecture` | verified |

Regenerate after any architectural change:

```bash
./scripts/architecture/generate.sh
```

CI rejects a stale or hand-edited `.ai/`, and reports where declarations disagree with the
code. Diagrams: [`.ai/diagrams/index.md`](.ai/diagrams/index.md).

## MVP vertical slice

1. Create a project and WBS.
2. Upload an IFC2x3 or IFC4 model.
3. Process the model asynchronously.
4. View extracted BIM elements.
5. Link BIM elements to WBS activities.
6. Record physical progress.
7. Display portfolio and project dashboards.

## MVP capabilities

- Authentication, tenant-aware RBAC, and audit history
- Projects, WBS, tasks, workflow, and approvals
- Drawing/document upload with immutable version history
- BIM upload, validation, processing, viewing, and element extraction
- BIM-to-WBS linking and progress capture
- Email notifications and executive dashboards

## Deferred

SAP/Primavera integrations, Revit add-ins, digital-twin IoT, predictive AI, CRM/sales, full finance, full facilities management, mobile apps, and advanced time analytics.

## Architecture

- Web: Next.js + TypeScript + Tailwind CSS
- API: NestJS + TypeScript + Prisma
- BIM worker: Python + FastAPI + IfcOpenShell
- Data: PostgreSQL, Redis/BullMQ, MinIO/S3
- Local runtime: Docker Compose
- CI: GitHub Actions

See `docs/architecture.md`, `docs/mvp-scope.md`, and `docs/security.md`.
