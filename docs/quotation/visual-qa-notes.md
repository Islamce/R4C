# Quotation Visual QA Notes

Two representative local synthetic screenshots were inspected during the responsive evidence pass.

| Surface | Viewport | Inspection finding | Resolution / status |
|---|---:|---|---|
| Staff quotation workspace, English | 1024px | The lead-context selectors, UAT provenance, lifecycle cards, and explicit **Controlled document preview (HTML)** language were visible. The original three-column draft grid was technically contained but too dense alongside the persistent application sidebar. | A `1180px` breakpoint changes the draft and KPI grids to two columns. The regenerated evidence was re-inspected and shows readable selector labels, a non-overflowing date control, and two-column KPI cards. |
| Buyer quotation, Arabic RTL | 360px | Arabic title, transaction summary, no-reservation warning, payment schedule, HTML document-preview control, decision choices, required-comment area, and submit control remained readable and right-to-left. | Re-inspected in the regenerated evidence with no visual defect observed. The automated responsive audit also checks RTL direction and horizontal-overflow absence. |

> These observations use synthetic UAT fixtures only. They do not evidence authenticated production data, a generated PDF, a customer delivery, or a completed buyer transaction.
