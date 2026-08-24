# R4C Final UI Scope

**Scope authority:** Current executable R4C source, Prisma schema/migrations, frozen backend record, and verified R4C workflows take precedence over benchmarks and the RCRM reference.

| Classification | Scope |
| --- | --- |
| REQUIRED — EXISTING WORKFLOW | Command Center, My Work, Leads, canonical Contacts, Opportunities, contextual Activities and Tasks, project/unit selling context, quotation/revision workflow, customer decisions, and reservation continuity. |
| REQUIRED — USABILITY | Deterministic attention prioritization, contextual deep links, explicit stage/status semantics, action feedback, stale/conflict handling, concise navigation, and responsive sales execution. |
| REQUIRED — SAUDI COMPATIBILITY | Arabic/English display, RTL/LTR qualification, SAR formatting, Saudi-compatible phone display, local address/name presentation where existing fields support it, and clear internal-versus-official reference labels. |
| REQUIRED — ACCESSIBILITY/RESPONSIVE | Keyboard navigation, visible focus, semantic controls, labels/errors, contrast, reduced motion, dialog focus, desktop/tablet/mobile qualification, and touch-friendly salesperson workflows. |
| DEFERRED | A dedicated global-search endpoint, live REGA/Wafi/FAL integrations, government submission, payment collection, bank processing, new AI/sequence engines, and new cross-domain aggregate backend contracts. |
| OUT OF SCOPE | WMS, LOGIX, generic ERP, HR, accounting, supply chain, logistics, marketing automation, broad CPQ, Salesforce/Dynamics cloning, and any unrelated product module. |

## Information-architecture decision

R4C will use an operating-application structure rather than a module wall. The primary navigation will emphasize **Command Center**, **My Work**, **Leads**, **Customers**, **Opportunities**, **Projects & Units**, **Quotations**, and **Reservations**. Activities and Tasks will remain contextual and appear in My Work and record timelines rather than becoming unnecessarily dominant top-level modules. Governance and administration remain permission-gated.

## Interaction boundary

Every executable control must map to a verified R4C route. Unsupported actions must be absent or explicitly marked as external/deferred; they must not show simulated success. Synthetic qualification states must be visibly labeled and must never be presented as live customer records.

## Deadline priority

P0 correctness and continuity precede P1 mobile/RTL and authorization UX, which precede P2 accessibility and visual refinement. P3 polish is deferred if it competes with P0 correctness. The final frontend target is controlled UAT readiness before 2026-08-25, while production release remains separately gated.
