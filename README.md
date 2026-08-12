# R4C — Digital Real Estate Developer Platform

R4C is a governed digital platform for real-estate developers that connects property inventory, sales, customer experience, and development intelligence in one tenant-aware environment.

## Current product priority

The active product priority is the commercial lifecycle:

**Discover → Explore → Select → Enquire → Hold → Reserve → Contract → Pay → Track → Handover**

The current Commercial MVP is intentionally narrower:

1. Configure a development/project.
2. Configure phases, buildings, floors, and units.
3. Publish unit availability, pricing, media, and payment plans.
4. Let a public visitor browse and filter available units.
5. Capture an enquiry as a lead.
6. Create a concurrency-safe unit hold.
7. Confirm a reservation and update authoritative availability.
8. Audit all commercial state changes.

## Product domains

### Platform Core — active/reused

- Authentication and secure sessions
- Tenant isolation and subdomain resolution
- RBAC and permissions
- Audit history
- Documents/object storage
- Notifications
- Workflow foundations
- Arabic/English and RTL support
- Security, CI, local runtime, and deployment foundations

### Commercial — active development

- Developments/projects
- Phases, buildings, floors, units, and unit types
- Availability and pricing
- Payment plans and commercial media
- Customers, leads, and sales activities
- Holds and reservations
- Commercial analytics

### Customer Experience — active MVP/P1

- Public project showcase
- Unit finder and unit detail
- Enquiry and reservation journey
- Customer portal, later including documents, payment schedule, progress, and handover

### Development Intelligence — frozen capability layer

Existing WBS, BIM, IFC, 4D, progress, 5D cost, materials, procurement, quality, HSE, commissioning, and construction-handover capabilities are retained but are not the current Commercial MVP. They may change only for security, production/runtime, data-integrity, migration-compatibility, or explicitly approved Commercial integration work.

Development Intelligence must enhance Commercial through controlled adapters; Commercial must remain usable for a developer that does not use BIM.

## Architecture decision

R4C remains one monorepo. No R4C-Sales/R4C-v2 split and no destructive rewrite is authorized.

The existing `Project` aggregate remains the development root and bridge to the historical development-control capabilities. Commercial child entities are to be added additively beneath/alongside it. Existing WBS/BIM/construction tables are not to be repurposed as commercial property inventory.

## AI Architecture (KAAF)

This repository follows the [Kynox AI Architecture Framework](https://github.com/Islamce/KAAF).
Its architecture is described in machine-readable form under [`.ai/`](.ai/), generated from the `kaaf.module.json` manifests and cross-checked against the real source tree.

AI agents must:

1. Read `.ai/ai-context.json`, then `.ai/summary.md`.
2. Read `.ai/modules/<id>.json` for the module the task touches.
3. Read `.ai/drift.json` before trusting a declaration.
4. Inspect only the source files those steps referenced.
5. Never hand-edit anything under `.ai/`; regenerate it when an architectural code change requires it.
6. Read `docs/product-reset-blueprint.md` and `docs/development-freeze-register.md` before proposing product work.

See [`AGENTS.md`](AGENTS.md) for agent operating instructions.

| Module | Path | Current role |
|---|---|---|
| `r4c-api` | `apps/api` | Platform Core + domain APIs; Commercial modules will be added here |
| `r4c-web` | `apps/web` | Commercial, public/customer, and Development Intelligence UI surfaces |
| `r4c-bim-worker` | `apps/bim-worker` | Frozen Development Intelligence worker |
| `r4c-contracts` | `packages/contracts` | Shared cross-boundary contracts; Commercial contracts must be added here |
| `r4c-scripts` | `scripts` | Runtime/verification tooling |
| `r4c-kaaf-tooling` | `scripts/architecture` | Architecture governance tooling |

Regenerate KAAF context after architectural source/manifests change:

```bash
./scripts/architecture/generate.sh
```

## Commercial MVP acceptance journey

The Commercial MVP is not established until a real journey proves:

Admin configures Project → Phase → Building → Floor → Unit → publishes pricing/payment plan → public visitor browses and filters units → submits enquiry → lead appears for Sales → unit can be held safely → reservation is confirmed → second conflicting hold/reservation is rejected → full state changes are audited.

## Explicitly deferred from the Commercial MVP

- Full accounting/ERP
- Full contract lifecycle and collections engine
- Broker marketplace and commission settlement
- Facilities/community/property management
- Native mobile applications
- Mortgage processing
- Predictive AI and automated valuation
- Digital twin / IoT expansion
- New 4D/5D/BIM/HSE/quality/materials feature expansion

## Technology

- Web: Next.js + TypeScript
- API: NestJS + TypeScript + Prisma
- BIM worker: Python + FastAPI + IfcOpenShell
- Data: PostgreSQL, Redis/BullMQ, MinIO/S3
- Local runtime: Docker Compose
- CI: GitHub Actions

See `docs/mvp-scope.md`, `docs/product-reset-blueprint.md`, `docs/development-freeze-register.md`, `docs/architecture.md`, and `docs/security.md`.
