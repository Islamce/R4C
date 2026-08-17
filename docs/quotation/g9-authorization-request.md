# G9 Founder Authorization Request — Buyer Sales Quotation MVP

**Requested decision owner:** Founder  
**Decision status:** **AWAITING EXPLICIT RESPONSE**  
**Exact reviewed SHA:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`  
**Review branch:** `feat/commercial-command-center-hardening`  
**Pull request:** [#74](https://github.com/Islamce/R4C/pull/74)

> «**AUTHORIZE / DECLINE** production deployment of exact SHA `c219a46c7a9c875a9600dd12b9795970014fbf0e` to **Hostinger managed production — `https://r4c.kynox.io` and `https://r4c-api.kynox.io`**. Authorization applies only to this SHA, this environment, and the governed buyer sales-quotation MVP scope recorded below. It does not authorize any other commit, merge, migration, provider configuration change, live notification, automatic hold/reservation, procurement RFQ, buyer Flutter application, or server-side PDF generation.»

## Authorization Basis

The review branch has a clean worktree and all currently configured PR checks passed on the requested SHA. Local qualification passed API and web type checks, focused quotation tests, commercial workflow tests, WBS service tests, a seed/API end-to-end test, production dependency audit, monorepo build, and a disposable PostgreSQL migration rehearsal. The buyer quotation migration was applied only to the local disposable database; no production schema was inspected or changed.

| Decision item | Current evidence | Scope limit |
|---|---|---|
| Repository CI | PR #74 reports 12 successful checks and one intentionally skipped announce check for this SHA. | CI is not a Hostinger deployment. |
| Buyer quotation lifecycle | Negative token, state, concurrency, authorization, tenant-isolation, and clarification-comment tests passed. | No authenticated production tenant evidence. |
| Responsive presentation | English and Arabic evidence passed at 1440, 1024, 768, 430, and 360 pixels. | Evidence uses explicitly labelled local synthetic UAT fixtures. |
| Migration | Seven migrations applied and reported up to date in isolated local PostgreSQL. | Neon status and migration execution are unverified and not authorized by this request alone. |
| Document control | UI/API truthfully presents a controlled HTML preview. | No PDF generation, storage, legal signature, or document delivery exists. |
| Shared hosting | Production Node application builds; no VPS or worker is required by the approved scope. | Hostinger, Upstash, R2, and Neon runtime configuration remain provider-access blocked. |

## Required Post-Authorization Execution Boundary

If and only if the Founder responds **AUTHORIZE**, the deployment operator must first capture provider-console evidence for the exact web/API SHA and review the production migration state. Any production migration must be separately logged against the approved SHA and direct Neon connection, with rollback/backup evidence. The operator must then run non-mutating health and authenticated role checks. If any evidence diverges from this request, work stops and a new G9 request is required.

If the Founder responds **DECLINE**, no production action is taken. The branch and evidence remain available for review, and any revised scope must receive a new exact-SHA request.

## Explicit Non-Authorization

This request does not authorize merge to `main`, a deployment by itself, a direct production database command, `prisma db push`, a production migration without recorded verification, live customer communications, inventory mutation, acceptance-to-reservation automation, procurement RFQ, Flutter buyer application work, or an HTML preview being represented as a PDF.

## References

[1]: https://github.com/Islamce/R4C/pull/74
[2]: https://r4c.kynox.io/api/health
[3]: https://r4c-api.kynox.io/api/v1/health/ready
