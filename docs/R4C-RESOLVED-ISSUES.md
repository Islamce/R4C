# R4C Resolved-Issues Register

This register prevents solved issues from being reopened during continuity transfer. Each item is marked **RESOLVED** based on the prior qualification record supplied with this handover; the recovered GitHub clone is not treated as proof of the unavailable `709ec928...` candidate.

| Issue | Status | Resolution boundary |
| --- | --- | --- |
| Next.js `NODE_ENV` / `/404` production-build failure | RESOLVED in transferred candidate evidence | The prior release qualification recorded the production build as passing. Re-verify if `main` is selected as the replacement candidate. |
| BigInt HTTP serialization on Opportunity values | RESOLVED in transferred candidate evidence | The prior candidate added contract-preserving serialization. Re-verify if `main` is selected as the replacement candidate. |
| Mobile Sales two-column collapse | RESOLVED in transferred candidate evidence | The prior candidate changed the <=680px composition to intentional one-column normal flow. Do not redesign. |
| Stale `/api/projects` journey assertion | RESOLVED as harness disposition | The assertion was retired from the accepted surface; compatibility routing is not evidence of deployed qualification. |
| Temporary checkout/API mismatch | RESOLVED in transferred candidate evidence | The prior candidate recorded the mismatch as resolved; re-run against the selected current candidate. |
| Visual form-wall reset | RESOLVED in transferred candidate evidence | The prior Sales Command Center moved to contextual actions/drawers; do not reintroduce a form wall. |
| RCRM/R4C identity ambiguity | RESOLVED by product boundary | R4C is the authoritative standalone product. RCRM is reference/engineering history, not a separate product or runtime dependency. |

## Non-blocking or deferred items

The following are not application blockers for this handover but remain explicit boundaries: optional email, social, government, banking/payment, AI, and maps integrations; historical evidence artifacts; old Autoprefixer warnings if reproduced; BIM/Development Intelligence capability outside the Commercial MVP; and local synthetic-only evidence that cannot be relabeled as staging evidence.
