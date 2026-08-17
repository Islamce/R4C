# G9 Founder Authorization Decision — Buyer Sales Quotation MVP

**Decision recorded:** 2026-08-17 UTC  
**Decision owner:** Founder  
**Decision:** **AUTHORIZED**  
**Approved executable SHA:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`  
**Approved environment:** Hostinger managed production — `https://r4c.kynox.io` and `https://r4c-api.kynox.io`

The Founder replied **“authorize”** in response to the explicit G9 request for the buyer sales-quotation MVP. This approval is limited to the exact executable SHA and production environment stated above.

> Authorization permits controlled pre-deployment verification and, only if all stated provider preconditions are satisfied, release of the approved SHA. It does not authorize any other commit, merge to `main`, `prisma db push`, unverified production migration, provider configuration change, live customer message, automatic hold/reservation, procurement RFQ, buyer Flutter application, or server-side PDF generation.

## Continuing Controls

| Control | Required treatment |
|---|---|
| Exact source identity | Verify the deployable web and API artifacts correspond to the approved SHA before release. |
| Database change | Inspect production migration state first. If the quotation migration is absent, run only the approved migration path with the direct production connection and record the result. |
| Provider services | Do not change Neon, Upstash, R2, or Hostinger configuration without explicit evidence and a bounded release action. |
| Customer impact | Do not send email, SMS, push, or buyer notifications; do not create a hold, reservation, invoice, or payment obligation. |
| Runtime validation | Complete non-mutating health, version/SHA, and authenticated role checks after release where provider access permits. |
| Stop condition | Stop and report immediately if exact-SHA, migration, environment, or health evidence differs from the approved scope. |

## References

[1]: https://github.com/Islamce/R4C/pull/74
[2]: https://r4c.kynox.io/api/health
[3]: https://r4c-api.kynox.io/api/v1/health/ready
