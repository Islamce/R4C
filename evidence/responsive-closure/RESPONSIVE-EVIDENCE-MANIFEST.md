# R4C Responsive Evidence Manifest

**Qualification date:** 23 August 2026  
**Repository:** `/home/ubuntu/R4C`  
**Branch:** `master`  
**HEAD/base SHA:** `cce16216e5b835959300de4d3537a10429320117`  
**Candidate state:** Working tree on the stated base SHA with intentional uncommitted frontend, test, documentation, and evidence changes. No backend or contract paths changed.

## Intentional candidate changes

| Path | Purpose |
| --- | --- |
| `apps/web/app/sales.css` | <=680px single-flow Sales composition, full-width panels, stage/action/task reflow, mobile sheets |
| `apps/web/app/shell.css` | Compact mobile navigation and authenticated-shell responsive rules |
| `apps/web/components/AppShell.tsx` | Existing-destination mobile navigation treatment |
| `apps/web/components/SalesCommandCenter.tsx` | Existing quotation drawer access from Opportunity context |
| `apps/web/app/(authenticated)/projects/page.tsx` | Frontend-only compatibility entry to the existing commercial workspace |
| `apps/web/test/crm-ui-contract.test.mjs` | Responsive composition contract guardrails |
| `docs/R4C-FRONTEND-FINAL-HANDOFF.md` | Current responsive closure addendum |
| `docs/R4C-VISUAL-RESET-EVIDENCE.md` | Current image-level closure addendum |
| `todo.md` | Closure ledger reconciliation |

## Rendered evidence

| State | Screenshot | Result |
| --- | --- | --- |
| English/LTR desktop | `sales-en-1440x900.png` | PASS — accepted composition preserved |
| English/LTR tablet | `sales-en-1024x768.png` | PASS — deliberate tablet state |
| English/LTR mobile | `sales-en-390x844.png` | PASS — one normal-flow column, full-width Opportunity |
| Arabic/RTL desktop | `sales-ar-1440x900.png` | PASS — RTL shell and operating surface |
| Arabic/RTL tablet | `sales-ar-1024x768.png` | PASS — RTL tablet state |
| Arabic/RTL mobile | `sales-ar-390x844.png` | PASS — one normal-flow RTL column |

All six captures use the same populated synthetic state: one task, one active Opportunity, customer/project/unit context, activity history, and populated signals. The browser-only fixture is isolated to the temporary UAT harness because the current disposable API workspace does not expose the frontend CRM read paths; it does not alter the product or backend contracts.

## Machine-supported evidence

| Gate | Evidence | Result |
| --- | --- | --- |
| Responsive browser harness | `responsive-browser-results.json` | PASS |
| Geometry | `responsive-browser-results.json` | PASS — no major-surface intersections, no outside-viewport surfaces, no mobile narrow panels, no stage clipping |
| Drawer matrix | `responsive-browser-results.json` | PASS — Contact, Opportunity, Activity, Task, Quotation all opened; focus containment and Escape close passed |
| Practical accessibility | `responsive-browser-results.json` | PASS — 19 controls, zero unnamed, zero below 40px |
| Reduced motion | `responsive-browser-results.json` | PASS |
| Frontend contract suite | `frontend-contract-suite.txt` | PASS — 6/6 |
| Frontend typecheck | `frontend-typecheck.txt` | PASS |
| Production build | `frontend-build.txt` | PASS — 12/12 generated pages |
| Diff hygiene | `git-diff-check.txt` | PASS |

## Image-review evidence

The criterion-level findings are preserved in `visual-findings-mobile-2026-08-23.txt`, `visual-findings-desktop-tablet-2026-08-23.txt`, and `visual-findings-arabic-desktop-tablet-2026-08-23.txt`. The authoritative concise report is `R4C-EMERGENCY-RESPONSIVE-CLOSURE-REPORT.md`.

## Decision boundary

The prior status is preserved as **FOUNDER PREVIOUS FREEZE: REVOKED — Founder rendered mobile review failure**. The new image-level review passes Desktop, Tablet, Mobile English, Mobile Arabic, Responsive Product UX, KYNOX visual alignment, Modern CRM UX, and practical accessibility. The frontend candidate is therefore **FROZEN** for the accepted Sales surface at the current candidate state, with **PRODUCTION: NO-GO**. The stale `/api/projects` assertion in the broad legacy journey remains a separate test-maintenance item outside the accepted `/commercial` and `/sales` surface.
