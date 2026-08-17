# Buyer Sales Quotation MVP — Authorized Production Pre-Deployment Baseline

**G9-approved executable SHA:** `c219a46c7a9c875a9600dd12b9795970014fbf0e`  
**Authorization recorded:** 2026-08-17 UTC  
**Baseline time:** 2026-08-17 12:34:39–12:35:29 UTC  
**Classification:** **DEPLOYMENT VALIDATION BLOCKED — PUBLIC RUNTIME HEALTHY**

## Public Runtime Baseline

Three non-mutating rounds were recorded at ten-second intervals. The web root consistently returned a `307` redirect, while the web health endpoint and both API health endpoints returned `200`. API readiness consistently reported a ready service and an available database dependency. API uptime increased from 51,847 to 51,886 seconds over the observation window, which is consistent with a stable running API process during this short baseline.

| Round | Web root | Web health | API health | API readiness | Readiness database latency |
|---:|---|---|---|---|---:|
| 1 | 307, 2.930 s | 200, 2.310 s | 200, 2.374 s | 200, 3.834 s | 632 ms |
| 2 | 307, 2.837 s | 200, 1.564 s | 200, 1.952 s | 200, 2.871 s | 647 ms |
| 3 | 307, 2.945 s | 200, 2.203 s | 200, 1.629 s | 200, 2.685 s | 636 ms |

> The observed readiness response proves only that the currently deployed API can reach a database. It does not establish the deployed source SHA, the Prisma migration state, or the intended candidate’s deployment status.

## Exact-SHA and Provider Gate

The authorized provider-console inspection is blocked. `https://hpanel.hostinger.com/login` presented a CAPTCHA and the hosted browser could not load an interactive authenticated panel. No deployment, restart, migration, seed, configuration change, or provider mutation was attempted.

| Required gate | Status | Causal blocker or evidence |
|---|---:|---|
| Exact deployed web/API SHA | Blocked | Hostinger deployment console unavailable behind CAPTCHA. |
| Completed provider deployment record | Blocked | Hostinger deployment console unavailable behind CAPTCHA. |
| Production Prisma migration status | Blocked | No private execution context with preconfigured production database variables; no connection string was requested or exposed. |
| Live CSS/static-asset URL | Not run | A post-deployment static-asset check is not meaningful until exact deployment identity is established. |
| Upstash Redis / R2 boundary | Not run | Provider configuration and safe synthetic test boundary unavailable. |
| Authenticated role UAT | Not run | No authenticated provider-backed synthetic test user session available. |
| Customer-impacting action | Not run | Explicitly prohibited by the approved scope. |

## Required Safe Remediation

A user-controlled Hostinger session or an already-configured private deployment terminal is required to resume. The minimum evidence needed is a sanitized deployment view showing the web/API application deployment controls, the active revision/commit, and non-secret environment-variable names. If the approved SHA is not active, the deployment operator may release only the approved SHA. Before any migration, the operator must run the committed Prisma migration workflow in the private preconfigured environment and record only the sanitized result.

## References

[1]: https://r4c.kynox.io/
[2]: https://r4c.kynox.io/api/health
[3]: https://r4c-api.kynox.io/api/v1/health
[4]: https://r4c-api.kynox.io/api/v1/health/ready
[5]: https://hpanel.hostinger.com/login
