import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { PrismaClient, UnitPriceRevisionStatus } from "@prisma/client";
import * as argon2 from "argon2";

const port = Number(process.env.C02_E2E_API_PORT ?? 4112);
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const password = "Correct-Horse-Battery-Staple-42";

async function waitForApi(apiProcess) {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) throw new Error(`API exited before readiness (code ${apiProcess.exitCode})`);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      if (response.ok) return;
      lastError = new Error(`Readiness returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`API did not become ready: ${lastError}`);
}

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

async function login(email, tenantId) {
  return request("/auth/login", { method: "POST", body: { email, password, tenantId } });
}

test("C02 real HTTP boundary enforces pricing, template, media, tenant, and audit rules", { timeout: 120_000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
  const prisma = new PrismaClient();
  const permissions = [
    "commercial:price:create-draft",
    "commercial:price:publish",
    "commercial:price:view-published",
    "commercial:price:view-draft",
    "commercial:payment-plan:manage",
    "commercial:media:manage",
  ];
  const suffix = Date.now().toString(36);
  const passwordHash = await argon2.hash(password);
  const tenant = await prisma.tenant.create({ data: { code: `C02-${suffix}`, name: "C02 Tenant" } });
  const otherTenant = await prisma.tenant.create({ data: { code: `C02-O-${suffix}`, name: "Other C02 Tenant" } });
  await prisma.permission.createMany({ data: permissions.map((code) => ({ code, name: code })), skipDuplicates: true });
  const permissionRows = await prisma.permission.findMany({ where: { code: { in: permissions } } });
  const administrator = await prisma.role.create({ data: { tenantId: tenant.id, code: "ADMIN", name: "Administrator" } });
  const reader = await prisma.role.create({ data: { tenantId: tenant.id, code: "READER", name: "Reader" } });
  await prisma.rolePermission.createMany({ data: permissionRows.map((permission) => ({ roleId: administrator.id, permissionId: permission.id })) });
  const admin = await prisma.user.create({ data: { email: `admin-${suffix}@c02.test`, displayName: "C02 Admin", passwordHash } });
  const readOnly = await prisma.user.create({ data: { email: `reader-${suffix}@c02.test`, displayName: "C02 Reader", passwordHash } });
  await prisma.tenantMembership.createMany({ data: [
    { tenantId: tenant.id, userId: admin.id, roleId: administrator.id },
    { tenantId: tenant.id, userId: readOnly.id, roleId: reader.id },
  ] });

  const project = await prisma.project.create({ data: { tenantId: tenant.id, code: `C02-P-${suffix}`, name: "C02 Project" } });
  const phase = await prisma.developmentPhase.create({ data: { tenantId: tenant.id, projectId: project.id, code: "P01", name: "Phase 01" } });
  const building = await prisma.building.create({ data: { tenantId: tenant.id, projectId: project.id, phaseId: phase.id, code: "B01", name: "Building 01" } });
  const floor = await prisma.floor.create({ data: { tenantId: tenant.id, buildingId: building.id, code: "F01", name: "First floor", floorNumber: 1 } });
  const unitType = await prisma.unitType.create({ data: { tenantId: tenant.id, projectId: project.id, code: "1BR", name: "One bedroom", bedrooms: 1, bathrooms: 1 } });
  const unit = await prisma.unit.create({ data: { tenantId: tenant.id, projectId: project.id, phaseId: phase.id, buildingId: building.id, floorId: floor.id, unitTypeId: unitType.id, code: "U101", number: "101", grossArea: "75.00", bedrooms: 1, bathrooms: 1 } });
  const foreignProject = await prisma.project.create({ data: { tenantId: otherTenant.id, code: `C02-X-${suffix}`, name: "Other Project" } });
  const document = await prisma.document.create({ data: { tenantId: tenant.id, projectId: project.id, code: "C02-MEDIA", title: "C02 Media", documentType: "IMAGE" } });
  const documentVersion = await prisma.documentVersion.create({ data: { tenantId: tenant.id, documentId: document.id, versionNumber: 1, revision: "A", fileName: "cover.jpg", mimeType: "image/jpeg", sizeBytes: BigInt(12), storageKey: `c02/${suffix}/cover.jpg`, uploadedById: admin.id } });

  let apiLogs = "";
  const apiProcess = spawn(process.execPath, ["dist/main.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(port),
      HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "c02-http-access-secret-that-is-long-enough",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "c02-http-refresh-secret-that-is-long-enough",
      BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
      BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "c02-worker-token",
      S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
      S3_REGION: process.env.S3_REGION ?? "us-east-1",
      S3_BUCKET: process.env.S3_BUCKET ?? "r4c-c02",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "c02-access",
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "c02-secret",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  apiProcess.stdout.on("data", (chunk) => { apiLogs = (apiLogs + chunk.toString()).slice(-12_000); });
  apiProcess.stderr.on("data", (chunk) => { apiLogs = (apiLogs + chunk.toString()).slice(-12_000); });

  t.after(async () => {
    apiProcess.kill("SIGTERM");
    if (apiProcess.exitCode === null) await Promise.race([once(apiProcess, "exit"), new Promise((resolve) => setTimeout(resolve, 5_000))]);
    if (apiProcess.exitCode === null) apiProcess.kill("SIGKILL");
    await prisma.$disconnect();
  });

  try {
    await waitForApi(apiProcess);
    const adminLogin = await login(admin.email, tenant.id);
    assert.equal(adminLogin.response.status, 201, JSON.stringify(adminLogin.body));
    const readerLogin = await login(readOnly.email, tenant.id);
    assert.equal(readerLogin.response.status, 201, JSON.stringify(readerLogin.body));
    const token = adminLogin.body.accessToken;

    const denied = await request(`/commercial/units/${unit.id}/prices`, { token: readerLogin.body.accessToken, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR" } });
    assert.equal(denied.response.status, 403);
    const hiddenTenant = await request(`/commercial/units/${foreignProject.id}/prices`, { token, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR" } });
    assert.equal(hiddenTenant.response.status, 404);

    const draftOne = await request(`/commercial/units/${unit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR", validFrom: "2030-01-01T00:00:00.000Z" } });
    assert.equal(draftOne.response.status, 201, JSON.stringify(draftOne.body));
    assert.equal(draftOne.body.basePriceMinor, "100000");
    assert.equal(draftOne.body.status, UnitPriceRevisionStatus.DRAFT);
    const publishedOne = await request(`/commercial/unit-prices/${draftOne.body.id}/publish`, { token, method: "POST" });
    assert.equal(publishedOne.response.status, 201, JSON.stringify(publishedOne.body));
    assert.equal(publishedOne.body.status, UnitPriceRevisionStatus.PUBLISHED);

    const draftTwo = await request(`/commercial/units/${unit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "120000", listPriceMinor: "125000", currency: "SAR", validFrom: "2030-02-01T00:00:00.000Z" } });
    assert.equal(draftTwo.response.status, 201, JSON.stringify(draftTwo.body));
    const publishedTwo = await request(`/commercial/unit-prices/${draftTwo.body.id}/publish`, { token, method: "POST" });
    assert.equal(publishedTwo.response.status, 201, JSON.stringify(publishedTwo.body));
    const firstPersisted = await prisma.unitPriceRevision.findUniqueOrThrow({ where: { id: draftOne.body.id } });
    assert.equal(firstPersisted.status, UnitPriceRevisionStatus.SUPERSEDED);
    assert.equal(firstPersisted.validTo.toISOString(), "2030-02-01T00:00:00.000Z");
    assert.equal(firstPersisted.listPriceMinor.toString(), "110000");

    const history = await request(`/commercial/units/${unit.id}/prices`, { token });
    assert.equal(history.response.status, 200, JSON.stringify(history.body));
    assert.equal(history.body.length, 2);
    assert.ok(history.body.every((price) => price.status !== UnitPriceRevisionStatus.DRAFT));

    const invalidPlan = await request(`/commercial/projects/${project.id}/payment-plans`, { token, method: "POST", body: { installments: [{ sequence: 1, shareBasisPoints: 7000 }, { sequence: 2, shareBasisPoints: 2000 }] } });
    assert.equal(invalidPlan.response.status, 400);
    const plan = await request(`/commercial/projects/${project.id}/payment-plans`, { token, method: "POST", body: { installments: [{ sequence: 1, shareBasisPoints: 2500, label: "Booking" }, { sequence: 2, shareBasisPoints: 7500, label: "Completion" }] } });
    assert.equal(plan.response.status, 201, JSON.stringify(plan.body));
    assert.equal(plan.body.installments.reduce((sum, item) => sum + item.shareBasisPoints, 0), 10000);

    const media = await request(`/commercial/units/${unit.id}/media`, { token, method: "POST", body: { documentVersionId: documentVersion.id, sortOrder: 1 } });
    assert.equal(media.response.status, 201, JSON.stringify(media.body));
    assert.equal(media.body.documentVersionId, documentVersion.id);
    const mediaAudit = await prisma.auditEvent.findFirst({ where: { tenantId: tenant.id, entityId: media.body.id, action: "COMMERCIAL_UNIT_MEDIA_ATTACHED" } });
    assert.ok(mediaAudit, "Media attachment must produce an audit event");
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.stack : error}\nAPI logs:\n${apiLogs}`);
  }
});
