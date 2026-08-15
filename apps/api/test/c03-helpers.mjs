import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { hashTestPassword } from "./argon2-test-helpers.mjs";

export const password = "Correct-Horse-Battery-Staple-42";

export const c03Permissions = [
  "commercial:lead:create",
  "commercial:lead:view-own",
  "commercial:lead:view-all",
  "commercial:lead:reassign",
  "commercial:lead:qualify",
  "commercial:lead:disqualify",
  "commercial:customer:create",
  "commercial:customer:view",
  "commercial:activity:log",
  "commercial:activity:view",
];

export function apiClient(port) {
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  return {
    baseUrl,
    async request(path, { token, method = "GET", body } = {}) {
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
    },
    login(email, tenantId) {
      return this.request("/auth/login", { method: "POST", body: { email, password, tenantId } });
    },
  };
}

export async function startApi(t, port, { environment = {}, removeEnvironment = [] } = {}) {
  const client = apiClient(port);
  let logs = "";
  const environmentForProcess = {
    ...process.env,
    API_PORT: String(port),
    HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "c03-test-access-secret-that-is-long-enough",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "c03-test-refresh-secret-that-is-long-enough",
    BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
    BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "c03-worker-token",
    S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
    S3_REGION: process.env.S3_REGION ?? "us-east-1",
    S3_BUCKET: process.env.S3_BUCKET ?? "r4c-c03",
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "c03-access",
    S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "c03-secret",
    ...environment,
  };
  for (const key of removeEnvironment) delete environmentForProcess[key];
  const apiProcess = spawn(process.execPath, ["dist/main.js"], {
    cwd: process.cwd(),
    env: environmentForProcess,
    stdio: ["ignore", "pipe", "pipe"],
  });
  apiProcess.stdout.on("data", (chunk) => { logs = (logs + chunk.toString()).slice(-12_000); });
  apiProcess.stderr.on("data", (chunk) => { logs = (logs + chunk.toString()).slice(-12_000); });
  t.after(async () => {
    apiProcess.kill("SIGTERM");
    if (apiProcess.exitCode === null) await Promise.race([once(apiProcess, "exit"), new Promise((resolve) => setTimeout(resolve, 5_000))]);
    if (apiProcess.exitCode === null) apiProcess.kill("SIGKILL");
  });
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) throw new Error(`API exited before readiness (code ${apiProcess.exitCode})\n${logs}`);
    try {
      const response = await fetch(`${client.baseUrl}/health/ready`);
      if (response.ok) return { ...client, logs: () => logs };
      lastError = new Error(`Readiness returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`API did not become ready: ${lastError}\n${logs}`);
}

export async function createFixture(prisma, suffix, { withUnit = false } = {}) {
  const passwordHash = await hashTestPassword(password);
  const tenant = await prisma.tenant.create({ data: { code: `C03-${suffix}`, name: "C03 Tenant" } });
  const otherTenant = await prisma.tenant.create({ data: { code: `C03-O-${suffix}`, name: "Other C03 Tenant" } });
  await prisma.permission.createMany({ data: c03Permissions.map((code) => ({ code, name: code })), skipDuplicates: true });
  const permissions = await prisma.permission.findMany({ where: { code: { in: c03Permissions } } });
  const managerRole = await prisma.role.create({ data: { tenantId: tenant.id, code: "MANAGER", name: "Manager" } });
  const agentRole = await prisma.role.create({ data: { tenantId: tenant.id, code: "AGENT", name: "Agent" } });
  const readerRole = await prisma.role.create({ data: { tenantId: tenant.id, code: "READER", name: "Reader" } });
  const agentCodes = ["commercial:lead:create", "commercial:lead:view-own", "commercial:lead:qualify", "commercial:lead:disqualify", "commercial:customer:create", "commercial:customer:view", "commercial:activity:log", "commercial:activity:view"];
  await prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: managerRole.id, permissionId: permission.id })) });
  await prisma.rolePermission.createMany({ data: permissions.filter((permission) => agentCodes.includes(permission.code)).map((permission) => ({ roleId: agentRole.id, permissionId: permission.id })) });
  const manager = await prisma.user.create({ data: { email: `manager-${suffix}@c03.test`, displayName: "C03 Manager", passwordHash } });
  const agent = await prisma.user.create({ data: { email: `agent-${suffix}@c03.test`, displayName: "C03 Agent", passwordHash } });
  const reader = await prisma.user.create({ data: { email: `reader-${suffix}@c03.test`, displayName: "C03 Reader", passwordHash } });
  const outsider = await prisma.user.create({ data: { email: `outsider-${suffix}@c03.test`, displayName: "Other Tenant", passwordHash } });
  const outsiderRole = await prisma.role.create({ data: { tenantId: otherTenant.id, code: "MANAGER", name: "Other Manager" } });
  await prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: outsiderRole.id, permissionId: permission.id })) });
  await prisma.tenantMembership.createMany({ data: [
    { tenantId: tenant.id, userId: manager.id, roleId: managerRole.id },
    { tenantId: tenant.id, userId: agent.id, roleId: agentRole.id },
    { tenantId: tenant.id, userId: reader.id, roleId: readerRole.id },
    { tenantId: otherTenant.id, userId: outsider.id, roleId: outsiderRole.id },
  ] });
  const fixture = { tenant, otherTenant, manager, agent, reader, outsider };
  if (!withUnit) return fixture;
  const project = await prisma.project.create({ data: { tenantId: tenant.id, code: `C03-P-${suffix}`, name: "C03 Project" } });
  const phase = await prisma.developmentPhase.create({ data: { tenantId: tenant.id, projectId: project.id, code: "P01", name: "Phase 01" } });
  const building = await prisma.building.create({ data: { tenantId: tenant.id, projectId: project.id, phaseId: phase.id, code: "B01", name: "Building 01" } });
  const floor = await prisma.floor.create({ data: { tenantId: tenant.id, buildingId: building.id, code: "F01", name: "First Floor", floorNumber: 1 } });
  const unitType = await prisma.unitType.create({ data: { tenantId: tenant.id, projectId: project.id, code: "1BR", name: "One bedroom", bedrooms: 1, bathrooms: 1 } });
  const unit = await prisma.unit.create({ data: { tenantId: tenant.id, projectId: project.id, phaseId: phase.id, buildingId: building.id, floorId: floor.id, unitTypeId: unitType.id, code: "U101", number: "101", grossArea: "75.00", bedrooms: 1, bathrooms: 1, status: "AVAILABLE" } });
  return { ...fixture, project, phase, building, floor, unitType, unit };
}

export function expectStatus(result, status, api) {
  assert.equal(result.response.status, status, `${JSON.stringify(result.body)}\nAPI logs:\n${api.logs()}`);
}
