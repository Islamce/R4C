import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { PrismaClient, UnitPriceRevisionStatus } from "@prisma/client";
import * as argon2 from "argon2";

const port = Number(process.env.C02_INVARIANTS_API_PORT ?? 4113);
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

async function createUnit(prisma, { tenantId, projectId, code, ownerId }) {
  const phase = await prisma.developmentPhase.create({ data: { tenantId, projectId, code: `${code}-P`, name: `${code} Phase` } });
  const building = await prisma.building.create({ data: { tenantId, projectId, phaseId: phase.id, code: `${code}-B`, name: `${code} Building` } });
  const floor = await prisma.floor.create({ data: { tenantId, buildingId: building.id, code: `${code}-F`, name: `${code} Floor`, floorNumber: 1 } });
  const unitType = await prisma.unitType.create({ data: { tenantId, projectId, code: `${code}-T`, name: `${code} Type`, bedrooms: 1, bathrooms: 1 } });
  return prisma.unit.create({ data: { tenantId, projectId, phaseId: phase.id, buildingId: building.id, floorId: floor.id, unitTypeId: unitType.id, code: `${code}-U`, number: "101", grossArea: "75.00", bedrooms: 1, bathrooms: 1, ...(ownerId ? { } : {}) } });
}

test("C02 invariant-focused HTTP coverage", { timeout: 120_000 }, async (t) => {
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
  const suffix = `${Date.now().toString(36)}-${process.pid}`;
  const passwordHash = await argon2.hash(password);
  const tenant = await prisma.tenant.create({ data: { code: `C02I-${suffix}`, name: "C02 Invariants Tenant" } });
  const otherTenant = await prisma.tenant.create({ data: { code: `C02I-O-${suffix}`, name: "C02 Invariants Other Tenant" } });
  await prisma.permission.createMany({ data: permissions.map((code) => ({ code, name: code })), skipDuplicates: true });
  const permissionRows = await prisma.permission.findMany({ where: { code: { in: permissions } } });
  const administrator = await prisma.role.create({ data: { tenantId: tenant.id, code: "ADMIN", name: "Administrator" } });
  const reader = await prisma.role.create({ data: { tenantId: tenant.id, code: "READER", name: "Reader" } });
  await prisma.rolePermission.createMany({ data: permissionRows.map((permission) => ({ roleId: administrator.id, permissionId: permission.id })) });
  const admin = await prisma.user.create({ data: { email: `admin-${suffix}@c02-invariants.test`, displayName: "C02 Invariants Admin", passwordHash } });
  const readOnly = await prisma.user.create({ data: { email: `reader-${suffix}@c02-invariants.test`, displayName: "C02 Invariants Reader", passwordHash } });
  await prisma.tenantMembership.createMany({ data: [
    { tenantId: tenant.id, userId: admin.id, roleId: administrator.id },
    { tenantId: tenant.id, userId: readOnly.id, roleId: reader.id },
  ] });

  const project = await prisma.project.create({ data: { tenantId: tenant.id, code: `C02I-P-${suffix}`, name: "C02 Invariants Project" } });
  const foreignProject = await prisma.project.create({ data: { tenantId: otherTenant.id, code: `C02I-X-${suffix}`, name: "C02 Invariants Other Project" } });
  const unit = await createUnit(prisma, { tenantId: tenant.id, projectId: project.id, code: `A-${suffix}`, ownerId: admin.id });
  const foreignUnit = await createUnit(prisma, { tenantId: otherTenant.id, projectId: foreignProject.id, code: `B-${suffix}` });
  const document = await prisma.document.create({ data: { tenantId: tenant.id, projectId: project.id, code: `C02I-M-${suffix}`, title: "C02 Invariants Media", documentType: "IMAGE" } });
  const documentVersion = await prisma.documentVersion.create({ data: { tenantId: tenant.id, documentId: document.id, versionNumber: 1, revision: "A", fileName: "cover.jpg", mimeType: "image/jpeg", sizeBytes: BigInt(12), storageKey: `c02/${suffix}/cover.jpg`, uploadedById: admin.id } });
  const foreignDocument = await prisma.document.create({ data: { tenantId: otherTenant.id, projectId: foreignProject.id, code: `C02I-XM-${suffix}`, title: "Other Media", documentType: "IMAGE" } });
  const foreignDocumentVersion = await prisma.documentVersion.create({ data: { tenantId: otherTenant.id, documentId: foreignDocument.id, versionNumber: 1, revision: "A", fileName: "foreign.jpg", mimeType: "image/jpeg", sizeBytes: BigInt(12), storageKey: `c02/${suffix}/foreign.jpg`, uploadedById: admin.id } });

  let apiLogs = "";
  const apiProcess = spawn(process.execPath, ["dist/main.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(port),
      HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "c02-invariants-access-secret-that-is-long-enough",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "c02-invariants-refresh-secret-that-is-long-enough",
      BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
      BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "c02-invariants-worker-token",
      S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
      S3_REGION: process.env.S3_REGION ?? "us-east-1",
      S3_BUCKET: process.env.S3_BUCKET ?? "r4c-c02-invariants",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "c02-invariants-access",
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "c02-invariants-secret",
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
    const adminLogin = await request("/auth/login", { method: "POST", body: { email: admin.email, password, tenantId: tenant.id } });
    const readerLogin = await request("/auth/login", { method: "POST", body: { email: readOnly.email, password, tenantId: tenant.id } });
    assert.equal(adminLogin.response.status, 201, JSON.stringify(adminLogin.body));
    assert.equal(readerLogin.response.status, 201, JSON.stringify(readerLogin.body));
    const token = adminLogin.body.accessToken;
    const readerToken = readerLogin.body.accessToken;

    await t.test("tenant hiding isolates foreign commercial units", async () => {
      const hidden = await request(`/commercial/units/${foreignUnit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR" } });
      assert.equal(hidden.response.status, 404);
      const foreignRevisionCount = await prisma.unitPriceRevision.count({ where: { unitId: foreignUnit.id } });
      assert.equal(foreignRevisionCount, 0);
    });

    await t.test("capability denial rejects unauthorized C02 mutations", async () => {
      const deniedPrice = await request(`/commercial/units/${unit.id}/prices`, { token: readerToken, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR" } });
      const deniedPlan = await request(`/commercial/projects/${project.id}/payment-plans`, { token: readerToken, method: "POST", body: { installments: [{ sequence: 1, shareBasisPoints: 10000 }] } });
      const deniedMedia = await request(`/commercial/units/${unit.id}/media`, { token: readerToken, method: "POST", body: { documentVersionId: documentVersion.id } });
      assert.equal(deniedPrice.response.status, 403);
      assert.equal(deniedPlan.response.status, 403);
      assert.equal(deniedMedia.response.status, 403);
    });

    await t.test("publishing a successor preserves and supersedes prior price content", async () => {
      const firstDraft = await request(`/commercial/units/${unit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "100000", listPriceMinor: "110000", currency: "SAR", validFrom: "2030-01-01T00:00:00.000Z" } });
      assert.equal(firstDraft.response.status, 201, JSON.stringify(firstDraft.body));
      const firstPublished = await request(`/commercial/unit-prices/${firstDraft.body.id}/publish`, { token, method: "POST" });
      assert.equal(firstPublished.response.status, 201, JSON.stringify(firstPublished.body));
      const secondDraft = await request(`/commercial/units/${unit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "120000", listPriceMinor: "125000", currency: "SAR", validFrom: "2030-02-01T00:00:00.000Z" } });
      const secondPublished = await request(`/commercial/unit-prices/${secondDraft.body.id}/publish`, { token, method: "POST" });
      assert.equal(secondPublished.response.status, 201, JSON.stringify(secondPublished.body));
      const firstPersisted = await prisma.unitPriceRevision.findUniqueOrThrow({ where: { id: firstDraft.body.id } });
      assert.equal(firstPersisted.status, UnitPriceRevisionStatus.SUPERSEDED);
      assert.equal(firstPersisted.validTo.toISOString(), "2030-02-01T00:00:00.000Z");
      assert.equal(firstPersisted.basePriceMinor.toString(), "100000");
      assert.equal(firstPersisted.listPriceMinor.toString(), "110000");
      assert.equal(firstPersisted.currency, "SAR");
    });

    await t.test("payment plans reject basis-point totals other than exactly 10000", async () => {
      const invalid = await request(`/commercial/projects/${project.id}/payment-plans`, { token, method: "POST", body: { installments: [{ sequence: 1, shareBasisPoints: 7000 }, { sequence: 2, shareBasisPoints: 2000 }] } });
      assert.equal(invalid.response.status, 400);
      const valid = await request(`/commercial/projects/${project.id}/payment-plans`, { token, method: "POST", body: { installments: [{ sequence: 1, shareBasisPoints: 2500, label: "Booking" }, { sequence: 2, shareBasisPoints: 7500, label: "Completion" }] } });
      assert.equal(valid.response.status, 201, JSON.stringify(valid.body));
      assert.equal(valid.body.installments.reduce((total, installment) => total + installment.shareBasisPoints, 0), 10000);
    });

    await t.test("media references accept only document versions in the commercial owner scope", async () => {
      const attached = await request(`/commercial/units/${unit.id}/media`, { token, method: "POST", body: { documentVersionId: documentVersion.id, sortOrder: 1 } });
      assert.equal(attached.response.status, 201, JSON.stringify(attached.body));
      assert.equal(attached.body.documentVersionId, documentVersion.id);
      const foreign = await request(`/commercial/units/${unit.id}/media`, { token, method: "POST", body: { documentVersionId: foreignDocumentVersion.id } });
      assert.equal(foreign.response.status, 400);
    });

    await t.test("C02 mutations emit tenant-scoped audit events", async () => {
      const draft = await request(`/commercial/units/${unit.id}/prices`, { token, method: "POST", body: { basePriceMinor: "130000", listPriceMinor: "135000", currency: "SAR" } });
      assert.equal(draft.response.status, 201, JSON.stringify(draft.body));
      const audit = await prisma.auditEvent.findFirst({ where: { tenantId: tenant.id, actorId: admin.id, entityId: draft.body.id, action: "COMMERCIAL_UNIT_PRICE_DRAFT_CREATED" } });
      assert.ok(audit, "Expected a tenant-scoped C02 audit event for the created draft");
    });
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.stack : error}\nAPI logs:\n${apiLogs}`);
  }
});
