# Buyer Sales Quotation Migration Audit and Rehearsal

Migration under review: `20260817100000_buyer_sales_quotation_mvp`  
Source: PR #74 at `1076118ddf5085b9a29ff00fa14ec76a15e2255c`  
Core RC status: not incorporated  
Extension status: implemented source donor; non-production database rehearsal required

## Static audit result

The migration is additive: it creates three enums, four tables, indexes and foreign keys. It does not drop or rewrite an existing table or column. `SalesQuotation` uses tenant-composite foreign keys for Lead, Customer, Project, Unit, UnitPriceRevision and PaymentPlan, which is the correct fail-closed direction.

The source is **not ready to rehearse unchanged**. The dependent quotation tables use independent tenant and single-column quotation foreign keys:

- `QuotationApprovalToken(quotationId)` references `SalesQuotation(id)` while `tenantId` independently references `Tenant(id)`.
- `CustomerDecision(quotationId)` references `SalesQuotation(id)` while `tenantId` independently references `Tenant(id)`.
- `QuotationDelivery(quotationId)` references `SalesQuotation(id)` while `tenantId` independently references `Tenant(id)`.
- `CustomerDecision(approvalTokenId)` does not bind the decision tenant to the token tenant.

This permits database-valid rows whose declared tenant differs from the parent quotation/token tenant if application code is bypassed or defective. The Quotation Extension must add composite uniqueness and composite foreign keys before the sanctioned rehearsal:

1. `SalesQuotation @@unique([id, tenantId])`.
2. `QuotationApprovalToken @@unique([id, tenantId])` and `(quotationId, tenantId) -> SalesQuotation(id, tenantId)`.
3. `(quotationId, tenantId) -> SalesQuotation(id, tenantId)` for decisions and deliveries.
4. If `approvalTokenId` remains optional, `(approvalTokenId, tenantId) -> QuotationApprovalToken(id, tenantId)`.
5. Matching Prisma relations and migration SQL generated from the corrected schema.

Historical migration files must not be rewritten after they have been applied to a shared environment. Current evidence says this quotation migration is not accepted as applied production history. Before changing it, confirm with read-only migration history in the sanctioned rehearsal target and every known deployed environment. If it is already applied anywhere material, preserve it and add a corrective migration instead.

## Sanctioned non-production rehearsal procedure

### Preconditions

- Founder-approved disposable PostgreSQL database with no customer or production data.
- PostgreSQL version compatible with the supported R4C target.
- Exact Quotation Extension SHA recorded.
- Corrected quotation migration/schema committed and Prisma validation green.
- Fresh database backup/export capability proven even though the target is disposable.
- Populated connection values held outside Git and logs.

### Rehearsal A — clean database

1. Create an empty database/schema owned by a least-privilege rehearsal account.
2. Set `DATABASE_URL` and `DIRECT_URL` only in the protected process environment.
3. Run `pnpm --filter @r4c/api prisma:validate`.
4. Run `pnpm --filter @r4c/api prisma:migrate:deploy` once.
5. Run `pnpm --filter @r4c/api prisma:migrate:status` and retain redacted output.
6. Run the idempotent bootstrap seed twice and prove no role, permission, membership or credential regression.
7. Execute quotation service/source tests and tenant-negative database tests.

### Rehearsal B — upgrade from Core RC history

1. Create a second empty database.
2. Check out the exact Core RC SHA and deploy its migrations.
3. Seed representative synthetic Core RC records covering two tenants, Leads, Customers, Projects, Units, published prices and payment plans.
4. Check out the exact Quotation Extension SHA and deploy the quotation migration.
5. Verify every pre-existing row and constraint remains intact.
6. Create one quotation per tenant and prove cross-tenant quotation, token, decision and delivery references fail at both API and database boundaries.
7. Re-run the complete Core RC suite to prove no regression.

### Required failure and rollback evidence

- A deliberately invalid cross-tenant child insert is rejected by a composite foreign key.
- A migration run with a deliberately insufficient database role fails without partial schema ambiguity.
- Re-running `migrate deploy` is a no-op.
- The documented application rollback does not pretend schema rollback occurred; forward corrective migration is the default database recovery strategy.
- Logs and retained artifacts contain no connection string, password, buyer token or customer data.

## Exit criteria

The quotation gate changes from **BLOCKED** to **NON-PROD-QUALIFIED** only when both rehearsals pass on the corrected exact SHA and the redacted migration/test evidence is retained. This does not authorize production migration, deployment, buyer delivery or legal acceptance.

