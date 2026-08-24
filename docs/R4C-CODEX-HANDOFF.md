# R4C — Codex Continuity Handoff

**Transfer date:** 24 August 2026  
**Product:** R4C, standalone KYNOX real-estate delivery and commercial control product  
**Current owner after transfer:** Codex

## Executive transfer decision

Product development is complete for the transferred candidate and must remain frozen. The local synthetic release candidate was reported as conditionally qualified, with CRM 29/29, Commercial 23/23, internal security 17/17, backup/restore parity, health/readiness, Redis, build, responsive, RTL, and portfolio-isolation evidence. Staging qualification remains blocked by environment authorization, and production remains **NO-GO**.

A source-provenance exception must be resolved before any release qualification is treated as current. The supplied prior handoff names candidate `709ec928d4b9fe9cf38109c7535c73ce5215ae94`, but that object is absent from the recovered GitHub clone and absent from `origin/main`. The recovered authoritative GitHub repository is `https://github.com/Islamce/R4C`, branch `main`, at `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af`. The incomplete `/home/ubuntu/R4C` directory is not a Git repository and is not an authoritative source. The current `manus/design-handoff` branch now carries the approved Sales frontend and additive canonical CRM integration transferred from that workspace; this branch is a new implementation candidate and requires its own release qualification. Do not silently merge or relabel these states. First recover the 709 candidate or explicitly select and requalify the design-handoff branch as the new candidate.

## Exact repository state

| Field | Current verified value |
| --- | --- |
| Repository | `Islamce/R4C` |
| URL | `https://github.com/Islamce/R4C` |
| Authoritative local path | `/home/ubuntu/R4C-authoritative` |
| Branch | `main` |
| Current recovered HEAD | `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af` |
| Git status | Clean at clone time |
| Remote | `origin https://github.com/Islamce/R4C.git` |
| Reported prior candidate | `709ec928d4b9fe9cf38109c7535c73ce5215ae94` — unavailable in recovered clone; historical/unverified |
| Backend freeze | Frozen by transferred directive; verify against selected candidate before release |
| Frontend freeze | Frozen by transferred directive; verify against selected candidate before release |
| Latest migration | `20260823130000_canonical_crm` in the transferred candidate; recovered `main` must be checked before using that claim |
| Evidence commit | Handoff evidence is present in the design-handoff branch; the final implementation commit is recorded by Git after this update |

Older SHA references from the prior local handoff are historical until the 709 object and its tree are recovered. The only current GitHub source truth presently verifiable is `main` at `1ab27d8...`.

## Critical recovered history

| Commit | Purpose |
| --- | --- |
| `fcae4dff21466d281ef701fb41b22d64f337bb4e` | Product Reset to commercial-first R4C direction. |
| `43c4b03860d33cceb37c0e85b4b4efa667c2485b` | Commercial domain foundation. |
| `c1740ec415bc3276ec00586ef881c1e83086cfda` | Bilingual commercial i18n, holds, and reservations. |
| `781395e553a06b2c5c47eff0f3ba1752a6e7293d` | Commercial reservation workflow. |
| `78d103bce5278d956c0e45f6b5e6c9027cfb6701` | Commercial journey assertion alignment. |
| `a24549598d4ee34609184e77ace7775293eb91b5` | Production entry routed to Commercial workspace. |
| `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af` | Current recovered bilingual Commercial Command Center. |

The reported frontend visual/reset and full-stack qualification commits are not present in the original recovered `main` clone. The approved Sales implementation is now present on `manus/design-handoff` and is covered by `evidence/design-handoff/frontend-implementation-manifest.json`; its implementation commit must be treated as a new candidate until full release qualification is repeated.

## Architecture and product boundary

R4C is a single pnpm monorepo. `apps/web` is the Next.js frontend; `apps/api` is the NestJS API and domain layer; `apps/bim-worker` is the Python IFC processor; `packages/contracts` holds shared schemas/types; and `packages/ui` contains reusable UI pieces where present. The API is versioned under `/api/v1`. The web exposes authenticated Commercial, Projects, Progress, and Cost Control surfaces, with proxy routes under `apps/web/app/api/backend/[...path]` and session routes under `apps/web/app/api/session/*`. Authentication is JWT/session based, with tenant resolution, cookies, and API guards. Locale routes support English/Arabic and LTR/RTL.

PostgreSQL is the persistence system through Prisma migrations. Redis supports hold-expiry, session, and queue behavior where enabled. File metadata belongs in PostgreSQL while file bodies use controlled object-storage operations. Commercial must operate independently of BIM and Development Intelligence. R4C must not couple normal operation to WMS or LOGIX, and RCRM remains reference/engineering history rather than a separate runtime.

## Canonical CRM and Commercial workflow

The CRM entities are **Contact**, **Opportunity**, **CrmActivity**, **CrmTask**, **Quotation**, **QuotationRevision**, and **CustomerDecision**. They connect to existing R4C **Lead**, **Customer**, **Project**, **DevelopmentPhase**, **Building**, **Floor**, **Unit**, availability, holds, reservations, pricing, payment plans, documents, and governance. Tenant ID is mandatory on tenant-owned records. Business transitions belong in services, sensitive transitions are audited, and published/revision-controlled records are immutable.

The accepted lifecycle is: **Lead → qualification → Customer/Contact → Opportunity → Activity/Task → Project/Unit context → Quotation → approval/revision → CustomerDecision → availability → Hold/Reservation → commercial outcome**. CRM owns customer context, opportunity lifecycle, activity/task work, quotation revision/decision records, and CRM projections. Commercial owns inventory, pricing, availability, holds, reservations, and commercial price snapshots.

`Opportunity = RESERVED` is only a CRM stage projection. It is not the authoritative Unit reservation state. Reservation authority remains in the existing Commercial/Reservation logic and must not be merged in future work.

## Frozen UI/UX and responsive boundary

The accepted Sales composition includes Command Center, signal strip, Quick Actions, My Work, active Opportunity, Selected Context, Activity History, Workload, contextual drawers, responsive mobile composition, Arabic/RTL, and KYNOX graphite/ink, mineral-teal, restrained-amber visual grammar. Transactional CRM must avoid marketing parallax, broad scrollytelling, fake analytics, forced all-dark treatment, and discretionary redesign.

The resolved responsive defect was a desktop two-column Sales grid surviving at mobile width. The transferred correction uses intentional one-column normal flow at `<=680px`, with full-width panels and compact mobile navigation. Prior acceptance evidence covered desktop, tablet, English mobile, Arabic desktop, and Arabic mobile; the recovered GitHub clone does not contain the transferred screenshot package, so the result must be treated as transferred evidence until re-run against the selected current candidate.

## Saudi-market boundary and providers

R4C supports Saudi-oriented labels, bilingual presentation, and fields where implemented. It does not claim REGA submission, Wafi approval, FAL verification, ownership verification, government registration, or legal compliance. Government workflows are external/future.

| Provider/capability | Classification | Boundary |
| --- | --- | --- |
| JWT/session, PostgreSQL, API runtime | CORE REQUIRED | Required for normal authenticated application operation. |
| Redis | CORE REQUIRED where holds, sessions, or queues are enabled | Must be isolated and verified in staging. |
| Object storage | CORE REQUIRED only when accepted upload/media workflows are released; otherwise deferred | Use only an approved existing provider. |
| Email | DISABLED FOR INITIAL RELEASE | No sender, mailbox, retry, or controlled-recipient activation. |
| Social providers | FUTURE INTEGRATION / OPTIONAL | Meta/LinkedIn are not automatic release requirements. |
| Government | FUTURE INTEGRATION / EXTERNAL PROCESS | No live government confirmation. |
| Banking/payment | FUTURE INTEGRATION / EXTERNAL PROCESS | Commercial tracking is not payment execution. |
| AI | OPTIONAL / FUTURE | Not required for the frozen release. |
| Maps | OPTIONAL | Not required by the accepted flow. |

## Personas and authorization

The implemented Commercial role identifiers are `SALES_AGENT`, `SALES_MANAGER`, and `ADMIN`/owner, with bootstrap `VIEWER` retained for read-only platform scenarios. Agents can read projects/commercial data, view published prices/payment plans, create/view/qualify/disqualify their own leads, log activities, create/release holds, and create/view customers. Managers inherit agent capabilities and add all-lead visibility, lead reassignment, and reservation confirmation. Admins add commercial management/status, price draft/create/publish, payment-plan management, and media management. UI visibility is convenience only; Nest guards, permissions, tenant scope, and ownership checks are authoritative.

The supported UAT seed is `apps/api/prisma/seed-uat.ts`. It requires privately injected passwords of at least 12 characters and defaults to synthetic tenant code `ALOMRAN`, tenant name `Alomran Development`, and `.test` email identities. It can create the UAT administrator, progress submitter, Sales Agent, and Sales Manager; it does not contain passwords. Never use production PII.

## Migration, artifact, and environment state

The transferred candidate migration set is: `0_init`, `20260812090000_commercial_domain_foundation`, `20260814000000_c02_pricing_media`, `20260814120000_c03_customer_leads`, `20260814150000_i18n_c04_holds_reservations`, `20260816123000_password_reset_email`, and `20260823130000_canonical_crm`. The canonical CRM migration is additive/non-destructive in the transferred evidence. Staging migration remains pending.

The transferred artifact was named `r4c-709ec928.tgz`, size `5,088,179` bytes, SHA-256 `883954a9de40d9c65a69c80cd1ad6662803832f717805d5feef6f0583e796f83`, built with `pnpm build`, and requires Node `>=22`, PostgreSQL, Redis where enabled, TLS/reverse proxy, and secure runtime configuration. Its correspondence to the recovered GitHub `main` tree is **not verified** because the 709 object is absent.

The secret-free environment contract uses `NODE_ENV`, `WEB_PORT`, `API_PORT`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, hold-expiry cadence, S3-compatible storage variables where required, JWT access/refresh secrets, SMTP variables if email is enabled, `WEB_APP_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, tenant defaults, UAT seed variables, rate limits, and proxy hops. Passwords, tokens, database values, and provider secrets must be supplied only through secure configuration.

## Evidence and remaining gates

Transferred local evidence reports CRM 29/29, Commercial 23/23, internal security 17/17, PostgreSQL backup/restore parity, API health/readiness, Redis health, API/web builds, responsive and RTL evidence, accessibility smoke, and R4C standalone isolation as passing. These are **reported transferred evidence**, not independently re-run against the recovered GitHub `main` clone.

Independent penetration testing is **NOT COMPLETED / EXTERNAL GATE**. Staging target authorization, deployed migration, pre-UAT staging backup, deployed persona UAT, two-tenant tenant/IDOR testing, deployed auth/session/rate-limit checks, deployed positive and negative journeys, responsive regression, and rollback rehearsal remain open. Production is **NO-GO** until source provenance is resolved and these gates pass.

## Codex continuation rules

Codex must first resolve the candidate mismatch, then qualify exactly one reviewed SHA. Do not restart product development, redesign the frontend, expand CRM scope, reopen the backend without a proven P0/P1 defect, revive RCRM as a product, couple R4C to WMS/LOGIX, create shared operational persistence, activate optional integrations, create speculative Saudi-government integrations, use production PII, or deploy production without explicit Founder authorization.

Once one candidate is selected, use the existing deployment path only if an authorized staging target is discovered. The sequence is source/artifact verification → environment preflight → database/Redis isolation → migration → pre-UAT backup → synthetic seed → Administrator UAT → Sales Manager UAT → Sales Agent UAT → two-tenant IDOR/authorization → auth/session → positive journey → negative journey → responsive regression → rollback rehearsal → independent penetration coordination → release decision package.

## Handoff files

The machine-readable continuation record is [`../r4c-codex-handoff.json`](../r4c-codex-handoff.json). The next-action prompt is [`R4C-CODEX-NEXT-ACTION.md`](R4C-CODEX-NEXT-ACTION.md), the verified command reference is [`R4C-CODEX-TEST-COMMANDS.md`](R4C-CODEX-TEST-COMMANDS.md), the secret-free environment contract is [`R4C-ENVIRONMENT-CONTRACT.md`](R4C-ENVIRONMENT-CONTRACT.md), and the resolved-issues register is [`R4C-RESOLVED-ISSUES.md`](R4C-RESOLVED-ISSUES.md). The release-boundary and staging authorization records remain [`R4C-STAGING-QUALIFICATION-REPORT.md`](R4C-STAGING-QUALIFICATION-REPORT.md) and [`R4C-STAGING-AUTHORIZATION-PACKAGE.md`](R4C-STAGING-AUTHORIZATION-PACKAGE.md) when available in the transferred evidence workspace.
