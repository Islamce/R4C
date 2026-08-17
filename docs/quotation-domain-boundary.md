# Buyer Sales Quotation Domain Boundary

## In scope: buyer sales quotation

The implemented increment is named **Buyer Sales Quotation**. It is an internal commercial process that prepares a controlled offer for an identified customer or lead against an eligible development unit. The customer may review an immutable quotation snapshot and record one of the explicitly allowed decisions: accept, decline, or request clarification.

A recorded customer acceptance is a commercial follow-up signal only. It does not create a hold, extend a hold, create or confirm a reservation, mark a lead as won, create a sale, create an invoice or payment obligation, or act as a legally binding electronic signature. Any such operation stays behind the existing separately authorized commercial workflows.

| Buyer sales quotation concept | Purpose |
|---|---|
| SalesQuotation | Controlled price, payment-plan, unit, customer, terms, and validity snapshot. |
| Internal quotation review | Staff review and approval to make a snapshot customer-visible. |
| Customer Decision | Append-only acceptance, decline, or clarification on one scoped quotation revision. |
| Buyer approval token | Short-lived opaque access mechanism for the responsive customer decision page. |
| Reservation handoff | Internal follow-up only; invokes no automatic hold or reservation mutation. |

## Explicitly out of scope: procurement RFQ

A procurement request for quotation concerns suppliers, materials, service providers, bids, commercial comparison, evaluator scoring, award decisions, and purchase-order conversion. R4C has Material Takeoff and Procurement Order foundations, but this MVP adds none of the following: Supplier, Vendor, ProcurementRfq, RFQ invitation, Bid, Bid comparison, sourcing event, award, purchase order creation, or procurement approval.

| Term | Approved use in this MVP | Prohibited use |
|---|---|---|
| Quotation | A buyer-facing sales quotation for a development unit. | A supplier bid or procurement document. |
| Customer decision | Buyer records acceptance, decline, or clarification. | Procurement award or supplier evaluation. |
| Reservation handoff | Internal staff follow-up after acceptance. | Automatic reservation creation. |
| RFQ | Mentioned only as deferred procurement scope. | Name of a buyer quotation endpoint, schema, UI, or status. |

## Naming rule

Code, user interface copy, tests, and documentation must use **Sales Quotation**, **Buyer Quotation**, **Customer Decision**, **Quotation Approval**, and **Reservation Handoff**. The words `supplier`, `vendor`, `bid`, `sourcing`, `award`, and `procurement RFQ` are not permitted in the buyer quotation feature implementation.
