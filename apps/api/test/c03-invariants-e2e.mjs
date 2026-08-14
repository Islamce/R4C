import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient, UnitStatus } from "@prisma/client";
import { apiClient, createFixture, expectStatus, startApi } from "./c03-helpers.mjs";

const port = Number(process.env.C03_INVARIANT_E2E_API_PORT ?? 4114);

test("C03 invariants enforce capability, ownership, lifecycle, consent, tenant, audit, append-only, and C04 boundaries", { timeout: 120_000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
  const prisma = new PrismaClient();
  t.after(() => prisma.$disconnect());
  const suffix = `${Date.now().toString(36)}-i`;
  const fixture = await createFixture(prisma, suffix, { withUnit: true });
  const api = await startApi(t, port);
  const local = apiClient(port);

  try {
    const [managerLogin, agentLogin, readerLogin, outsiderLogin] = await Promise.all([
      local.login(fixture.manager.email, fixture.tenant.id),
      local.login(fixture.agent.email, fixture.tenant.id),
      local.login(fixture.reader.email, fixture.tenant.id),
      local.login(fixture.outsider.email, fixture.otherTenant.id),
    ]);
    [managerLogin, agentLogin, readerLogin, outsiderLogin].forEach((result) => expectStatus(result, 201, api));
    const managerToken = managerLogin.body.accessToken;
    const agentToken = agentLogin.body.accessToken;
    const readerToken = readerLogin.body.accessToken;

    const deniedCreate = await local.request("/commercial/leads", { token: readerToken, method: "POST", body: { source: "walk-in" } });
    expectStatus(deniedCreate, 403, api);
    const deniedOwnList = await local.request("/commercial/leads", { token: readerToken });
    expectStatus(deniedOwnList, 403, api);
    const deniedAllList = await local.request("/commercial/leads/all", { token: agentToken });
    expectStatus(deniedAllList, 403, api);

    const invalidMarketingMetadata = await local.request("/commercial/leads", {
      token: agentToken,
      method: "POST",
      body: { source: "walk-in", marketingConsentGranted: true },
    });
    expectStatus(invalidMarketingMetadata, 400, api);

    const foreignProject = await prisma.project.create({ data: { tenantId: fixture.otherTenant.id, code: `C03-X-${suffix}`, name: "Other Project" } });
    const crossTenantProject = await local.request("/commercial/leads", {
      token: agentToken,
      method: "POST",
      body: { source: "walk-in", projectId: foreignProject.id },
    });
    expectStatus(crossTenantProject, 404, api);

    const customer = await local.request("/commercial/customers", {
      token: agentToken,
      method: "POST",
      body: { firstName: "Nora", phone: "0507654321", email: `nora-${suffix}@c03.test` },
    });
    expectStatus(customer, 201, api);

    const lead = await local.request("/commercial/leads", {
      token: managerToken,
      method: "POST",
      body: { customerId: customer.body.customer.id, projectId: fixture.project.id, unitId: fixture.unit.id, source: "referral", assignedToId: fixture.agent.id },
    });
    expectStatus(lead, 201, api);
    assert.equal(lead.body.assignedToId, fixture.agent.id);

    const nonOwnerTransition = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: managerToken, method: "PATCH", body: { status: "CONTACTED" } });
    expectStatus(nonOwnerTransition, 200, api);
    const skippedTransition = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: agentToken, method: "PATCH", body: { status: "APPOINTMENT" } });
    expectStatus(skippedTransition, 409, api);

    for (const status of ["QUALIFIED", "APPOINTMENT", "NEGOTIATION"]) {
      const transitioned = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: agentToken, method: "PATCH", body: { status } });
      expectStatus(transitioned, 200, api);
      assert.equal(transitioned.body.status, status);
    }
    const manualReserved = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: agentToken, method: "PATCH", body: { status: "RESERVED" } });
    expectStatus(manualReserved, 400, api);
    await prisma.lead.update({ where: { id: lead.body.id }, data: { status: "RESERVED" } });
    const won = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: agentToken, method: "PATCH", body: { status: "WON" } });
    expectStatus(won, 200, api);
    const reverseTerminal = await local.request(`/commercial/leads/${lead.body.id}/status`, { token: agentToken, method: "PATCH", body: { status: "LOST" } });
    expectStatus(reverseTerminal, 409, api);
    const storedUnit = await prisma.unit.findUniqueOrThrow({ where: { id: fixture.unit.id } });
    assert.equal(storedUnit.status, UnitStatus.AVAILABLE, "Lead.RESERVED/WON must not change Unit.status in C03");

    const disqualified = await local.request("/commercial/leads", { token: agentToken, method: "POST", body: { source: "walk-in" } });
    expectStatus(disqualified, 201, api);
    const disqualify = await local.request(`/commercial/leads/${disqualified.body.id}/disqualify`, { token: agentToken, method: "POST" });
    expectStatus(disqualify, 201, api);
    assert.equal(disqualify.body.status, "DISQUALIFIED");
    const disqualifiedAdvance = await local.request(`/commercial/leads/${disqualified.body.id}/status`, { token: agentToken, method: "PATCH", body: { status: "CONTACTED" } });
    expectStatus(disqualifiedAdvance, 409, api);

    const reassignDenied = await local.request(`/commercial/leads/${lead.body.id}/assignee`, { token: agentToken, method: "PATCH", body: { assignedToId: fixture.manager.id } });
    expectStatus(reassignDenied, 403, api);
    const reassign = await local.request(`/commercial/leads/${lead.body.id}/assignee`, { token: managerToken, method: "PATCH", body: { assignedToId: fixture.manager.id } });
    expectStatus(reassign, 200, api);
    assert.equal(reassign.body.assignedToId, fixture.manager.id);

    const agentCannotLogAfterReassignment = await local.request(`/commercial/leads/${lead.body.id}/activities`, { token: agentToken, method: "POST", body: { type: "NOTE", notes: "No longer owner" } });
    expectStatus(agentCannotLogAfterReassignment, 403, api);
    const logged = await local.request(`/commercial/leads/${lead.body.id}/activities`, { token: managerToken, method: "POST", body: { type: "NOTE", notes: "Manager ownership confirmed" } });
    expectStatus(logged, 201, api);
    const mutationAttempt = await local.request(`/commercial/sales-activities/${logged.body.id}`, { token: managerToken, method: "PATCH", body: { notes: "mutated" } });
    expectStatus(mutationAttempt, 404, api);
    const deleteAttempt = await local.request(`/commercial/sales-activities/${logged.body.id}`, { token: managerToken, method: "DELETE" });
    expectStatus(deleteAttempt, 404, api);
    const persistedActivity = await prisma.salesActivity.findUniqueOrThrow({ where: { id: logged.body.id } });
    assert.equal(persistedActivity.notes, "Manager ownership confirmed", "SalesActivity must remain append-only through C03 HTTP surface");

    const foreignLeadRead = await local.request(`/commercial/leads/all/${lead.body.id}`, { token: outsiderLogin.body.accessToken });
    expectStatus(foreignLeadRead, 404, api);
    const lifecycleAudit = await prisma.auditEvent.findFirst({ where: { tenantId: fixture.tenant.id, entityId: lead.body.id, action: "COMMERCIAL_LEAD_STATUS_ADVANCED", metadata: { path: ["to"], equals: "NEGOTIATION" } } });
    assert.ok(lifecycleAudit, "Lifecycle mutation must emit a status audit event");
    const reassignmentAudit = await prisma.auditEvent.findFirst({ where: { tenantId: fixture.tenant.id, entityId: lead.body.id, action: "COMMERCIAL_LEAD_REASSIGNED" } });
    assert.ok(reassignmentAudit, "Reassignment must emit an audit event");
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.stack : error}\nAPI logs:\n${api.logs()}`);
  }
});
