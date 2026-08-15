import assert from "node:assert/strict";
import test from "node:test";
import { createPrismaClient } from "../dist/prisma/client.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { CommercialService } from "../dist/commercial/commercial.service.js";
import { createFixture, expectStatus, startApi } from "./c03-helpers.mjs";

const port = Number(process.env.C04_E2E_API_PORT ?? 4114);

async function createUnit(prisma, fixture, suffix) {
  return prisma.unit.create({
    data: {
      tenantId: fixture.tenant.id,
      projectId: fixture.project.id,
      phaseId: fixture.phase.id,
      buildingId: fixture.building.id,
      floorId: fixture.floor.id,
      unitTypeId: fixture.unitType.id,
      code: `U${suffix}`,
      number: String(1000 + Number(suffix.slice(-3).replace(/\D/g, "") || 1)),
      grossArea: "75.00",
      bedrooms: 1,
      bathrooms: 1,
      status: "AVAILABLE",
    },
  });
}

async function createLead(prisma, fixture, suffix, unit) {
  const customer = await prisma.customer.create({
    data: {
      tenantId: fixture.tenant.id,
      firstName: `Customer ${suffix}`,
      phone: `+9665${String(Math.abs(Number.parseInt(suffix, 36)) % 100000000).padStart(8, "0")}`,
      phoneNormalized: `+9665${String(Math.abs(Number.parseInt(suffix, 36)) % 100000000).padStart(8, "0")}`,
      email: `customer-${suffix}@c04.test`,
      emailNormalized: `customer-${suffix}@c04.test`,
    },
  });
  return prisma.lead.create({
    data: {
      tenantId: fixture.tenant.id,
      customerId: customer.id,
      projectId: fixture.project.id,
      unitId: unit.id,
      assignedToId: fixture.agent.id,
      source: "C04 integration test",
    },
    include: { customer: true },
  });
}

test("C04 real HTTP and integration boundaries enforce authorized i18n, Hold, Reservation, and sweep rules", { timeout: 180_000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
  const prisma = createPrismaClient();
  t.after(async () => prisma.$disconnect());

  const suffix = Date.now().toString(36);
  const fixture = await createFixture(prisma, suffix, { withUnit: true });
  const [managerRole, agentRole] = await Promise.all([
    prisma.role.findFirstOrThrow({ where: { tenantId: fixture.tenant.id, code: "MANAGER" } }),
    prisma.role.findFirstOrThrow({ where: { tenantId: fixture.tenant.id, code: "AGENT" } }),
  ]);
  const c04Permissions = [
    "commercial:media:manage",
    "commercial:hold:create",
    "commercial:hold:release",
    "commercial:reservation:confirm",
  ];
  await prisma.permission.createMany({ data: c04Permissions.map((code) => ({ code, name: code })), skipDuplicates: true });
  const permissionRows = await prisma.permission.findMany({ where: { code: { in: c04Permissions } } });
  await prisma.rolePermission.createMany({
    data: permissionRows.map((permission) => ({ roleId: managerRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  });
  await prisma.rolePermission.createMany({
    data: permissionRows
      .filter((permission) => ["commercial:hold:create", "commercial:hold:release"].includes(permission.code))
      .map((permission) => ({ roleId: agentRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  });

  const plan = await prisma.paymentPlan.create({
    data: {
      tenantId: fixture.tenant.id,
      projectId: fixture.project.id,
      installments: { create: [{ tenantId: fixture.tenant.id, sequence: 1, shareBasisPoints: 10000, label: "On confirmation" }] },
    },
  });
  const price = await prisma.unitPriceRevision.create({
    data: {
      tenantId: fixture.tenant.id,
      unitId: fixture.unit.id,
      revision: 1,
      basePriceMinor: BigInt(10000000),
      listPriceMinor: BigInt(12000000),
      currency: "SAR",
      status: "PUBLISHED",
      validFrom: new Date(),
      publishedAt: new Date(),
      createdById: fixture.manager.id,
    },
  });

  const api = await startApi(t, port, {
    environment: { BIM_ENABLED: "false" },
    removeEnvironment: ["BIM_WORKER_URL", "BIM_WORKER_TOKEN"],
  });
  const schedulerConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const schedulerQueue = new Queue("r4c-commercial-hold-expiry", { connection: schedulerConnection });
  t.after(async () => {
    await schedulerQueue.close();
    await schedulerConnection.quit();
  });
  const scheduler = await schedulerQueue.getJobScheduler("hold-expiry-sweep");
  assert.ok(scheduler, "API startup must register the configured Hold-expiry scheduler");
  const [managerLogin, agentLogin, readerLogin] = await Promise.all([
    api.login(fixture.manager.email, fixture.tenant.id),
    api.login(fixture.agent.email, fixture.tenant.id),
    api.login(fixture.reader.email, fixture.tenant.id),
  ]);
  expectStatus(managerLogin, 201, api);
  expectStatus(agentLogin, 201, api);
  expectStatus(readerLogin, 201, api);
  const managerToken = managerLogin.body.accessToken;
  const agentToken = agentLogin.body.accessToken;
  const readerToken = readerLogin.body.accessToken;

  const english = await api.request("/commercial/translations", {
    token: managerToken,
    method: "POST",
    body: { entityType: "Project", entityId: fixture.project.id, locale: "en", field: "description", value: "English project description" },
  });
  expectStatus(english, 201, api);
  const fallback = await api.request(`/commercial/translations?entityType=Project&entityId=${fixture.project.id}&field=description&locale=ar`, { token: managerToken });
  expectStatus(fallback, 200, api);
  assert.equal(fallback.body.value, "English project description");
  assert.equal(fallback.body.fallbackUsed, true);
  const arabic = await api.request("/commercial/translations", {
    token: managerToken,
    method: "POST",
    body: { entityType: "Project", entityId: fixture.project.id, locale: "ar", field: "description", value: "وصف المشروع" },
  });
  expectStatus(arabic, 201, api);
  const localized = await api.request(`/commercial/translations?entityType=Project&entityId=${fixture.project.id}&field=description&locale=ar`, { token: managerToken });
  expectStatus(localized, 200, api);
  assert.equal(localized.body.value, "وصف المشروع");
  assert.equal(localized.body.fallbackUsed, false);
  const translationDenied = await api.request("/commercial/translations", {
    token: readerToken,
    method: "POST",
    body: { entityType: "Project", entityId: fixture.project.id, locale: "en", field: "description", value: "Denied" },
  });
  assert.equal(translationDenied.response.status, 403);
  const translationOutsideAllowList = await api.request("/commercial/translations", {
    token: managerToken,
    method: "POST",
    body: { entityType: "Building", entityId: fixture.building.id, locale: "en", field: "description", value: "Not allowed" },
  });
  assert.equal(translationOutsideAllowList.response.status, 400);

  const primaryLead = await createLead(prisma, fixture, `${suffix}a`, fixture.unit);
  const holdExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const hold = await api.request("/commercial/holds", {
    token: agentToken,
    method: "POST",
    body: { unitId: fixture.unit.id, leadId: primaryLead.id, holdExpiresAt: holdExpiry },
  });
  expectStatus(hold, 201, api);
  const deniedConfirm = await api.request(`/commercial/holds/${hold.body.id}/confirm`, {
    token: agentToken,
    method: "POST",
    body: { paymentPlanId: plan.id },
  });
  assert.equal(deniedConfirm.response.status, 403);
  const competingLead = await createLead(prisma, fixture, `${suffix}b`, fixture.unit);
  const competing = await api.request("/commercial/holds", {
    token: agentToken,
    method: "POST",
    body: { unitId: fixture.unit.id, leadId: competingLead.id, holdExpiresAt: holdExpiry },
  });
  assert.equal(competing.response.status, 409);

  for (const status of ["CONTACTED", "QUALIFIED", "APPOINTMENT", "NEGOTIATION"]) {
    const advanced = await api.request(`/commercial/leads/${primaryLead.id}/status`, { token: agentToken, method: "PATCH", body: { status } });
    expectStatus(advanced, 200, api);
  }
  const manualReserved = await api.request(`/commercial/leads/${primaryLead.id}/status`, { token: agentToken, method: "PATCH", body: { status: "RESERVED" } });
  assert.equal(manualReserved.response.status, 400);
  const confirmed = await api.request(`/commercial/holds/${hold.body.id}/confirm`, {
    token: managerToken,
    method: "POST",
    body: { paymentPlanId: plan.id },
  });
  expectStatus(confirmed, 201, api);
  assert.equal(confirmed.body.sourcePriceRevisionId, price.id);
  assert.equal(confirmed.body.basePriceSnapshotMinor, "10000000");
  assert.equal(confirmed.body.listPriceSnapshotMinor, "12000000");
  assert.equal(confirmed.body.reservationAmountMinor, "12000000");
  assert.equal(confirmed.body.currency, "SAR");
  const [reservedUnit, reservedLead, convertedHold] = await Promise.all([
    prisma.unit.findUniqueOrThrow({ where: { id: fixture.unit.id } }),
    prisma.lead.findUniqueOrThrow({ where: { id: primaryLead.id } }),
    prisma.unitHold.findUniqueOrThrow({ where: { id: hold.body.id } }),
  ]);
  assert.equal(reservedUnit.status, "RESERVED");
  assert.equal(reservedLead.status, "RESERVED");
  assert.equal(convertedHold.status, "CONVERTED");
  assert.notEqual(reservedLead.status, "WON");
  assert.notEqual(reservedLead.status, "LOST");

  const cancellationUnit = await createUnit(prisma, fixture, `${suffix}2`);
  const cancellationLead = await createLead(prisma, fixture, `${suffix}c`, cancellationUnit);
  const cancellable = await api.request("/commercial/holds", {
    token: agentToken,
    method: "POST",
    body: { unitId: cancellationUnit.id, leadId: cancellationLead.id, holdExpiresAt: holdExpiry },
  });
  expectStatus(cancellable, 201, api);
  const cancelled = await api.request(`/commercial/holds/${cancellable.body.id}/cancel`, { token: agentToken, method: "POST" });
  expectStatus(cancelled, 201, api);
  const [cancelledUnit, cancelledLead] = await Promise.all([
    prisma.unit.findUniqueOrThrow({ where: { id: cancellationUnit.id } }),
    prisma.lead.findUniqueOrThrow({ where: { id: cancellationLead.id } }),
  ]);
  assert.equal(cancelledUnit.status, "AVAILABLE");
  assert.equal(cancelledLead.status, "NEW");

  const expiryUnit = await createUnit(prisma, fixture, `${suffix}3`);
  const expiryLead = await createLead(prisma, fixture, `${suffix}d`, expiryUnit);
  const expiring = await api.request("/commercial/holds", {
    token: agentToken,
    method: "POST",
    body: { unitId: expiryUnit.id, leadId: expiryLead.id, holdExpiresAt: holdExpiry },
  });
  expectStatus(expiring, 201, api);
  await prisma.unitHold.update({ where: { id: expiring.body.id }, data: { holdExpiresAt: new Date(Date.now() - 1_000) } });
  const expiryService = new CommercialService(prisma);
  const sweep = await expiryService.expireHolds(new Date());
  assert.equal(sweep.expired, 1);
  const [expiredUnit, expiredLead, expiredHold] = await Promise.all([
    prisma.unit.findUniqueOrThrow({ where: { id: expiryUnit.id } }),
    prisma.lead.findUniqueOrThrow({ where: { id: expiryLead.id } }),
    prisma.unitHold.findUniqueOrThrow({ where: { id: expiring.body.id } }),
  ]);
  assert.equal(expiredUnit.status, "AVAILABLE");
  assert.equal(expiredLead.status, "NEW");
  assert.equal(expiredHold.status, "EXPIRED");
  assert.notEqual(expiredLead.status, "LOST");

  await prisma.unitHold.update({ where: { id: hold.body.id }, data: { holdExpiresAt: new Date(Date.now() - 1_000) } });
  const raceSweep = await expiryService.expireHolds(new Date());
  assert.equal(raceSweep.expired, 0);
  const [raceUnit, raceHold] = await Promise.all([
    prisma.unit.findUniqueOrThrow({ where: { id: fixture.unit.id } }),
    prisma.unitHold.findUniqueOrThrow({ where: { id: hold.body.id } }),
  ]);
  assert.equal(raceUnit.status, "RESERVED");
  assert.equal(raceHold.status, "CONVERTED");

  const audit = await prisma.auditEvent.findMany({ where: { tenantId: fixture.tenant.id, action: { in: ["COMMERCIAL_UNIT_HOLD_CREATED", "COMMERCIAL_UNIT_HOLD_EXPIRED", "COMMERCIAL_RESERVATION_CONFIRMED"] } } });
  assert.ok(audit.some((event) => event.action === "COMMERCIAL_UNIT_HOLD_CREATED"));
  assert.ok(audit.some((event) => event.action === "COMMERCIAL_UNIT_HOLD_EXPIRED"));
  assert.ok(audit.some((event) => event.action === "COMMERCIAL_RESERVATION_CONFIRMED"));
});
