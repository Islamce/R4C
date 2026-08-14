import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient, UnitStatus } from "@prisma/client";
import { apiClient, createFixture, expectStatus, startApi } from "./c03-helpers.mjs";

const port = Number(process.env.C03_E2E_API_PORT ?? 4113);

test("C03 real HTTP smoke test preserves Customer, Lead, activity, audit, tenant, and C04 boundaries", { timeout: 120_000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
  const prisma = new PrismaClient();
  t.after(() => prisma.$disconnect());
  const suffix = Date.now().toString(36);
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

    const denied = await local.request("/commercial/customers", {
      token: readerLogin.body.accessToken,
      method: "POST",
      body: { firstName: "No", phone: "0501112233", email: `denied-${suffix}@c03.test` },
    });
    expectStatus(denied, 403, api);

    const customer = await local.request("/commercial/customers", {
      token: managerToken,
      method: "POST",
      body: { firstName: "Salma", lastName: "Buyer", phone: "055 123 4567", email: `salma-${suffix}@Example.TEST` },
    });
    expectStatus(customer, 201, api);
    assert.equal(customer.body.reused, false);
    assert.equal(customer.body.customer.phone, "+966551234567");

    const duplicate = await local.request("/commercial/customers", {
      token: agentToken,
      method: "POST",
      body: { firstName: "Different display name", phone: "+966551234567", email: `SALMA-${suffix}@example.test` },
    });
    expectStatus(duplicate, 201, api);
    assert.equal(duplicate.body.reused, true);
    assert.equal(duplicate.body.customer.id, customer.body.customer.id);

    const partial = await local.request("/commercial/customers", {
      token: managerToken,
      method: "POST",
      body: { firstName: "Salma", phone: "0551234567", email: `different-${suffix}@c03.test` },
    });
    expectStatus(partial, 201, api);
    assert.equal(partial.body.customer.dedupReviewRequired, true);
    const originalCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.body.customer.id } });
    assert.equal(originalCustomer.dedupReviewRequired, true, "Existing partial match must also be marked for manual review");

    const missingConsent = await local.request("/commercial/leads", {
      token: agentToken,
      method: "POST",
      body: { customerId: customer.body.customer.id, source: "website", isExternalEnquiry: true },
    });
    expectStatus(missingConsent, 400, api);

    const lead = await local.request("/commercial/leads", {
      token: agentToken,
      method: "POST",
      body: {
        customerId: customer.body.customer.id,
        projectId: fixture.project.id,
        unitId: fixture.unit.id,
        source: "website",
        isExternalEnquiry: true,
        enquiryConsentGranted: true,
        enquiryConsentAt: "2026-08-14T09:00:00.000Z",
        enquiryConsentChannel: "website-form",
        enquiryConsentPurpose: "contact regarding property enquiry",
        marketingConsentGranted: false,
      },
    });
    expectStatus(lead, 201, api);
    assert.equal(lead.body.status, "NEW");
    assert.equal(lead.body.assignedToId, fixture.agent.id);
    assert.equal(lead.body.enquiryConsent.granted, true);
    assert.equal(lead.body.marketingConsent.granted, false);

    const ownLeads = await local.request("/commercial/leads", { token: agentToken });
    expectStatus(ownLeads, 200, api);
    assert.equal(ownLeads.body.total, 1);
    const managerLeads = await local.request("/commercial/leads/all", { token: managerToken });
    expectStatus(managerLeads, 200, api);
    assert.equal(managerLeads.body.total, 1);

    const foreignRead = await local.request(`/commercial/leads/all/${lead.body.id}`, { token: outsiderLogin.body.accessToken });
    expectStatus(foreignRead, 404, api);

    const activity = await local.request(`/commercial/leads/${lead.body.id}/activities`, {
      token: agentToken,
      method: "POST",
      body: { type: "CALL", notes: "Customer requested a brochure." },
    });
    expectStatus(activity, 201, api);
    const activities = await local.request(`/commercial/leads/${lead.body.id}/activities`, { token: agentToken });
    expectStatus(activities, 200, api);
    assert.equal(activities.body.length, 1);
    assert.equal(activities.body[0].id, activity.body.id);

    const storedUnit = await prisma.unit.findUniqueOrThrow({ where: { id: fixture.unit.id } });
    assert.equal(storedUnit.status, UnitStatus.AVAILABLE, "C03 must not update Unit.status");
    const audit = await prisma.auditEvent.findFirst({ where: { tenantId: fixture.tenant.id, entityId: lead.body.id, action: "COMMERCIAL_LEAD_CREATED" } });
    assert.ok(audit, "Lead creation must emit an audit event");
    const activityAudit = await prisma.auditEvent.findFirst({ where: { tenantId: fixture.tenant.id, entityId: activity.body.id, action: "COMMERCIAL_SALES_ACTIVITY_LOGGED" } });
    assert.ok(activityAudit, "SalesActivity creation must emit an audit event");
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.stack : error}\nAPI logs:\n${api.logs()}`);
  }
});
