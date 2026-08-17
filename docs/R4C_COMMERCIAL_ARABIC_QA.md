# R4C Commercial Arabic RTL Regression QA

## Scope

This regression reviewed the Arabic/RTL presentation of the newly added commercial live-summary and decision-queue surfaces, then extended validation into inventory, title-transfer, and sales-operations preview surfaces. All checks were read-only. No lead, hold, reservation, customer, status, or transfer record was created or changed.

## Findings and correction

A verified localization gap existed in the new derived exception cards. The backend returns canonical English `title`, `reason`, and `nextAction` metadata. Rendering `reason` and `nextAction.label` directly would have exposed English content in an Arabic decision queue. `CommercialWorkspaceSuite` now derives Arabic title, reason, and action text from the stable supported exception types: `STALE_LEAD` and `EXPIRING_HOLD`. It preserves canonical exception IDs and backend evidence while presenting Arabic operator copy.

The preview Sales operations workspace also contained English-only labels and messages exposed after switching tabs. The corrective patch localizes the lead-capture confirmation, project/opportunity labels, evidence label/value, selected-inventory labels, availability state, timeline confirmation, and linked-unit action.

| Surface | Arabic status | Evidence |
|---|---|---|
| Command center shell | Pass | Connected-browser Arabic toggle previously displayed Arabic heading, context labels, metrics, and decision queue. |
| Live freshness and exception empty state | Pass | `معاينة`, `الاستثناءات الحية`, `لا توجد استثناءات محكومة نشطة`, and the deterministic-rule empty message were rendered in Arabic. |
| Derived stale-lead exception | Corrected in source | Arabic title, aging reason, and `فتح العميل المحتمل` action are now computed from the stable exception code. |
| Derived expiring-hold exception | Corrected in source | Arabic pending/expired reason and `مراجعة الحجز المؤقت` action are now computed from severity and stable exception code. |
| Inventory and selected-unit workflow | Source and prior browser QA pass | Existing localized controls, status labels, selected-unit drawer, and canonical unit identifiers remain unchanged. |
| Title-transfer workflow | Prior browser QA pass | Arabic title-transfer screen had been captured during prior closeout; governed handoff language remains Arabic. |
| Sales operations preview | Corrected in source | Newly identified English labels/notices are localized. |

## Runtime QA limitation

The connected browser successfully rendered the local preview and previously completed Arabic locale switching, but subsequent My Browser inspection calls intermittently returned extension timeouts. The remote preview proxy also served several client runtime asset 404s to headless Chromium, preventing React hydration and therefore headless tab switching. The production-build standalone server started, but its packaged root returned a Next.js 404 for `/design-preview` in this sandbox. This is an environment/runtime QA limitation, not a source compilation failure.

The source-level Arabic correction is validated by TypeScript compilation and the browser page’s rendered Arabic executive text. Full post-deployment Arabic tab regression remains required after the updated commit is deployed to the normal hosting runtime, where the authenticated production browser can exercise the live route and real exceptions.

## Required post-deployment checks

1. Switch the authenticated `/commercial` workspace to Arabic and verify `dir="rtl"`.
2. Exercise a real `STALE_LEAD` and `EXPIRING_HOLD` exception using safe seeded/UAT data only; confirm Arabic title, reason, action, and deep-link route.
3. Open Project & unit control, selected-unit drawer, Title transfer file, and Sales operations.
4. Verify mixed Arabic/canonical strings: unit code, SAR, dates, buyer contact fields, and system identifiers remain readable in RTL.
5. Confirm no production mutation occurs during read-only validation.
