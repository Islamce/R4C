import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPrismaClient } from "../dist/prisma/client.js";
import { hashTestPassword } from "./argon2-test-helpers.mjs";
import { Queue } from "bullmq";

const port = Number(process.env.E2E_API_PORT ?? 4107);
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const password = "Correct-Horse-Battery-Staple-42";
const bucket = process.env.S3_BUCKET ?? "r4c-ci";

async function waitForApi(apiProcess) {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) {
      throw new Error(`API exited before readiness (code ${apiProcess.exitCode})`);
    }
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
  return {
    response,
    body: text ? JSON.parse(text) : null,
  };
}

async function login(email, tenantId, suppliedPassword = password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password: suppliedPassword, tenantId },
  });
}

async function uploadVersion({ token, documentId, fileName, mimeType, bytes }) {
  const requested = await request(
    `/documents/${documentId}/versions/upload-request`,
    {
      token,
      method: "POST",
      body: {
        revision: "A",
        fileName,
        mimeType,
        sizeBytes: bytes.byteLength,
      },
    },
  );
  assert.equal(requested.response.status, 201, JSON.stringify(requested.body));

  const uploaded = await fetch(requested.body.upload.url, {
    method: "PUT",
    headers: { "content-type": mimeType },
    body: bytes,
  });
  assert.ok(uploaded.ok, `Object upload returned ${uploaded.status}`);

  const confirmed = await request(
    `/document-versions/${requested.body.version.id}/confirm-upload`,
    { token, method: "POST" },
  );
  assert.equal(confirmed.response.status, 201, JSON.stringify(confirmed.body));
  assert.equal(confirmed.body.uploadStatus, "UPLOADED");
  return confirmed.body;
}

test(
  "authenticated API integrates PostgreSQL, Redis, and object storage",
  { timeout: 120_000 },
  async (t) => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
    assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
    assert.ok(process.env.S3_ENDPOINT, "S3_ENDPOINT is required");

    const prisma = createPrismaClient();
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
    const queue = new Queue("r4c-bim-processing", {
      connection: {
        host: "127.0.0.1",
        port: 6379,
        maxRetriesPerRequest: null,
      },
    });

    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }

    const permissions = [
      "project:read",
      "project:create",
      "document:read",
      "document:create",
      "document:upload",
      "document:download",
      "bim:process",
      "bim:read",
      "commercial:read",
      "commercial:manage",
      "commercial:status",
      "commercial:price:create-draft",
      "commercial:price:publish",
      "commercial:price:view-published",
      "commercial:price:view-draft",
      "commercial:payment-plan:manage",
      "commercial:media:manage",
    ];
    await prisma.permission.createMany({
      data: permissions.map((code) => ({ code, name: code })),
      skipDuplicates: true,
    });
    const permissionRows = await prisma.permission.findMany({
      where: { code: { in: permissions } },
    });

    const tenantA = await prisma.tenant.create({
      data: { code: "E2E-A", name: "E2E Tenant A" },
    });
    const tenantB = await prisma.tenant.create({
      data: { code: "E2E-B", name: "E2E Tenant B" },
    });
    const administrator = await prisma.role.create({
      data: { tenantId: tenantA.id, code: "ADMIN", name: "Administrator" },
    });
    const reader = await prisma.role.create({
      data: { tenantId: tenantA.id, code: "READER", name: "Reader" },
    });
    await prisma.rolePermission.createMany({
      data: permissionRows.map((permission) => ({
        roleId: administrator.id,
        permissionId: permission.id,
      })),
    });
    const readPermission = permissionRows.find(
      (permission) => permission.code === "project:read",
    );
    await prisma.rolePermission.create({
      data: { roleId: reader.id, permissionId: readPermission.id },
    });

    const passwordHash = await hashTestPassword(password);
    const adminUser = await prisma.user.create({
      data: {
        email: "admin.e2e@r4c.test",
        displayName: "E2E Administrator",
        passwordHash,
      },
    });
    const readerUser = await prisma.user.create({
      data: {
        email: "reader.e2e@r4c.test",
        displayName: "E2E Reader",
        passwordHash,
      },
    });
    await prisma.tenantMembership.createMany({
      data: [
        { tenantId: tenantA.id, userId: adminUser.id, roleId: administrator.id },
        { tenantId: tenantA.id, userId: readerUser.id, roleId: reader.id },
      ],
    });
    const tenantBProject = await prisma.project.create({
      data: { tenantId: tenantB.id, code: "B-SECRET", name: "Tenant B Secret" },
    });

    let apiLogs = "";
    const apiProcess = spawn(process.execPath, ["dist/main.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_PORT: String(port),
        HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
        BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
        BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "ci-worker-token",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    apiProcess.stdout.on("data", (chunk) => {
      apiLogs = (apiLogs + chunk.toString()).slice(-12_000);
    });
    apiProcess.stderr.on("data", (chunk) => {
      apiLogs = (apiLogs + chunk.toString()).slice(-12_000);
    });

    t.after(async () => {
      apiProcess.kill("SIGTERM");
      if (apiProcess.exitCode === null) {
        await Promise.race([
          once(apiProcess, "exit"),
          new Promise((resolve) => setTimeout(resolve, 5_000)),
        ]);
      }
      if (apiProcess.exitCode === null) {
        apiProcess.kill("SIGKILL");
      }
      await queue.close();
      s3.destroy();
      await prisma.$disconnect();
    });

    try {
      await waitForApi(apiProcess);

      await t.test("public health and authentication boundaries", async () => {
        const health = await request("/health");
        assert.equal(health.response.status, 200);
        assert.equal(health.body.status, "ok");

        const unauthenticated = await request("/projects");
        assert.equal(unauthenticated.response.status, 401);

        const invalidShape = await request("/auth/login", {
          method: "POST",
          body: {
            email: adminUser.email,
            password,
            tenantId: tenantA.id,
            unexpected: true,
          },
        });
        assert.equal(invalidShape.response.status, 400);

        const wrongPassword = await login(adminUser.email, tenantA.id, "incorrect-password");
        assert.equal(wrongPassword.response.status, 401);
      });

      const adminLogin = await login(adminUser.email, tenantA.id);
      assert.equal(adminLogin.response.status, 201, JSON.stringify(adminLogin.body));
      const adminToken = adminLogin.body.accessToken;

      const readerLogin = await login(readerUser.email, tenantA.id);
      assert.equal(readerLogin.response.status, 201, JSON.stringify(readerLogin.body));

      await t.test("RBAC and tenant isolation are enforced over HTTP", async () => {
        const forbidden = await request("/projects", {
          token: readerLogin.body.accessToken,
          method: "POST",
          body: { code: "NOPE", name: "Forbidden project" },
        });
        assert.equal(forbidden.response.status, 403);

        const crossTenant = await request(
          `/projects/${tenantBProject.id}/wbs`,
          { token: adminToken },
        );
        assert.equal(crossTenant.response.status, 404);

        const beforeCreate = await request("/projects", { token: adminToken });
        assert.equal(beforeCreate.response.status, 200);
        assert.deepEqual(beforeCreate.body, []);
      });

      const createdProject = await request("/projects", {
        token: adminToken,
        method: "POST",
        body: {
          code: "e2e-01",
          name: "Runtime Integration Project",
          description: "Created through the authenticated HTTP boundary",
        },
      });
      assert.equal(createdProject.response.status, 201, JSON.stringify(createdProject.body));
      assert.equal(createdProject.body.code, "E2E-01");
      assert.equal(createdProject.body.tenantId, tenantA.id);

      const projectAudit = await prisma.auditEvent.findFirst({
        where: {
          tenantId: tenantA.id,
          actorId: adminUser.id,
          action: "PROJECT_CREATED",
          entityId: createdProject.body.id,
        },
      });
      assert.ok(projectAudit, "Project creation must produce an audit event");

      let commercialUnitId;
      let commercialBuildingId;
      await t.test("commercial hierarchy is tenant-isolated, governed, and filterable", async () => {
        const phase = await request("/commercial/phases", {
          token: adminToken,
          method: "POST",
          body: { projectId: createdProject.body.id, code: "P01", name: "Launch phase", sequence: 1 },
        });
        assert.equal(phase.response.status, 201, JSON.stringify(phase.body));

        const building = await request("/commercial/buildings", {
          token: adminToken,
          method: "POST",
          body: { projectId: createdProject.body.id, phaseId: phase.body.id, code: "B01", name: "Building 01" },
        });
        assert.equal(building.response.status, 201, JSON.stringify(building.body));

        const floor = await request("/commercial/floors", {
          token: adminToken,
          method: "POST",
          body: { buildingId: building.body.id, code: "F01", name: "First floor", floorNumber: 1, sequence: 1 },
        });
        assert.equal(floor.response.status, 201, JSON.stringify(floor.body));

        const unitType = await request("/commercial/unit-types", {
          token: adminToken,
          method: "POST",
          body: { projectId: createdProject.body.id, code: "2BR", name: "Two bedroom", bedrooms: 2, bathrooms: 2, defaultArea: "120.00" },
        });
        assert.equal(unitType.response.status, 201, JSON.stringify(unitType.body));

        const tenantBPhase = await prisma.developmentPhase.create({
          data: { tenantId: tenantB.id, projectId: tenantBProject.id, code: "SECRET", name: "Secret phase" },
        });
        const hidden = await request(`/commercial/phases/${tenantBPhase.id}`, { token: adminToken });
        assert.equal(hidden.response.status, 404);

        const invalidHierarchy = await request("/commercial/units", {
          token: adminToken,
          method: "POST",
          body: { projectId: createdProject.body.id, phaseId: tenantBPhase.id, buildingId: building.body.id, floorId: floor.body.id, unitTypeId: unitType.body.id, code: "BAD", number: "BAD", grossArea: "120.00", bedrooms: 2, bathrooms: 2 },
        });
        assert.equal(invalidHierarchy.response.status, 400);

        const unit = await request("/commercial/units", {
          token: adminToken,
          method: "POST",
          body: { projectId: createdProject.body.id, phaseId: phase.body.id, buildingId: building.body.id, floorId: floor.body.id, unitTypeId: unitType.body.id, code: "U-101", number: "101", grossArea: "120.00", netArea: "105.00", bedrooms: 2, bathrooms: 2, parkingCount: 1 },
        });
        assert.equal(unit.response.status, 201, JSON.stringify(unit.body));
        assert.equal(unit.body.status, "DRAFT");
        commercialUnitId = unit.body.id;
        commercialBuildingId = building.body.id;

        const filtered = await request(`/commercial/units?projectId=${createdProject.body.id}&phaseId=${phase.body.id}&bedrooms=2&status=DRAFT`, { token: adminToken });
        assert.equal(filtered.response.status, 200, JSON.stringify(filtered.body));
        assert.equal(filtered.body.total, 1);
        assert.equal(filtered.body.items[0].id, unit.body.id);

        const readerDenied = await request(`/commercial/units/${unit.body.id}`, { token: readerLogin.body.accessToken });
        assert.equal(readerDenied.response.status, 403);
        const genericStatusWrite = await request(`/commercial/units/${unit.body.id}`, { token: adminToken, method: "PATCH", body: { status: "SOLD" } });
        assert.equal(genericStatusWrite.response.status, 400);

        const released = await request(`/commercial/units/${unit.body.id}/release`, { token: adminToken, method: "POST" });
        assert.equal(released.response.status, 201, JSON.stringify(released.body));
        assert.equal(released.body.status, "AVAILABLE");
        const blocked = await request(`/commercial/units/${unit.body.id}/block`, { token: adminToken, method: "POST" });
        assert.equal(blocked.response.status, 201, JSON.stringify(blocked.body));
        assert.equal(blocked.body.status, "BLOCKED");

        const audits = await prisma.auditEvent.count({ where: { tenantId: tenantA.id, entityId: { in: [phase.body.id, building.body.id, floor.body.id, unitType.body.id, unit.body.id] }, action: { startsWith: "COMMERCIAL_" } } });
        assert.equal(audits, 7);
      });

      const pdfDocument = await request(
        `/projects/${createdProject.body.id}/documents`,
        {
          token: adminToken,
          method: "POST",
          body: {
            code: "DRW-001",
            title: "Integration Drawing",
            documentType: "DRAWING",
          },
        },
      );
      assert.equal(pdfDocument.response.status, 201, JSON.stringify(pdfDocument.body));

      const pdfBytes = Buffer.from("%PDF-1.4\nR4C integration test\n");
      const pdfVersion = await uploadVersion({
        token: adminToken,
        documentId: pdfDocument.body.id,
        fileName: "integration.pdf",
        mimeType: "application/pdf",
        bytes: pdfBytes,
      });

      await t.test("presigned object upload and download preserve bytes", async () => {
        const download = await request(
          `/document-versions/${pdfVersion.id}/download-url`,
          { token: adminToken },
        );
        assert.equal(download.response.status, 200, JSON.stringify(download.body));
        const object = await fetch(download.body.url);
        assert.ok(object.ok, `Object download returned ${object.status}`);
        assert.deepEqual(
          Buffer.from(await object.arrayBuffer()),
          pdfBytes,
        );
      });

      await t.test("C02 pricing, payment plans, and media preserve commercial controls", async () => {
        const forbiddenDraft = await request(`/commercial/units/${commercialUnitId}/prices`, {
          token: readerLogin.body.accessToken,
          method: "POST",
          body: { basePriceMinor: "10000000", listPriceMinor: "11000000", currency: "SAR" },
        });
        assert.equal(forbiddenDraft.response.status, 403);

        const firstDraft = await request(`/commercial/units/${commercialUnitId}/prices`, {
          token: adminToken,
          method: "POST",
          body: { basePriceMinor: "10000000", listPriceMinor: "11000000", currency: "SAR", validFrom: "2030-01-01T00:00:00.000Z" },
        });
        assert.equal(firstDraft.response.status, 201, JSON.stringify(firstDraft.body));
        assert.equal(firstDraft.body.status, "DRAFT");

        const firstPublished = await request(`/commercial/unit-prices/${firstDraft.body.id}/publish`, { token: adminToken, method: "POST" });
        assert.equal(firstPublished.response.status, 201, JSON.stringify(firstPublished.body));
        assert.equal(firstPublished.body.status, "PUBLISHED");
        assert.equal(firstPublished.body.validFrom, "2030-01-01T00:00:00.000Z");

        const secondDraft = await request(`/commercial/units/${commercialUnitId}/prices`, {
          token: adminToken,
          method: "POST",
          body: { basePriceMinor: "12000000", listPriceMinor: "12500000", currency: "SAR", validFrom: "2030-02-01T00:00:00.000Z" },
        });
        assert.equal(secondDraft.response.status, 201, JSON.stringify(secondDraft.body));
        const secondPublished = await request(`/commercial/unit-prices/${secondDraft.body.id}/publish`, { token: adminToken, method: "POST" });
        assert.equal(secondPublished.response.status, 201, JSON.stringify(secondPublished.body));
        assert.equal(secondPublished.body.status, "PUBLISHED");

        const firstPersisted = await prisma.unitPriceRevision.findUnique({ where: { id: firstDraft.body.id } });
        assert.equal(firstPersisted.status, "SUPERSEDED");
        assert.equal(firstPersisted.validTo.toISOString(), "2030-02-01T00:00:00.000Z");
        assert.equal(firstPersisted.listPriceMinor.toString(), "11000000");

        const published = await request(`/commercial/units/${commercialUnitId}/prices`, { token: adminToken });
        assert.equal(published.response.status, 200, JSON.stringify(published.body));
        assert.equal(published.body.length, 2);
        assert.ok(published.body.every((revision) => revision.status !== "DRAFT"));

        const invalidPlan = await request(`/commercial/projects/${createdProject.body.id}/payment-plans`, {
          token: adminToken,
          method: "POST",
          body: { installments: [{ sequence: 1, shareBasisPoints: 7000 }, { sequence: 2, shareBasisPoints: 2000 }] },
        });
        assert.equal(invalidPlan.response.status, 400);

        const paymentPlan = await request(`/commercial/projects/${createdProject.body.id}/payment-plans`, {
          token: adminToken,
          method: "POST",
          body: { installments: [{ sequence: 1, shareBasisPoints: 2500, label: "Booking" }, { sequence: 2, shareBasisPoints: 7500, label: "Completion" }] },
        });
        assert.equal(paymentPlan.response.status, 201, JSON.stringify(paymentPlan.body));
        assert.equal(paymentPlan.body.installments.reduce((sum, installment) => sum + installment.shareBasisPoints, 0), 10000);

        const media = await request(`/commercial/units/${commercialUnitId}/media`, {
          token: adminToken,
          method: "POST",
          body: { documentVersionId: pdfVersion.id, sortOrder: 1 },
        });
        assert.equal(media.response.status, 201, JSON.stringify(media.body));
        assert.equal(media.body.documentVersionId, pdfVersion.id);

        const mediaAudit = await prisma.auditEvent.findFirst({ where: { tenantId: tenantA.id, entityId: media.body.id, action: "COMMERCIAL_UNIT_MEDIA_ATTACHED" } });
        assert.ok(mediaAudit, "Commercial media attachment must produce an audit event");
        assert.ok(commercialBuildingId, "Commercial hierarchy must retain the created building identity");
      });

      const ifcDocument = await request(
        `/projects/${createdProject.body.id}/documents`,
        {
          token: adminToken,
          method: "POST",
          body: {
            code: "BIM-001",
            title: "Integration Model",
            documentType: "IFC",
          },
        },
      );
      assert.equal(ifcDocument.response.status, 201, JSON.stringify(ifcDocument.body));

      const ifcVersion = await uploadVersion({
        token: adminToken,
        documentId: ifcDocument.body.id,
        fileName: "integration.ifc",
        mimeType: "application/ifc",
        bytes: Buffer.from("ISO-10303-21;\nHEADER;\nENDSEC;\nEND-ISO-10303-21;"),
      });
      const processing = await request(
        `/document-versions/${ifcVersion.id}/bim/process`,
        { token: adminToken, method: "POST" },
      );
      assert.equal(processing.response.status, 201, JSON.stringify(processing.body));
      assert.equal(processing.body.status, "QUEUED");

      await t.test("BIM request persists and reaches Redis queue", async () => {
        const job = await queue.getJob(processing.body.processingJobId);
        assert.ok(job, "Expected BIM job in Redis");
        assert.equal(job.data.tenantId, tenantA.id);
        assert.equal(job.data.bimModelId, processing.body.bimModelId);

        const persisted = await prisma.bimProcessingJob.findUnique({
          where: { id: processing.body.processingJobId },
        });
        assert.ok(
          ["QUEUED", "RUNNING", "FAILED"].includes(persisted?.status),
          `Unexpected BIM job lifecycle state: ${persisted?.status}`,
        );
        assert.equal(persisted?.tenantId, tenantA.id);
      });
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.stack : error}\nAPI logs:\n${apiLogs}`);
    }
  },
);
