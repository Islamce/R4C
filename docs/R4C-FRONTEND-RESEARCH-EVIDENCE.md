# R4C Frontend Research Evidence Ledger

## Verified benchmark findings

| Source | Accessed | Verified finding | R4C relevance |
| --- | --- | --- | --- |
| [Salesforce Sales Cloud guide](https://www.salesforce.com/sales/cloud/guide/) | 2026-08-23 | Salesforce describes a centralized sales platform organized around Leads, Accounts, Contacts, Opportunities, and Activities, with pipeline management, quoting, customer engagement, and a prioritized Sales Workspace. | Supports a compact R4C operating surface organized around customer context, pipeline, activities, tasks, quotations, and prioritized work. It does not authorize adding Salesforce-only modules or AI agents. |
| [Microsoft Learn — What is Sales accelerator?](https://learn.microsoft.com/en-us/dynamics365/sales/sales-accelerator-intro) | 2026-08-23 | Dynamics describes a tailored seller experience that minimizes search time, combines information from multiple sources, prioritizes pipeline work, and surfaces context and guided recommendations through a work list. | Supports deterministic R4C My Work prioritization and contextual action queues using only existing backend signals. It does not authorize sequences or recommendation engines absent from R4C. |

## Evidence boundary

These are UX benchmark observations, not requirements and not claims that R4C has equivalent capability. R4C remains constrained by its executable source, Prisma schema, frozen CRM contract, and existing authorization model. Unverified competitor or legal claims are excluded.

## Verified Saudi official-source findings

| Source | Accessed | Verified finding | R4C relevance |
| --- | --- | --- | --- |
| [REGA — Off-Plan Sales and Lease](https://rega.gov.sa/en/rega-services/platforms/wafi-off-plan-sales-and-lease/) | 2026-08-23 | REGA describes Wafi as an official platform for qualification requests, necessary licensing, and post-licensing services for off-plan real-estate projects; the page is offered in Arabic and English. | R4C may capture Wafi/REGA reference identifiers, document readiness, and external status links. The UI must not claim that R4C itself submits, licenses, or verifies a project. |
| [REGA — Real Estate Brokerage Contract Execution](https://rega.gov.sa/en/rega-services/eservices/real-estate-brokerage-contract-execution/) | 2026-08-23 | The official service describes steps including contract type/scope, approver information, document data, legal representation, property information, disclosure, address, price, review, and sending for approval; service language includes Arabic and English. | R4C should distinguish internal readiness and captured evidence from the external REGA workflow. It supports a bilingual, document-aware readiness view, not a fabricated government transaction. |

## Saudi evidence boundary

The sources support bilingual display, external-reference capture, structured prerequisites, document completeness, review/approval status, and explicit outbound handoff. They do not establish that R4C is legally compliant, integrated with REGA/Wafi/FAL, or authorized to execute any government process. Those states remain external references or future integrations unless separately verified.
