import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (relative) => readFile(new URL(relative, root), "utf8");

test("canonical CRM schema contains tenant-scoped lifecycle models and relations", async () => {
  const schema = await read("prisma/schema.prisma");
  for (const model of ["Contact", "Opportunity", "CrmActivity", "CrmTask", "Quotation", "QuotationRevision", "CustomerDecision"]) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }
  assert.match(schema, /@@unique\(\[tenantId, emailNormalized\]\)/);
  assert.match(schema, /@@unique\(\[tenantId, phoneNormalized\]\)/);
  assert.match(schema, /model Opportunity[\s\S]*tenant[\s\S]*owner[\s\S]*activities[\s\S]*tasks/);
  assert.match(schema, /model QuotationRevision[\s\S]*@@unique\(\[quotationId, revision\]\)/);
  assert.match(schema, /model CustomerDecision[\s\S]*@@unique\(\[quotationRevisionId\]\)/);
});

test("canonical CRM migration is additive and tenant-isolated", async () => {
  const migration = await read("prisma/migrations/20260823130000_canonical_crm/migration.sql");
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i);
  for (const table of ["Contact", "Opportunity", "CrmActivity", "CrmTask", "Quotation", "QuotationRevision", "CustomerDecision"]) {
    assert.match(migration, new RegExp(`CREATE TABLE \\"${table}\\"`));
    assert.match(migration, new RegExp(`\\\"${table}_tenantId_fkey\\\"`));
  }
  assert.match(migration, /Contact_tenantId_emailNormalized_key/);
  assert.match(migration, /QuotationRevision_quotationId_revision_key/);
});

test("CRM HTTP boundaries are authenticated and permission-gated", async () => {
  const controller = await read("src/crm/crm.controller.ts");
  const service = await read("src/crm/crm.service.ts");
  assert.match(controller, /@Controller\("crm"\)/);
  for (const permission of ["crm:read", "crm:write", "crm:approve"]) assert.match(controller, new RegExp(`RequirePermissions\\("${permission}"\\)`));
  assert.match(controller, /leads\/:leadId\/convert/);
  assert.match(controller, /quotations\/:quotationId\/revisions/);
  assert.match(controller, /quotation-revisions\/:revisionId\/decision/);
  assert.match(service, /where: \{ id: leadId, tenantId \}/);
  assert.match(service, /where: \{ id: opportunityId, tenantId \}/);
  assert.match(service, /where: \{ id: revisionId, tenantId \}/);
  assert.match(service, /Superseded quotation revisions cannot receive decisions/);
});

test("CRM module is registered in the authoritative R4C application", async () => {
  const appModule = await read("src/app.module.ts");
  const crmModule = await read("src/crm/crm.module.ts");
  assert.match(appModule, /import \{ CrmModule \} from "\.\/crm\/crm\.module"/);
  assert.match(appModule, /\bCrmModule,\n/);
  assert.match(crmModule, /imports: \[PrismaModule, AuditModule\]/);
  assert.match(crmModule, /exports: \[CrmService\]/);
});
