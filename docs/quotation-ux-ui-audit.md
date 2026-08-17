# Quotation UX/UI Audit

**Scope:** internal quotation workspace, controlled document preview, buyer decision page, Arabic/RTL buyer path, and Flutter sales-companion design preview. All visual review used **synthetic/UAT-only** local surfaces; no production information, customer communication, or API-backed decision was submitted.

## Executive assessment

The implementation presents a cohesive governed-commercial experience. The internal screen clearly separates draft preparation, approval evidence, document preview, payment schedule, and decision governance. The buyer page gives the price, validity, schedule, terms, and no-reservation condition appropriate prominence before any decision. The mobile presentation is readable and uses full-width decision controls with appropriate visual separation.

The audit found two material UX issues: the synthetic internal document-preview action did not actually open the preview, and the Flutter offline screen did not show its safe-sync explanation. Both were corrected. Several lower-risk clarity and accessibility refinements were also completed: explicit expired wording, selected-decision guidance, mandatory clarification input, descriptive icon/close labels, modal semantics, and Escape-to-close support.

## Findings and resolution

| ID | Severity | Surface | Finding | Resolution | Result |
|---|---|---|---|---|---|
| UX-01 | High | Internal quotation UAT | The **Open PDF preview** control showed only a status message in synthetic mode, creating a false affordance. | The control now opens the same snapshot-derived controlled document dialog in synthetic mode. | Resolved and interaction-tested. |
| UX-02 | Medium | Flutter design preview | The offline state exposed a retry control without explaining the safe offline behavior. | Added localized copy explaining that a draft is saved locally and pricing is never recalculated offline. | Resolved and interaction-tested. |
| UX-03 | Medium | Buyer expiry | The expired state used wording intended for a completed decision. | Added explicit expiration title and next-step wording directing the buyer to request an updated quotation. | Resolved and interaction-tested. |
| UX-04 | Medium | Buyer decisions | Acceptance, decline, and clarification lacked immediate consequence guidance; clarification did not visibly require a message. | Added live selected-decision guidance, `aria-pressed` state, and a required clarification field. | Resolved and interaction-tested. |
| UX-05 | Low | Controlled document dialogs | Close icons had no descriptive accessible name and neither surface supported Escape. | Added modal semantics, descriptive close labels, and Escape-to-close handling. | Resolved and interaction-tested. |
| UX-06 | Low | Internal draft form | Raw canonical identifiers are necessary for the current API contract but had no contextual explanation. | Added guidance that IDs must come from governed lead/payment-plan records and are revalidated server-side. | Resolved and visually verified. |

## Revalidation evidence

| Check | Result |
|---|---|
| Staff workspace and synthetic document dialog | Passed. The document preview opens and closes via accessible labelled control. |
| Buyer document dialog | Passed. Escape closes the dialog and the control has a meaningful accessible name. |
| Buyer acceptance | Passed. The decision receipt preserves the no-hold/no-reservation/no-payment boundary. |
| Buyer clarification | Passed. Selection guidance appears and message entry is required. |
| Buyer expiration | Passed. No decision control is present; expiry-specific next-step wording is shown. |
| Arabic/RTL buyer flow | Passed. RTL main surface, Arabic buyer heading, and Arabic document-dialog path work. |
| Flutter offline state | Passed. Offline safety explanation and retry affordance are both visible. |
| TypeScript and hygiene | Web type check and whitespace validation passed. |

The final read-only Playwright results are stored outside source control at `/home/ubuntu/r4c-quotation-qa/ux-interaction-audit.json`. Refreshed screenshots are stored alongside it in the same local evidence directory.

## Remaining recommendations

The current form is suitable for API-literate staff because it accepts canonical lead and payment-plan IDs. The next product increment should replace raw UUID entry with permission-filtered lead/project/unit and payment-plan selectors, while retaining the server as the authoritative validator. This is an enhancement rather than a blocker because the current data model and permission boundaries remain explicit.

A future production buyer flow should also replace synthetic-preview language only after a verified delivery provider, identity/OTP policy, legal acceptance policy, and monitored customer-support path have been implemented. Those capabilities are deliberately outside the present MVP.
