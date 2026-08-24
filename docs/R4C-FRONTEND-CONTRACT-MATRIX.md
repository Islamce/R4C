# R4C Frontend Contract Matrix

**Baseline:** R4C commit `e3e4aae55649fe96167426a3deb06d38524cf722`, verified against current source on 2026-08-23. The backend CRM contract is frozen; adding the frontend proxy allowlist is an integration task, not a backend/domain change.

| Surface | User action | Required backend contract | Exists? | Authorization | UI decision |
| --- | --- | --- | --- | --- | --- |
| Command Center | View assigned work summary | Existing Lead, task, opportunity, quotation, hold, reservation reads | SUPPORTED WITH EXISTING COMPOSITION | Existing route permissions plus `crm:read` where CRM data is included | Build deterministic attention queue; label source and empty states. |
| Leads | List, filter, open lead | Existing `/commercial/leads` and `/commercial/leads/all` | SUPPORTED | Existing commercial lead read permission | Preserve current lead API and context. |
| Leads | Advance, disqualify, reassign, log legacy activity | Existing commercial write routes | SUPPORTED | Existing commercial permissions | Keep existing workflow; do not duplicate it with fake CRM mutations. |
| Leads | Convert lead to contact | `POST /crm/leads/:leadId/convert` | SUPPORTED after frontend proxy allowlist | `crm:write` | Show idempotent conversion state and linked contact. |
| Contacts | List and create contact | `GET/POST /crm/contacts` | SUPPORTED after frontend proxy allowlist | `crm:read`, `crm:write` | Build canonical Contact view; distinguish Customer identity from Contact. |
| Opportunities | List, create, and change stage | `GET/POST /crm/opportunities`, `PATCH /crm/opportunities/:id/stage` | SUPPORTED after frontend proxy allowlist | `crm:read`, `crm:write` | Use actual stages and disable invalid transitions as UX assistance. |
| Activities | List and create contextual activity | `GET/POST /crm/activities` | SUPPORTED after frontend proxy allowlist | `crm:read`, `crm:write` | Keep Activity as what happened; contextual timeline first. |
| Tasks | List, create, and complete/update status | `GET/POST /crm/tasks`, `PATCH /crm/tasks/:id/status` | SUPPORTED after frontend proxy allowlist | `crm:read`, `crm:write` | Use My Work and contextual task views; show assignee, due date, priority, status. |
| Quotations | Create quotation with revision 1 | `POST /crm/quotations` | SUPPORTED after frontend proxy allowlist | `crm:write` | Provide real submission with loading, success, and server error states. |
| Quotations | Create a new revision | `POST /crm/quotations/:id/revisions` | SUPPORTED after frontend proxy allowlist | `crm:write` | Historical revisions read-only; new revision is explicit. |
| Quotations | Approve or send revision | `PATCH /crm/quotation-revisions/:id/status` | SUPPORTED after frontend proxy allowlist | `crm:approve` | Enforce approval-before-send in UI while relying on server authority. |
| Customer decision | Record accepted/declined/expired/revision requested | `POST /crm/quotation-revisions/:id/decision` | SUPPORTED after frontend proxy allowlist | `crm:write` | Clearly separate decision from reservation, payment, contract, and government registration. |
| Project/unit | Navigate hierarchy and view availability/pricing | Existing project and commercial inventory endpoints | SUPPORTED | Existing project/commercial permissions | Preserve Project → Phase → Building → Floor → Unit. |
| Reservation | Create hold, cancel, confirm reservation | Existing commercial hold/reservation endpoints | SUPPORTED | Existing commercial reservation permissions | Availability remains authoritative; no inference from opportunity or quotation state. |
| Customer 360 | Aggregate customer/contact/lead/opportunity/activity/task/quotation/reservation context | No single R4C aggregate endpoint verified | SUPPORTED WITH EXISTING COMPOSITION | Per-source permissions required | Compose only from verified reads; no unauthorized metadata leakage. |
| Global search | Search canonical CRM entities | No authoritative R4C global-search endpoint verified | NOT SUPPORTED | N/A | Do not expose a search control that implies a missing API. |
| Government workflow | Submit REGA/Wafi/FAL action | No authorized integration verified | OUT OF SCOPE | N/A | Show internal readiness, official references, and external handoff only. |
| Synthetic demo | Run illustrative scenario | Existing test harness only; no production mutation | SUPPORTED AS SYNTHETIC | Clearly labeled | Never mix synthetic records with live runtime state. |

## Proxy requirement

The existing Next.js backend proxy currently allowlists legacy `commercial/*` paths but not the frozen `/crm` surface. The frontend implementation may add exact `/crm` read/write patterns to this proxy. This is required to expose an already-existing backend contract and does not reopen the domain freeze.
