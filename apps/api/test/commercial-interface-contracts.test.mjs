import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const controller = await readFile(new URL("../src/commercial/commercial.controller.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../src/commercial/commercial.service.ts", import.meta.url), "utf8");
const seed = await readFile(new URL("../prisma/seed.ts", import.meta.url), "utf8");
const uatSeed = await readFile(new URL("../prisma/seed-uat.ts", import.meta.url), "utf8");
const permissionBackfill = await readFile(new URL("../prisma/migrations/20260902183000_backfill_commercial_role_permissions/migration.sql", import.meta.url), "utf8");

test("commercial read capabilities stay separate from administration", () => {
  assert.match(controller, /Get\("projects\/:projectId\/payment-plans"\)[^\n]+commercial:payment-plan:view/);
  assert.match(controller, /Post\("projects\/:projectId\/payment-plans"\)[^\n]+commercial:payment-plan:manage/);
  assert.match(controller, /Put\("payment-plans\/:id"\)[^\n]+commercial:payment-plan:manage/);
  assert.match(service, /localeResolvedDescriptions/);
  assert.match(service, /tenantId,[\s\S]*field: "description"/);
});

test("assignee lookup and touched operations retain tenant and Lead access guards", () => {
  assert.match(controller, /Get\("assignees"\)[^\n]+commercial:lead:reassign/);
  assert.match(service, /async assignees\(tenantId: string\)[\s\S]*where: \{[\s\S]*tenantId,[\s\S]*user: \{ isActive: true \}/);
  assert.match(service, /async activities\(user: AuthContext, leadId: string\)[\s\S]*assertLeadOwnerOrManager/);
  assert.match(service, /async createHold[\s\S]*assertLeadOwnerOrManager\(user, lead.assignedToId\)/);
});

test("commercial role fixtures are least privilege and credential-free", () => {
  assert.match(seed, /code: "SALES_AGENT"/);
  assert.match(seed, /code: "SALES_MANAGER"/);
  const agentDefinition = seed.slice(seed.indexOf('code: "SALES_AGENT"'), seed.indexOf('code: "SALES_MANAGER"'));
  assert.match(agentDefinition, /commercial:payment-plan:view/);
  assert.doesNotMatch(agentDefinition, /commercial:payment-plan:manage/);
  assert.doesNotMatch(agentDefinition, /commercial:reservation:confirm/);
  assert.match(uatSeed, /SEED_UAT_SALES_AGENT_PASSWORD/);
  assert.match(uatSeed, /SEED_UAT_SALES_MANAGER_PASSWORD/);
  assert.doesNotMatch(uatSeed, /password:\s*["'][^"']{12}/);
});

test("existing tenants receive the complete commercial role matrix without reseeding", () => {
  assert.match(permissionBackfill, /role\."code" = 'ADMIN'[\s\S]*permission\."code" LIKE 'commercial:%'/);
  assert.match(permissionBackfill, /role\."code" = 'SALES_AGENT'[\s\S]*'commercial:lead:view-own'/);
  assert.match(permissionBackfill, /role\."code" = 'SALES_MANAGER'[\s\S]*'commercial:reservation:confirm'/);
  assert.match(permissionBackfill, /ON CONFLICT \("roleId", "permissionId"\) DO NOTHING/g);
  assert.doesNotMatch(permissionBackfill, /\b(?:DELETE|TRUNCATE|DROP)\b/i);
});
