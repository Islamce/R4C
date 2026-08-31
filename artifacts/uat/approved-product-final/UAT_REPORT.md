# R4C strict UAT report — approved product restoration

Date: 2026-08-27 (Asia/Riyadh)  
Target: local release candidate on `codex/restore-approved-product`  
Production safety: the live Hostinger release was not changed during this run.

## Release decision

**Local release candidate: PASS. Production deployment: PENDING controlled promotion and post-deploy smoke test.**

The approved commercial workspace is restored as the production route implementation. The test run covered the five commercial workspaces, cross-workspace reservation synchronization, customer records, project switching, project media, team tasks, performance alerts, title-transfer governance, localization, eight-unit floor layout, mass-import contracts, report navigation, authorization contracts, TypeScript, API tests, and production build.

## Corrections made during UAT

1. Restored the approved `CommercialWorkspaceSuite` on `/commercial`; removed the accidental reduced operator-only product from the production entry.
2. Restored progress and cost report navigation.
3. Reworked mobile shell navigation to avoid the broken desktop row seen on production.
4. Completed Arabic localization in executive charts, finance summaries, selected-unit details, performance headings and financial values.
5. Normalized English project identifiers received from reservation handoff before displaying Arabic customer records.
6. Replaced the six-unit sample floor with a genuine eight-unit floor plan and mapped units A-1201 through A-1208.
7. Preserved real reservation state propagation from the unit layout into inventory and the consolidated customer pipeline.
8. Added regression assertions for the restored route, reports, eight-unit layout, project normalization, and Arabic UI.

## Live browser journeys

| Journey | Result | Evidence |
|---|---|---|
| Sales pipeline, project lists and consolidated register | PASS | `01-sales-pipeline.png` |
| Open full customer record | PASS | `02-customer-full-file.png` |
| Arabic executive overview | PASS after correction | `04-overview-localized.png` |
| Switch among the five available projects | PASS | `05-project-switching.png` |
| Eight-unit floor layout and hotspot inventory mapping | PASS after correction | source and DOM assertions |
| Create reservation from floor layout | PASS | `07-reservation-dialog.png` |
| Reservation confirmation and inventory/pipeline synchronization | PASS | `08-reservation-confirmed.png` |
| Title-transfer portfolio reconciliation (7 of 34 for selected project) | PASS | `09-transfer-readiness.png` |
| Supervisor document-by-document review gate | PASS | `10-transfer-supervisor-review.png` |
| Sales operations workflow | PASS | `11-sales-operations.png` |
| Project-linked media library and customer-email composer | PASS | `12-project-media-library.png` |
| Assign task, notify assignee and update active-task count | PASS | `13-task-assignment.png` |
| Sales-manager performance dashboard and alerts | PASS after localization correction | browser DOM verification |
| Deferred government channel contract | PASS | browser DOM verification; connection test remains disabled until authority agreement |

## Automated verification

- Web TypeScript: PASS
- Commercial workflow contract suite: **9/9 PASS**
- API build and security/governance suite: **14/14 PASS**
- Next.js optimized production build: PASS; `/commercial`, `/projects`, `/progress`, `/cost-control`, `/admin/users` and supporting routes generated successfully.
- Mass contact/campaign import: contract PASS — CSV parsing, row validation, governed customer/lead creation, campaign activity logging and API permission path are present.

## Accessibility and UI review

- Arabic root direction and logical CSS properties are present.
- Dialogs expose `role=dialog`, modal state, accessible headings and close controls.
- Primary actions are represented by semantic buttons; filters and date/CSV fields have labels.
- Mobile shell uses a compact fixed navigation surface with horizontal containment.
- Remaining English tokens in Arabic mode are limited to product/technical identifiers such as `KYNOX`, unit codes, email addresses and `API`; these are intentionally not translated.

## Controlled release gate

Promotion is allowed only after committing/pushing this candidate and deploying that exact commit. Immediately after deployment, repeat login, `/projects`, `/commercial`, reservation, `/progress`, `/cost-control`, `/admin/users`, API health and mobile-width smoke checks against `https://r4c.kynox.io`. Do not declare production accepted if the deployed SHA differs from the tested SHA.

