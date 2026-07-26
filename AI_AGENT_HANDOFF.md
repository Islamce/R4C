---
document: R4C AI Agent Handoff and Project Record
version: 1.0
last_verified_utc: 2026-07-26
repository: Islamce/R4C
authoritative_branch: main
authoritative_commit: 9f7d5cbd8c6ba27373eebd134705d936d4969197
purpose: Durable cross-agent context covering project conversations, merged work, key files, invariants, evidence, deployment, and next actions.
---

# R4C AI Agent Handoff and Project Record

## 1. Read this first

This file is the durable handoff for any AI agent, developer, reviewer, or operator starting work on R4C.

It is a normalized record of the project conversations available through 2026-07-26, the merged GitHub work, important files, architectural decisions, verification evidence, known deviations, and remaining work. It is not a verbatim transcript of every chat message. Raw chat history is not stored in Git; this file captures the operationally relevant content so the project does not depend on one conversation or one AI memory.

Source-of-truth order:

1. Current code on `main`.
2. Prisma schema and versioned migrations.
3. Executable tests and GitHub Actions evidence.
4. Deployment configuration and runbooks.
5. Merged PR descriptions and audit history.
6. This handoff summary.

When this file conflicts with current code, current code wins and this file must be updated in the same PR.

## 2. Current verified status

As of 2026-07-26:

- Repository: `Islamce/R4C`
- Default branch: `main`
- Verified `main` head: `9f7d5cbd8c6ba27373eebd134705d936d4969197`
- Latest product merge: PR #30, merged 2026-07-22
- Product status: complete through the production deployment package for UAT
- Actual Hostinger VPS deployment: not confirmed in the recorded conversations; the package and owner runbook are ready
- Application package dependency changes in Phase 7: none
- Database schema change in Phase 7: none
- Production migrations: `prisma migrate deploy`; never `prisma db push`

Open maintenance PRs at the time of this record:

- PR #18: BIM worker Python base-image update
- PR #19: GitHub Actions dependency group
- PR #20: pytest range update
- PR #29: grouped JavaScript dependency updates

These are Dependabot/maintenance work, not approved product phases. Review compatibility, migrations, security findings, lockfile changes, and all workflows before merging. PR #29 includes broad JavaScript updates and must not be merged blindly.

## 3. Important phase-numbering warning

R4C has two historical phase sequences. Agents must identify which sequence a request refers to.

### Track A: Domain and platform capability phases

This sequence began with the original platform build:

- Phase 1: project core
- Phase 2: document control
- Phase 3: IFC processing
- Phase 4: BIM viewer and initial progress
- Phase 5: schedules and 4D
- Phase 6: governed 5D backend
- Phase 7: materials/procurement/project inventory
- Phase 8: quality
- Phase 9: HSE
- Phase 10: commissioning and handover
- Phase 11: production hardening
- Phase 12: runtime integration tests
- Phase 13: software supply-chain security

### Track B: Production-readiness, frontend, UAT, and deployment phases

This later sequence reused lower phase numbers:

- Production readiness Phase 1: versioned migrations
- Production readiness Phase 2: idempotent bootstrap seed
- Production readiness Phase 3: rate limiting
- Phase 3.5: refresh/logout contract
- Frontend Phase 4: application foundation and first journey
- Frontend Phase 5: 5D dashboard
- Frontend Phase 6: progress workspace
- Phase 6.5: UX loop closers and Alomran tenant resolution
- Phase 7: Hostinger VPS production deployment package

Do not start a new “Phase 8” until the owner states whether it means the next frontend/UAT phase or refers to the older domain sequence.

## 4. Product definition

R4C is a BIM-centered real-estate development control platform. It governs project delivery rather than acting as a generic ERP or a generic file viewer.

Core vertical chain:

`Tenant -> Project -> WBS -> Documents/IFC -> BIM elements -> Schedule/progress -> 4D -> Budget/cost -> 5D -> Materials -> Quality -> HSE -> Commissioning -> Handover`

Primary product principles:

- Multi-tenant isolation on every operation.
- Explicit RBAC permissions and separation of duties.
- Immutable revisions where historical baselines matter.
- Append-only ledgers and reversing entries where financial or inventory history matters.
- Optimistic or serializable concurrency controls for governed transitions.
- Audit events and notification outbox writes inside business transactions.
- BIM links are a control dimension, not decorative metadata.
- Browser sessions terminate tokens server-side; browser JavaScript never receives access or refresh tokens.
- English and Arabic are first-class, including RTL layout.
- Evidence comes from real migrations, real APIs, production builds, and live journey tests, not mocks alone.

## 5. Technology architecture

### Monorepo

- Package manager: pnpm
- Node requirement: Node.js 22 or later
- Workspace file: `pnpm-workspace.yaml`
- Locked dependencies: `pnpm-lock.yaml`

### API

- Location: `apps/api`
- Framework: NestJS
- ORM: Prisma
- Production database: PostgreSQL
- Authentication: short-lived JWT access tokens plus opaque database-backed refresh tokens
- Password and refresh-secret hashing: Argon2id
- Queue: BullMQ over Redis
- Object storage: S3-compatible storage, production package uses MinIO

### Web

- Location: `apps/web`
- Framework: Next.js 15, React 19
- Production mode: standalone Next.js runtime
- BIM rendering: Three.js
- Styling: project-owned CSS/design system; no Tailwind dependency introduced
- Session boundary: Next.js server routes and httpOnly cookies
- Locales: English and Arabic, LTR/RTL

### BIM worker

- Location: `apps/bim-worker`
- Framework: FastAPI/Python
- IFC engine: IfcOpenShell
- Responsibilities: IFC extraction, geometry/GLB generation, bounded processing
- Security: internal bearer token, source-host allowlist, redirects disabled, file/element/property limits, temporary-file cleanup

### Shared contracts

- Location: `packages/contracts`
- Use shared types where available.
- Some frontend-specific cost/progress response adaptations remain in `apps/web/lib/types.ts` because matching shared contracts do not yet exist.

### Production deployment

- Compose: `docker-compose.prod.yml`
- Reverse proxy: Caddy with Cloudflare DNS provider
- Services: PostgreSQL, Redis, MinIO, API, web, BIM worker, migration job, seed tools, Caddy
- Only Caddy exposes host ports.

## 6. Non-negotiable engineering invariants

Every agent must preserve these unless the owner explicitly authorizes a redesign.

### Git and delivery

- Branch from current `main`.
- One focused scope per branch/PR.
- Never merge a PR without explicit owner instruction.
- Do not claim screenshots unless screenshots were actually captured.
- Temporary diagnostic workflows/files must be removed before final review.
- Keep final PR descriptions evidence-based and include deviations.

### Database

- Never edit `apps/api/prisma/migrations/0_init/migration.sql` after release.
- Never use `prisma db push` for deployment.
- Every schema change requires a new migration.
- Production and CI deployment use `prisma migrate deploy` followed by drift detection.
- Preserve tenant ownership and indexes on tenant-scoped models.

### Authentication and browser security

- Browser-side tokens are prohibited.
- Access and refresh tokens live in `Secure`, `httpOnly`, `SameSite=Lax` cookies in production.
- One backend 401 triggers at most one refresh and one retry.
- Refresh rotation must persist the newest access and refresh cookies.
- Refresh reuse detection revokes active sessions for the same user/tenant.
- Logout calls the real backend logout contract and clears cookies.
- The browser tenant cookie stores tenant code, not tenant UUID.
- Tenant UUID is resolved and used server-side only.

### Tenant resolution

- Exact endpoint: `GET /api/v1/tenants/by-code/:code`
- Exact-code lookup only; no public tenant list or fuzzy search.
- ACTIVE tenants only.
- Minimal response: `{ id, code, name, status }`.
- Uniform 404 for invalid/inactive/missing tenant.
- Independent per-client rate limit.
- `TENANT_BASE_DOMAIN` controls subdomain resolution.
- Local override is allowed only for localhost/non-production flows.

### Financial data

- Monetary values cross the API boundary as decimal strings.
- Never use browser floating-point arithmetic for authoritative money.
- Preserve source precision when formatting.
- CPI, SPI, EAC, ETC, and VAC may be null and must render as a first-class partial state.
- Authoritative earned-value calculations remain backend-owned.

### Progress and decisions

- `progress:submit` and `progress:review` are separate permissions.
- The submitter must not automatically review the same update.
- Only SUBMITTED updates may be reviewed.
- Already-decided/concurrent review returns a graceful conflict message and refreshes authoritative history.
- Approved progress feeds earned value and links to the 5D screen.

### Governance

- Published schedules, budgets, plans, and controlled versions are immutable.
- Cost and inventory transactions are append-only.
- Corrections use explicit reversing or compensating entries.
- Direct BIM element state takes precedence where defined; WBS fallback is used when direct state is absent.
- Separation rules are enforced in backend policy, not only hidden in UI.

## 7. Capability inventory now on `main`

### Project and workflow core

- Tenants, users, roles, permissions, memberships, refresh-token records
- Tenant-scoped projects and project membership
- Hierarchical WBS
- Work items and governed workflow transitions
- Audit events
- Concurrency protection

### Document control

- Project document register
- PDF, DWG, and IFC policies
- Signed upload/download URLs
- Immutable versions and revision metadata
- Review comments and decisions
- Approved-only distribution
- Notification outbox and audit trail

### IFC and BIM

- BIM model and processing-job lifecycle
- BullMQ orchestration and FastAPI worker
- IFC2X3/IFC4 extraction
- Spatial hierarchy, elements, properties, WBS links
- GLB generation and signed delivery
- Three.js viewer and element inspector
- Visual linking and governed progress coloring

### Schedule and 4D

- Immutable schedule revisions
- WBS activities and typed dependencies
- Cycle and date validation
- Published active baseline
- Planned/actual 4D state
- Timeline playback, variance, and ghosted future geometry

### Cost and 5D

- Immutable budget revisions
- Append-only commitments and actual-cost ledger
- BAC, PV, EV, AC, CPI, SPI, EAC, ETC, VAC, CV, SV
- WBS breakdown and as-of calculations
- BIM cost allocation and financial state
- Authenticated bilingual 5D dashboard

### Materials, procurement, and project inventory

- Tenant material master
- Immutable material takeoff revisions
- Budget-linked procurement commitments
- Project inventory locations
- Append-only receipts/issues
- Over-receipt and negative-stock prevention
- Readiness analytics and BIM material mode

### Quality

- Immutable quality plans
- Inspections and independent review
- NCR, punch, and observation findings
- Corrective action and independent verification
- Evidence and dashboard
- BIM quality state

### HSE

- Permit-to-work lifecycle
- Safety events, incidents, near misses, hazards, observations
- Investigation and root cause
- Corrective actions and independent verification
- Closure controls and dashboard
- BIM safety state

### Commissioning and handover

- Immutable commissioning plans
- Checkpoints and hold points
- Test execution and independent review
- Handover packages and dossier requirements
- Return/resubmission logic
- Commissioning gate for handover acceptance
- Readiness dashboard and BIM turnover state

### Frontend and user experience

- Server-side login/session foundation
- Project list/create/detail/WBS journey
- Bilingual EN/AR application shell
- Correct root `lang` and `dir`
- Responsive states and accessible focus behavior
- 5D dashboard
- Progress submission/review/history workspace
- Alomran subdomain tenant context
- Progress-to-5D project deep link

### Production readiness

- Versioned Prisma migration baseline
- Idempotent bootstrap seed
- Idempotent Alomran UAT seed
- Submit-only UAT user
- Configurable proxy-aware rate limiting
- Refresh/logout contract
- Authenticated runtime integration tests
- Supply-chain security workflow and SBOM
- Full production Docker Compose package

## 8. Chronological merged PR ledger

The following product PRs were merged. PR descriptions and Git history are the detailed audit trail.

| PR | Track/phase | Outcome |
|---|---|---|
| #1 | Domain Phase 1 | Initialized monorepo and governed project/WBS/workflow core |
| #2 | Domain Phase 2 | Secure document control, immutable versions, review/distribution |
| #3 | Domain Phase 3 | IFC processing, BIM extraction, queues, BIM-to-WBS linkage |
| #4 | Domain Phase 4 | GLB geometry, browser BIM viewer, visual linking, progress coloring |
| #5/#6 | Domain Phase 5 | Governed schedules and 4D BIM; #6 promoted stacked work to main |
| #7/#8 | Domain Phase 6 | Governed budget/cost/earned value and 5D; #8 promoted to main |
| #9/#10 | Domain Phase 7 | Materials, procurement, project inventory; #10 promoted to main |
| #11 | Domain Phase 8 | Quality inspections, findings, actions, BIM quality state |
| #12 | Domain Phase 9 | HSE permits, events, investigations, actions, BIM safety state |
| #13 | Domain Phase 10 | Commissioning and handover readiness |
| #14 | Domain Phase 11 | Production hardening, reproducible installs, readiness checks |
| #15 | Domain Phase 12 | Authenticated HTTP runtime integration with PostgreSQL/Redis/MinIO |
| #16 | Domain Phase 13 | Supply-chain security scans, SBOM, Dependabot policy |
| #17 | Release Phase 1 | Versioned `0_init` migration and `migrate deploy` process |
| #22 | Release Phase 2 | Idempotent permission-derived seed and first admin |
| #23 | Release Phase 3 | Global/profile rate limiting and trusted-proxy client IP |
| #24 | Release Phase 3.5 | Opaque refresh rotation, reuse detection, logout |
| #25 | Frontend Phase 4 | Server session, app shell, i18n/RTL, projects journey, viewer proxy |
| #26 | Frontend Phase 5 | Flagship bilingual 5D cost-control dashboard |
| #27 | Frontend Phase 6 | Progress submit/review/history workspace and EV loop |
| #28 | Phase 6.5 | 5D deep link, subdomain tenant resolution, Alomran UAT seed |
| #30 | Phase 7 | Complete Hostinger VPS deployment package and runbook |

Historical branch-topology note: PRs #5, #7, and #9 were stacked on earlier feature branches. Recovery PRs #6, #8, and #10 promoted the accepted changes to `main`. New work should branch directly from current `main` to avoid repeating this topology problem.

## 9. Conversation-derived decision log

### 2026-07-19: project initialization

The owner requested creation of R4C as a new BIM-centered real-estate control platform. The first objective was a governed project core and a vertical path from project/WBS to IFC/BIM, progress, and control dashboards.

### 2026-07-19 to 2026-07-20: backend and domain expansion

The conversations drove rapid, focused phases for documents, IFC processing, GLB viewing, 4D schedule, 5D cost, materials, quality, HSE, commissioning, handover, runtime testing, and supply-chain security. Each phase was reviewed through a PR and manually merged by the owner.

### 2026-07-21: production readiness and frontend

The owner then requested:

- versioned migrations rather than destructive schema resets;
- a safe idempotent bootstrap seed;
- API rate limiting;
- complete refresh/logout behavior;
- a reusable bilingual frontend foundation;
- a real 5D dashboard;
- a progress submission and approval workspace;
- subdomain tenant resolution and realistic Alomran UAT data.

These were delivered through PRs #17 and #22-#28.

### 2026-07-21 to 2026-07-22: Hostinger deployment package

The owner requested a complete production/UAT package without providing hosting credentials. The resulting work added production Dockerfiles, Compose, Caddy wildcard TLS, environment contract, secret generator, an idempotent submit-only UAT account, and a detailed Hostinger VPS runbook. PR #30 was merged on 2026-07-22.

### 2026-07-26: durable project memory

The owner requested that the achievements, conversations, and files be recorded in a dedicated AI-readable file. This document is that normalized project record.

## 10. Key file registry

This is the curated map an agent should use first. The complete authoritative file list is always available with `git ls-files`.

### Root and workspace

- `package.json` — monorepo scripts and package-manager contract
- `pnpm-workspace.yaml` — workspace packages
- `pnpm-lock.yaml` — frozen JavaScript dependency graph
- `.env.example` — development/application environment contract
- `.env.production.example` — production environment template
- `.gitignore` — includes private production env exclusions
- `.dockerignore` — production image build context exclusions
- `docker-compose.yml` — development infrastructure
- `docker-compose.prod.yml` — full production stack

### API and database

- `apps/api/package.json` — API build, test, migration, and seed commands
- `apps/api/Dockerfile` — production runtime and tools images
- `apps/api/prisma/schema.prisma` — database source of truth
- `apps/api/prisma/migrations/0_init/migration.sql` — released baseline; do not edit
- `apps/api/prisma/migrations/migration_lock.toml` — migration provider lock
- `apps/api/prisma/seed.ts` — idempotent bootstrap tenant, permissions, ADMIN/VIEWER, admin membership
- `apps/api/prisma/seed-uat.ts` — Alomran tenant, UAT admin, optional submit-only user
- `apps/api/src/auth/auth.service.ts` — login, Argon2id helpers, refresh rotation/reuse/logout logic
- `apps/api/src/auth/auth.controller.ts` — login/refresh/logout routes
- `apps/api/src/auth/auth.dto.ts` — authentication request validation
- `apps/api/src/common/rate-limit.ts` — named rate-limit policies
- `apps/api/test/*.mjs` — security, runtime, seed, rate-limit, and auth-session evidence

### Web foundation

- `apps/web/package.json` — Next.js build and journey test scripts
- `apps/web/Dockerfile` — standalone production image
- `apps/web/lib/server-session.ts` — cookie session, server API client, refresh-on-401
- `apps/web/lib/tenant-resolution.ts` — host/subdomain to tenant code and exact lookup
- `apps/web/lib/client-api.ts` — normalized browser-to-Next client calls
- `apps/web/lib/i18n.ts` — complete EN/AR dictionaries
- `apps/web/lib/types.ts` — frontend response and command types
- `apps/web/components/AppShell.tsx` — authenticated shell/navigation/tenant context
- `apps/web/components/StatePrimitives.tsx` — reusable loading/empty/error states
- `apps/web/components/BimViewer.tsx` — Three.js BIM control room using server proxy
- `apps/web/components/CostControlDashboard.tsx` — flagship 5D screen
- `apps/web/components/ProgressWorkspace.tsx` — progress submit/review/history workspace
- `apps/web/app/api/backend/[...path]/route.ts` — restricted server-side BIM/backend proxy
- `apps/web/app/api/session/*` — login/session/logout browser boundary
- `apps/web/app/api/projects/*` — project and cost server routes
- `apps/web/app/api/wbs/*` and `apps/web/app/api/progress/*` — progress server routes
- `apps/web/app/api/health/route.ts` — production web liveness
- `apps/web/test/*.mjs` — projects, 5D, progress, and UX-loop live journeys

### BIM worker

- `apps/bim-worker/Dockerfile` — non-root worker image
- `apps/bim-worker/pyproject.toml` — Python dependencies and tooling
- `apps/bim-worker/app/**` — processing service
- `apps/bim-worker/tests/**` — worker tests

### Deployment

- `deploy/caddy/Dockerfile` — Caddy plus Cloudflare DNS module, non-root
- `deploy/caddy/Caddyfile` — production host/TLS routing
- `deploy/caddy/Caddyfile.local` — deterministic local/CI TLS routing
- `scripts/generate-production-env.sh` — private environment generator
- `docs/deploy-hostinger-vps.md` — owner deployment and day-2 runbook

### Architecture and governance documentation

- `docs/frontend-foundation-design.md` — design language and UI principles
- `docs/auth-sessions.md` — token/session/tenant-resolution contract
- `docs/security.md` — enforced security controls
- Production-readiness, release, domain, and rollout documents under `docs/`

### CI/CD and evidence

- `.github/workflows/ci.yml` — main build/integration gate
- `.github/workflows/security.yml` — dependency, secret, misconfiguration, image, and SBOM gate
- `.github/workflows/seed-verification.yml`
- `.github/workflows/auth-session-verification.yml`
- `.github/workflows/phase5-cost-dashboard.yml`
- `.github/workflows/phase6-progress-workspace.yml`
- `.github/workflows/phase65-ux-loop-closers.yml`
- `.github/workflows/phase7-production-deployment.yml`
- `.github/dependabot.yml` — grouped maintenance policy

## 11. Current frontend contracts and adapters

### Project detail

The backend does not provide a dedicated `GET /projects/:projectId` contract. The Next.js project-detail route finds the accessible project in tenant-scoped `GET /projects`, then calls real `GET /projects/:projectId/wbs`. Do not invent a backend route inside an unrelated frontend phase.

### Cost control

Product-facing request:

`GET /api/projects/:projectId/cost-control?asOf=YYYY-MM-DD`

The Next.js route currently adapts:

- `asOf` to backend query name `date`
- backend collection `wbs` to frontend property `nodes`

Money remains strings. The dashboard must handle no budget, empty nodes, null performance metrics, and adverse variances without `NaN`.

### Progress

- `GET /wbs/:wbsNodeId/progress`
- `POST /wbs/:wbsNodeId/progress`
- `POST /progress/:progressUpdateId/review`

History decimal percentages may serialize as strings. Submission percent is a validated number from 0 to 100. Notes/comments are blank or 3-2000 characters.

### Tenant login

The browser submits only email and password. The Next.js server resolves tenant code from the host, looks up the exact ACTIVE tenant, and injects the UUID into the backend login call. Do not expose UUIDs in HTML, JSON, or persistent cookies.

## 12. Design language

The frontend must remain one coherent design system.

Established palette:

- Blueprint navy: `#173042`
- Survey blue: `#2C6E8F`
- Concrete mist: `#EEF3F5`
- Steel: `#637786`
- Permit green: `#2F7D62`
- Signal amber: `#C88A2B`

Requirements:

- Arabic-capable typography
- Sentence case
- Logical CSS properties for RTL
- Numbers/currency remain legible in Arabic
- Keyboard focus is visible
- Reduced motion is respected
- Status meaning uses icon/label/structure, not color alone
- Tables degrade to usable mobile cards where appropriate

## 13. Verification and evidence record

Recent durable artifacts:

| Phase | Artifact | Digest |
|---|---|---|
| Auth 3.5 | `auth-session-verification-evidence` | `sha256:eed762e0c629f766c0d559c45b608f2780231a43ad6269d792d589b6c1bbcb41` |
| Frontend 4 | `frontend-journey-verification-evidence` | `sha256:a5b8586c2d37b46c7ff1373db3372708b540b11c9f4ad36e8c34a71f0269602a` |
| Frontend 5 | `cost-dashboard-verification-evidence` | `sha256:51fdfea89dd65b0eb31ce2ebfd938c26c0054f9b88cf0cf3ec538a68fd0a21de` |
| Frontend 6 | `progress-workspace-verification-evidence` | `sha256:5e8b0c1a66cbac4a05c4957b910bf48c50768e23fc198ec943b69deacccfeeb1` |
| Phase 6.5 | `phase65-ux-loop-closers-evidence` | `sha256:117a2593d7cbb5232f20b547ceaad0a857dc8f861c1ace520be347fa38466cc3` |
| Phase 7 | `phase7-production-deployment-evidence` | `sha256:b85a8344657553da5659a59d9b991f792e7516c784950a5fc9ecefa64346c1f7` |

GitHub Actions artifacts expire; the permanent evidence is the workflow, tests, logs while retained, PR body, and Git commit.

Final Phase 7 proof included:

```text
PHASE7_IMAGES api=built web=built bim-worker=built caddy=built
PHASE7_USERS api=10001:10001 web=10001:10001 bim=r4c
PHASE7_ADMIN role=ADMIN tenant=ALOMRAN
PHASE7_SUBMITTER role=PROGRESS_SUBMITTER submit=true review=false
PHASE7_TLS app=https://r4c.local api=https://api.r4c.local tenant=https://alomran.r4c.local secureCookies=true
PHASE7_SECRETS generated=true devDefaults=false committed=false
PHASE7_COMPOSE fullStack=true migrations=deploy seeds=bootstrap+uat-twice idempotent=true health=green
```

## 14. Deployment and UAT status

### Package ready

The repository includes everything required for a manual Hostinger VPS UAT deployment.

Recommended VPS:

- Minimum controlled UAT: 4 vCPU, 8 GB RAM, 80 GB SSD/NVMe, 4 GB swap
- Recommended realistic BIM UAT: 8 vCPU, 16 GB RAM, 160 GB or more storage
- OS: Ubuntu 24.04 LTS
- Hostinger shared hosting is not supported

### Domain and TLS decision

- VPS remains at Hostinger.
- Authoritative DNS is managed through Cloudflare for reliable wildcard DNS-01 automation.
- Required A records: app, API, and wildcard tenant host.
- Use a restricted Cloudflare token with Zone Read and DNS Edit for one zone.
- Do not use the global Cloudflare API key.

### UAT tenants/users

Environment-driven seeds create:

- Bootstrap tenant/admin
- Tenant code `ALOMRAN`
- Name `Alomran Development`
- Arabic login display `العمران للتطوير العقاري`
- UAT ADMIN
- Optional `PROGRESS_SUBMITTER` user

No password is hardcoded or stored in this document. Passwords are generated into `.env.production` and must remain private.

### Manual deployment remains

The recorded work did not access the owner's Hostinger account. The next operator must follow `docs/deploy-hostinger-vps.md`, verify DNS, generate secrets, build, migrate, seed, start, and run browser/mobile UAT.

## 15. Known deviations and technical debt

These are accepted current conditions, not necessarily defects.

- Refresh-flight deduplication in Next.js is process-local. Multiple web replicas need shared coordination.
- Nest throttling storage is process-local. Multiple API replicas need Redis-backed distributed throttling.
- No dedicated project-detail backend endpoint.
- Cost-control frontend currently adapts backend `date`/`wbs` to product `asOf`/`nodes`.
- Cost and progress shared contracts are incomplete in `packages/contracts`.
- Tenant model has one canonical name; Alomran Arabic name is environment-driven in the server-rendered login context.
- `JWT_REFRESH_SECRET` may remain as legacy configuration although opaque DB-backed refresh tokens do not require it for token generation.
- Real public Let's Encrypt wildcard issuance was not performed in CI because the owner DNS zone/token was unavailable; CI used Caddy internal TLS.
- Dependency update PRs are pending and may introduce compatibility work.

## 16. Remaining work

### Immediate operational priority

1. Review and merge this documentation PR.
2. Perform the actual Hostinger VPS deployment using the runbook.
3. Complete UAT with both ADMIN and submit-only user.
4. Record UAT defects as focused issues and branches.

### Frontend domain surfaces still incomplete or not exposed as full workspaces

Backend capability exists for many of these, but the later frontend sequence intentionally stopped after progress and deployment:

- Document register/version/review workspace
- BIM model upload/linking/viewer entry workspace
- Schedule authoring/baseline workspace
- Budget authoring and cost-ledger workspace
- Materials/procurement/inventory workspace
- Quality workspace
- HSE workspace
- Commissioning/handover workspace

Before implementing, inspect current APIs and do not recreate backend logic in the browser.

### Operations hardening not built

- Scheduled encrypted offsite PostgreSQL and MinIO backups with retention
- Automated backup restore drills
- Uptime, TLS, disk, database, queue, and container monitoring
- Centralized logs and alerting
- GitHub Actions deployment to Hostinger
- Blue/green or rolling deployments
- Cloudflare proxy/WAF tuning
- Horizontal-scale session and rate-limit coordination
- Load, penetration, and resilience testing

## 17. Recommended agent workflow

Before changing code:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short
git switch -c agent/<focused-scope>
pnpm install --frozen-lockfile
pnpm --filter @r4c/api prisma:generate
pnpm typecheck
pnpm build
```

For database work, use a disposable PostgreSQL database and run:

```bash
pnpm --filter @r4c/api prisma:migrate:deploy
pnpm --filter @r4c/api exec prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code
```

For production package verification:

```bash
./scripts/generate-production-env.sh .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml --profile tools build --pull
```

Never put generated secrets, login payloads, tokens, cookie values, or `.env.production` into Git artifacts.

## 18. Owner collaboration preferences

Observed project workflow:

- The owner manually reviews and merges PRs.
- “Merged” or “PR X merged” means verify the actual GitHub state before continuing.
- “Continue” or “proceed” authorizes the next agreed phase, not unrelated scope expansion.
- Reports should include exact branch, head SHA, workflow results, files changed, evidence, deviations, and remaining work.
- Do not merge without explicit instruction.
- Do not start the next phase when the instruction says STOP after the current phase.
- Prefer practical, ordered, beginner-friendly deployment steps for owner-operated infrastructure.

## 19. How to maintain this file

Update this file whenever one of the following happens:

- A product or infrastructure PR is merged.
- A new API contract or invariant is introduced.
- A deployment is completed or changed.
- A major deviation is accepted or removed.
- An evidence workflow is added, renamed, or removed.
- The next priority changes.

Update at least:

- YAML `last_verified_utc`
- authoritative `main` commit
- current status
- merged PR ledger
- file registry
- invariants/contracts
- open maintenance PRs
- remaining work

The PR that changes project state should update this file before being marked ready for review.
