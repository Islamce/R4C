# R4C UAT rerun — 26 August 2026

## Executive verdict

**NOT ACCEPTED / FAIL.** The current release candidate has working preview interactions and a consistent desktop shell, but it is not fit for UAT sign-off because the mobile layout breaks horizontally, the Sales Operations title fails basic contrast, and Arabic mode still contains untranslated English captions.

This rerun was performed against local `/design-preview` at commit `85086c4a1cb7c3cdd2a1e248457d8287432e0b39`. The preview uses synthetic, non-persistent data. A successful preview interaction is therefore not evidence that the production API persisted the transaction.

## Comparison with the previous UAT

Previous result: **10 PASS, 1 FAIL, 2 BLOCKED, 1 PENDING, 5 OPEN, 1 EXTERNAL GATE** across UAT-R4C-001–020.

| Previous case | Previous result | Current result | Comparison |
| --- | --- | --- | --- |
| UAT-R4C-001 Arabic labels | PASS | **FAIL** | Regression/insufficient coverage: Arabic mode still shows `Portfolio current view` in six KPI cards. |
| UAT-R4C-002 English mode | PENDING | **PASS in preview** | English project/unit screen is consistently English; the only Arabic text is the language-switch label `العربية`. |
| UAT-R4C-003–008 core browsing and interest flow | PASS | **PASS in preview** | Primary tabs, project switching, unit selection, customer file and interest form respond. Persistence was not proven. |
| UAT-R4C-009 availability mismatch | FAIL | **Source/contract PASS; live production not rerun** | Fix and automated checks exist, but this local preview cannot prove production inventory reconciliation. |
| UAT-R4C-010 reservation | BLOCKED | **PASS in preview; production BLOCKED** | A-1201 can be temporarily reserved in preview. API persistence, price and payment plan remain outside this evidence. |
| UAT-R4C-011–013 transfer workflow | PASS | **PASS in preview** | Transfer view, file controls, manager review and deferred government integration UI are visible and interactive. |
| UAT-R4C-014 native CSV chooser | BLOCKED | **BLOCKED** | Native file selection and ingestion were not completed in this browser run. |
| UAT-R4C-015 preview/data ambiguity | OPEN | **PARTIALLY IMPROVED** | Preview mode is explicit, but its synthetic success must not be reported as operational persistence. |
| UAT-R4C-016 previous shell inconsistency | OPEN | **PASS on desktop; FAIL on mobile** | Desktop shell is unified. Mobile shell is unusable due to overflow. |
| UAT-R4C-017 bulk import atomicity/idempotency | OPEN | **OPEN** | No new evidence of transactional import or idempotency. |
| UAT-R4C-018 campaign consent provenance | EXTERNAL GATE | **EXTERNAL GATE** | Unchanged. |
| UAT-R4C-019 import template/error export | OPEN | **OPEN** | Unchanged. |
| UAT-R4C-020 large-file progress/limits | OPEN | **OPEN** | Unchanged. |

## Current rerun cases

| ID | Scenario | Result | Evidence / observation |
| --- | --- | --- | --- |
| UAT2-001 | Unified KYNOX desktop shell | PASS | Compact icon sidebar and modern header are consistent across the five commercial tabs. |
| UAT2-002 | Five primary commercial tabs | PASS | Sales Pipeline, Executive Overview, Project & Unit Control, Title Transfer File and Sales Operations all switch successfully. |
| UAT2-003 | Responsive mobile layout (390×844) | **FAIL — P0** | Severe horizontal overflow; sidebar becomes a wide canvas, header/content detach and user identity is clipped. |
| UAT2-004 | Arabic localization | **FAIL — P1** | Six KPI cards retain `Portfolio current view`; phase content also wraps poorly. |
| UAT2-005 | English localization | PASS | No Arabic content found beyond the intentional `العربية` language toggle. |
| UAT2-006 | Open full customer file | PASS | Button opens the customer detail modal. |
| UAT2-007 | Record interest | PARTIAL | Form opens and success feedback appears. It is preview-only, and the visible modal lacks dialog semantics (`role=dialog`/`aria-modal`). |
| UAT2-008 | Create temporary reservation | PARTIAL | A-1201 can be selected and reserved in preview. Production persistence is not demonstrated. |
| UAT2-009 | Transfer totals reconciliation | PASS | View states `7 of 34` records, resolving the apparent list/summary mismatch. |
| UAT2-010 | Per-document upload controls | PARTIAL | `Upload / replace` controls are visible per document; actual ingestion was not completed. |
| UAT2-011 | Manager review interface | PASS | Manager review modal opens and exposes document-by-document review actions. |
| UAT2-012 | Deferred government integration interface | PASS | Configuration dialog opens and accurately describes the integration as deferred. |
| UAT2-013 | Sales Operations visual accessibility | **FAIL — P1** | Main Arabic hero title uses dark blue on dark navy and is barely readable. |
| UAT2-014 | Typography and information density | **FAIL — P2** | Current-phase KPI wraps awkwardly; several screens consume excessive vertical space before operational content. |
| UAT2-015 | Interest modal semantics | **FAIL — P2** | Visible modal is not exposed as a dialog to assistive technology. |
| UAT2-016 | Browser console | PASS | No console errors were observed during the tested flows. |
| UAT2-017 | Multiple projects | PASS | Five projects are present and selectable in Project & Unit Control. |
| UAT2-018 | Authenticated production users/access | BLOCKED | This rerun used the development preview and did not have an authenticated production session. |

## Design defects requiring correction

1. **P0 — Mobile layout failure:** implement a true mobile navigation pattern, remove fixed-width canvas behavior, prevent document-level horizontal scrolling, and validate at 390×844 and 430×932.
2. **P1 — Sales Operations contrast:** replace the dark title color with the approved high-contrast KYNOX text token and validate to WCAG AA.
3. **P1 — Arabic localization:** translate `Portfolio current view` and audit all Arabic surfaces with automated locale-key coverage.
4. **P2 — KPI typography:** prevent semantic values such as “الهيكل الإنشائي” from breaking into an unstable multi-line block; rebalance card width/type scale.
5. **P2 — Modal accessibility:** add `role="dialog"`, `aria-modal="true"`, an accessible title, focus trapping and focus return.
6. **P2 — Desktop density:** reduce header/hero height and bring the first operational action above the fold without removing required context.

## Release recommendation

Do not approve or deploy this candidate as the accepted UAT release. Correct UAT2-003, UAT2-004 and UAT2-013 first, then rerun visual regression at desktop, tablet and mobile widths. Separately rerun authenticated production/API tests for inventory availability, interest persistence, reservation persistence, uploads and role-based access; preview results cannot close those gates.

## Evidence index

- `01-sales-pipeline.png` — desktop Sales Pipeline
- `02-executive-overview.png` — desktop Executive Overview
- `03-project-units.png` — Arabic KPI localization and wrapping
- `04-title-transfer.png` — transfer totals and list scope
- `05-sales-operations.png` — low-contrast title
- `06-project-units-862.png` — compact viewport
- `07-project-units-mobile.png` — mobile layout failure
- `08-customer-file-modal.png` — customer file modal
- `09-interest-dialog.png` — interest form
- `10-reservation-dialog.png` — reservation form
- `11-manager-review.png` — manager review
- `12-english-project-units.png` — English locale verification
