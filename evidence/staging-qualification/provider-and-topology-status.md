# R4C Staging Qualification — Provider and Topology Status

**Date:** 23 August 2026  
**Candidate:** `cce16216e5b835959300de4d3537a10429320117`  
**Classification:** synthetic-data-only, non-production qualification

## Provider classification

| Capability or dependency | Classification | Evidence-based boundary |
| --- | --- | --- |
| PostgreSQL | CORE REQUIRED | Canonical Prisma persistence, tenant relationships, CRM, Commercial, quotation, reservation, and audit records. |
| Redis | CORE REQUIRED where hold expiry, session, or queue behavior is enabled | Disposable runtime exposes Redis for the tested hold/session boundary; staging must verify the approved service. |
| JWT and tenant RBAC | CORE REQUIRED | Implemented in the R4C API; no separate external identity provider is required by the frozen candidate. |
| TLS, reverse proxy, Node runtime, health/readiness routing | CORE REQUIRED for staging/deployed qualification | Must be verified on the authorized deployment target. |
| Durable object storage | CORE REQUIRED for enabled document/media upload workflows; otherwise disabled for a narrower release | The candidate contains storage boundaries, but no authorized staging provider or bucket was identified in the current configuration. |
| Email | DISABLED FOR INITIAL RELEASE | Quotation email delivery is not activated; no sender, credentials, retry path, or controlled recipient is authorized in this qualification. |
| Meta/LinkedIn social | FUTURE INTEGRATION | Not a release requirement for the accepted R4C CRM/Sales candidate. |
| Saudi government services such as REGA/Wafi/FAL | FUTURE INTEGRATION / EXTERNAL PROCESS | No live government integration or compliance confirmation is claimed. |
| Banking, escrow, payment, and settlement | FUTURE INTEGRATION / EXTERNAL PROCESS | Commercial tracking and payment-plan records do not constitute live payment execution. |
| AI/LLM | OPTIONAL / DISABLED FOR INITIAL RELEASE | No AI activation is required to qualify the frozen CRM/Sales release. |
| Maps | OPTIONAL / FUTURE INTEGRATION | No map provider is required for the accepted release journey. |
| WMS and LOGIX | NOT REQUIRED; standalone boundary | R4C normal operation does not depend on either portfolio. |

## Staging topology result

The repository defines the API and web runtime contracts, Node `>=22`, the Prisma migration set, and a Dockerfile for the API. The current task configuration contains no Hostinger/staging deployment connector, staging URL, deployment identifier, or approved staging credentials. The available deployment-related connector search returned only a Vercel management capability and no R4C staging target. Therefore the deployed-environment workstream is **blocked at target authorization**, not at an application defect.

No production endpoint was contacted, no production deployment was attempted, and no new cloud product, database, authentication service, storage service, or VPS was introduced. Local disposable qualification remains valid evidence for the local RC only; it cannot be relabeled as deployed staging evidence.

## Required unblock

Provide or enable an authorized non-production deployment target with its approved source/branch, web and API endpoints, isolated database, Redis configuration where required, storage configuration where upload workflows are in scope, and deployment access through the approved runtime strategy. Credentials must be supplied through the secure configuration path and must not be placed in chat, source, or evidence files. Once available, continue with migration, pre-UAT backup, deployed persona UAT, tenant/IDOR testing, rollback rehearsal, and staging responsive regression.
