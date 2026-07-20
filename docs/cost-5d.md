# 5D Cost and Earned-Value Control

## Financial control model

R4C stores project budgets as immutable revisions. A draft contains quantity-and-rate budget lines mapped to WBS nodes. Publishing is explicit and audited; one project-level active-budget pointer is updated in a serializable transaction and the previous published revision is superseded.

Financial values enter the API as decimal strings and are stored as PostgreSQL decimals. The service calculates each line as quantity × unit rate and rounds only the monetary result to two decimal places.

## Cost ledger

Commitments and actual costs share one append-only ledger with:

- tenant, project, WBS, and optional budget-line scope
- explicit `COMMITMENT` or `ACTUAL` type
- project-unique external identifier for idempotency
- signed adjustment support through non-zero decimal amounts
- active-budget currency validation
- actor and occurrence timestamps
- audit events for every posting

There are no update or delete endpoints. Corrections must be posted as traceable reversing entries.

## API

- `GET /projects/:projectId/budgets`
- `GET /projects/:projectId/budgets/active`
- `POST /projects/:projectId/budgets`
- `POST /projects/:projectId/budgets/:budgetId/publish`
- `GET /projects/:projectId/cost-ledger`
- `POST /projects/:projectId/cost-ledger`
- `GET /projects/:projectId/cost-control?date=YYYY-MM-DD`
- `GET /bim-models/:bimModelId/5d-state?date=YYYY-MM-DD`

Budget management requires `cost:budget:create` and `cost:budget:publish`; ledger posting requires `cost:post`; reporting requires `cost:read`. BIM coloring continues to use `bim:read`.

## Earned value

For the selected date:

- BAC is the active budget total
- PV applies active-schedule time-phased progress to each WBS budget
- EV applies latest approved physical progress to each WBS budget
- AC is the actual-cost ledger total
- CPI = EV ÷ AC
- SPI = EV ÷ PV
- EAC = BAC ÷ CPI when CPI is positive
- ETC = EAC − AC
- VAC = BAC − EAC
- cost variance = EV − AC
- schedule variance = EV − PV

Commitments and actuals are reported separately. Forecast exposure uses the greater of commitment or actual cost per WBS, avoiding automatic double counting when an invoice consumes an existing commitment.

## BIM allocation

Each WBS cost metric is distributed across its BIM links by relative link weight. The denominator includes all links for that WBS, so allocations are not duplicated when the same WBS spans multiple models.

5D colors are:

- grey — unbudgeted
- green — controlled
- amber — commitments exceed budget
- red — actual cost exceeds earned value beyond the configured 5%/one-currency-unit tolerance
- yellow — selected geometry

The element inspector shows allocated budget, earned value, actual cost, commitments, and cost variance.

## Integration boundary

The normalized APIs are ready for later SAP S/4HANA, Primavera P6, Microsoft Project, and quantity-takeoff adapters. External systems must post through these governed contracts and must not write database tables directly.
