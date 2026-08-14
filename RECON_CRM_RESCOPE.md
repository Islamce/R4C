# R4C CRM Rescope Reconnaissance

**Status:** Complete — no active code or historical content has been removed.  
**Repository checked:** `Islamce/R4C` at `124dee8b047c39da509555fdbd49d4c16e176bfd` (14 August 2026).

## Executive finding

R4C is **not BIM-only** and must not be mechanically stripped. A recent commercial-domain foundation is already present, supported by the R0 governing product-reset blueprint. The implemented foundation covers a tenant-scoped property hierarchy and unit availability; the documented CRM direction is broader than the code currently delivered. The former Development Intelligence stack remains active in the application and is frozen by the checked-in product blueprint, not yet separated or archived.

The static review finds **shared platform and project anchors but no direct commercial-module dependency on BIM services or viewer components**. A clean separation is therefore plausible, but it is not a trivial folder deletion: `Project`, `Tenant`, `User`, authentication, RBAC, audit, document storage, and application-module wiring are shared. Any future removal must be migration-reviewed and tested against a real database.

## 1. Verified commercial / CRM state

| Area | Verified state | Evidence |
| --- | --- | --- |
| Product direction | The R0 blueprint reorients R4C to a commercial-first real-estate developer platform; the commercial MVP is a governed reservation journey. | `docs/product-reset-blueprint.md` §§1–3, 16 |
| Implemented commercial foundation | `DevelopmentPhase`, `Building`, `Floor`, `UnitType`, and `Unit` are implemented as tenant-scoped Prisma models and CRUD services. | `apps/api/prisma/schema.prisma`; `apps/api/src/commercial/` |
| Unit availability | The schema implements `DRAFT`, `UNRELEASED`, `AVAILABLE`, `HELD`, `RESERVED`, `SOLD`, `BLOCKED`, and `WITHDRAWN`. | `schema.prisma` `UnitStatus` |
| Intended future commercial scope | The product blueprint names customer, lead, sales activity, price revisions, payment plans, holds, reservations, and analytics. | `docs/product-reset-blueprint.md` §§3, 6, 9 |
| Not yet implemented as current CRM logic | The reviewed schema and commercial module do not define models or routes for Lead, Customer/Contact, Opportunity, Contract, PaymentPlan, Commission, or Communication/SalesActivity. | Current schema and `apps/api/src/commercial/` review |

The commercial module does not directly import or reference BIM, IFC, WBS, or progress code. It uses the shared tenant/project hierarchy, audit service, and Prisma boundary. The root API module currently wires both the commercial and Development Intelligence modules into one application.

## 2. Construction-specific active scope inventory

| Category | Verified active material | Approximate working-tree evidence |
| --- | --- | --- |
| BIM processing | API BIM module, queue, processor, service, worker, and synthetic IFC fixture. | Worker fixture: **2,109 bytes**; BIM viewer component: **44,037 bytes**. |
| BIM runtime dependencies | `ifcopenshell`, `trimesh`, FastAPI/Uvicorn worker; `three` in the web package; BullMQ/Redis and S3 path in the API. | `apps/bim-worker/pyproject.toml`; package manifests. |
| Development Intelligence domains | WBS, progress, schedule/4D, cost/5D, materials/procurement, quality, HSE, commissioning, and handover modules/schema. | `apps/api/src/`; Prisma schema; product blueprint §3. |
| User interface and verification | `BimViewer`, `ProgressWorkspace`, WBS/progress styling and BIM/progress browser journeys. | `apps/web/components/`, `apps/web/test/`. |
| Documentation and deployment | BIM processing/viewer documentation, the current VPS-oriented deployment runbook, and construction-domain test/runbook material. | `docs/`. |

The repository worktree is approximately **3.6 MiB**. Its packed reachable Git object store is approximately **950 KiB**. The largest reachable historical blob is **189,050 bytes** (`pnpm-lock.yaml`); the largest BIM-related source blob is approximately **44 KiB**. No significant committed binary, IFC, or generated-tile history bloat was found. **A history rewrite is not proposed.**

## 3. Deployment evidence

GitHub reports **no deployment records** for the repository. Recent workflow runs on `main` at the checked commit succeeded, including CI, seed, security, authentication/session, and production-deployment verification workflows. Those runs are repository/CI evidence only; they do not prove a live runtime, deployment location, cost, or production readiness.

The checked-in runbook targets a self-managed VPS for the former multi-service construction stack. It is not evidence of a current live deployment or of current spend. No approved host access or current billing/runtime configuration was available during this reconnaissance.

## 4. GAPS and vault findings

The active `GAPS/w2-r4c/` folder does **not** contain an old BIM build specification. It contains the previously written shared-hosting Gate G2 assessment and its README. That assessment is now stale under this rescope and requires supersession rather than archival of a separate active spec.

The authority-checked Obsidian vault already uses project-scoped records such as `Project Home`, `Current Status`, `Decisions`, `Architecture`, `Roadmap`, and `Risks`. Its existing R4C material still describes the former construction-focused identity and related frozen/deferred scope. A new dated R4C decision note should use that established project structure after the archive plan is approved.

## 5. Required escalation / decision gates

1. **Archive approval required before active removal.** The current R0 product blueprint says Development Intelligence is frozen, whereas this prompt directs its removal from the active branch and retention in a recoverable local archive. The operator must approve that replacement decision before files or modules are removed.
2. **No Git-history escalation is needed.** The inspected history is small and contains no meaningful binary bloat; retain history unchanged.
3. **CRM product questions remain open where the blueprint does not settle them.** In particular, the prompt asks for contracts, payment-plan structure, pipeline stages, commission basis, and communication behavior. The blueprint gives a lead-status proposal and payment-plan direction, but not a final contracts model, commission rules, or exact messaging-provider behavior. These must stay as documented open questions rather than become invented schema.
4. **Live CRM deployment gate remains unverified.** There is no current host/runtime evidence with which to measure CRUD latency or clear the successor runtime gate.

## References

- `docs/product-reset-blueprint.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/commercial/`
- `apps/bim-worker/pyproject.toml`
- `apps/api/src/app.module.ts`
- `docs/deploy-hostinger-vps.md`
- `GAPS/w2-r4c/G2_VIABILITY.md`
