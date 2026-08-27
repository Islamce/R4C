# R4C UAT remediation rerun — 27 August 2026

## Verdict

**Visual acceptance blockers fixed locally. Operational production acceptance remains gated.**

The rerun used the development-only `/design-preview` surface after the fixes based on commit `b969670`. It validates layout, localization, contrast and dialog semantics; it does not prove API persistence or production RBAC.

## Comparison with 26 August failures

| Case | 26 August | 27 August rerun | Evidence |
| --- | --- | --- | --- |
| UAT2-003 mobile layout | FAIL — P0 | PASS locally | At 390×844, document `scrollWidth` and `clientWidth` were both 375 CSS pixels. Navigation scroll is contained inside its component. |
| UAT2-004 Arabic localization | FAIL — P1 | PASS for identified defect | `Portfolio current view` count is zero in Arabic Project & Unit Control; Arabic caption is rendered instead. Preview-mode and ADMIN labels are localized. |
| UAT2-013 Sales Operations contrast | FAIL — P1 | PASS locally | Main title now uses white text on the KYNOX navy background. |
| UAT2-014 KPI typography/density | FAIL — P2 | PASS for identified KPI defect | Metrics use two equal mobile columns, smaller type and non-breaking Arabic semantic values. |
| UAT2-015 interest modal semantics | FAIL — P2 | PASS | Browser role query finds one dialog with its labelled heading. Reservation received the same semantics. |

## Automated verification

- Web TypeScript check: PASS.
- Commercial workflow contracts: PASS, 9/9.
- Next.js production build: PASS; existing unrelated `cost-control.css` autoprefixer compatibility warnings remain.
- Browser console errors during the corrected visual paths: none observed.

## Remaining release gates

1. Deploy the exact candidate to an approved non-production or production target.
2. Authenticate with real ADMIN, SALES_MANAGER and SALES_AGENT sessions.
3. Verify inventory reconciliation against the API, then persist interest and reservation records and retrieve them from the customer/project views.
4. Complete a real file upload and bulk CSV import, including row-level failure evidence.
5. Rerun responsive acceptance at 390×844, 430×932, 768×1024 and desktop against the deployed SHA.

Until those checks pass, the release is visually corrected but not operationally accepted.
