import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { createPrismaClient } from "../dist/prisma/client.js";
import {
  hashTestPassword,
  verifyTestPassword,
} from "./argon2-test-helpers.mjs";

const port = Number(process.env.AUTH_SESSION_API_PORT ?? 4127);
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const password = "Correct-Horse-Battery-Staple-42";

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

async function request(path, { method = "GET", body, token } = {}) {
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
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

function login(email, tenantId) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password, tenantId },
  });
}

function refresh(refreshToken, tenantId) {
  return request("/auth/refresh", {
    method: "POST",
    body: { refreshToken, tenantId },
  });
}

function logout(refreshToken, tenantId) {
  return request("/auth/logout", {
    method: "POST",
    body: { refreshToken, tenantId },
  });
}

function tokenParts(refreshToken) {
  const separator = refreshToken.indexOf(".");
  assert.ok(separator > 0, "Refresh token must contain a lookup id and secret");
  return {
    id: refreshToken.slice(0, separator),
    secret: refreshToken.slice(separator + 1),
  };
}

test(
  "refresh sessions rotate, detect reuse, revoke on logout, and remain tenant-bound",
  { timeout: 120_000 },
  async (t) => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
    const prisma = createPrismaClient();
    const suffix = randomUUID().slice(0, 8);
    const email = `auth-session-${suffix}@r4c.test`;

    const permission = await prisma.permission.upsert({
      where: { code: "project:read" },
      update: {},
      create: { code: "project:read", name: "project:read" },
    });
    const tenantA = await prisma.tenant.create({
      data: { code: `AUTH-A-${suffix}`, name: "Auth Session Tenant A" },
    });
    const tenantB = await prisma.tenant.create({
      data: { code: `AUTH-B-${suffix}`, name: "Auth Session Tenant B" },
    });
    const roleA = await prisma.role.create({
      data: { tenantId: tenantA.id, code: "ADMIN", name: "Administrator" },
    });
    const roleB = await prisma.role.create({
      data: { tenantId: tenantB.id, code: "ADMIN", name: "Administrator" },
    });
    await prisma.rolePermission.createMany({
      data: [
        { roleId: roleA.id, permissionId: permission.id },
        { roleId: roleB.id, permissionId: permission.id },
      ],
    });
    const user = await prisma.user.create({
      data: {
        email,
        displayName: "Auth Session Administrator",
        passwordHash: await hashTestPassword(password),
      },
    });
    await prisma.tenantMembership.createMany({
      data: [
        { tenantId: tenantA.id, userId: user.id, roleId: roleA.id },
        { tenantId: tenantB.id, userId: user.id, roleId: roleB.id },
      ],
    });

    let apiLogs = "";
    const apiProcess = spawn(process.execPath, ["dist/main.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_PORT: String(port),
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "auth-session-test-access-secret-that-is-long-enough",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "auth-session-test-refresh-secret-that-is-long-enough",
        S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
        S3_REGION: process.env.S3_REGION ?? "us-east-1",
        S3_BUCKET: process.env.S3_BUCKET ?? "r4c-auth-session",
        S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "auth-session-access",
        S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "auth-session-secret",
        HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
        BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
        BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "ci-worker-token",
        RATE_LIMIT_LOGIN_PER_MINUTE: "50",
        RATE_LIMIT_AUTH_SESSION_PER_MINUTE: "50",
        REFRESH_TOKEN_TTL_DAYS: "14",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    apiProcess.stdout.on("data", (chunk) => {
      apiLogs = (apiLogs + chunk.toString()).slice(-16_000);
    });
    apiProcess.stderr.on("data", (chunk) => {
      apiLogs = (apiLogs + chunk.toString()).slice(-16_000);
    });

    t.after(async () => {
      apiProcess.kill("SIGTERM");
      if (apiProcess.exitCode === null) {
        await Promise.race([
          once(apiProcess, "exit"),
          new Promise((resolve) => setTimeout(resolve, 5_000)),
        ]);
      }
      await prisma.$disconnect();
    });

    try {
      await waitForApi(apiProcess);

      const initialLogin = await login(email, tenantA.id);
      assert.equal(initialLogin.status, 201, JSON.stringify(initialLogin.body));
      assert.ok(initialLogin.body.accessToken);
      assert.ok(initialLogin.body.refreshToken);
      assert.equal(initialLogin.body.expiresInSeconds, 900);
      assert.ok(initialLogin.body.refreshTokenExpiresInSeconds > 0);

      const initialParts = tokenParts(initialLogin.body.refreshToken);
      const storedInitial = await prisma.refreshToken.findUnique({
        where: { id: initialParts.id },
      });
      assert.ok(storedInitial);
      assert.notEqual(storedInitial.tokenHash, initialLogin.body.refreshToken);
      assert.notEqual(storedInitial.tokenHash, initialParts.secret);
      assert.match(storedInitial.tokenHash, /^\$argon2id\$/);
      assert.equal(
        await verifyTestPassword(storedInitial.tokenHash, initialParts.secret),
        true,
      );
      console.log(
        "AUTH_LOGIN_REFRESH status=201 access=issued refresh=issued storage=argon2id-only plaintextStored=false",
      );

      const accessUse = await request("/projects", {
        token: initialLogin.body.accessToken,
      });
      assert.equal(accessUse.status, 200, JSON.stringify(accessUse.body));
      console.log(`AUTH_ACCESS_COMPATIBILITY status=${accessUse.status}`);

      const rotation = await refresh(initialLogin.body.refreshToken, tenantA.id);
      assert.equal(rotation.status, 200, JSON.stringify(rotation.body));
      assert.ok(rotation.body.accessToken);
      assert.ok(rotation.body.refreshToken);
      assert.notEqual(rotation.body.refreshToken, initialLogin.body.refreshToken);
      const rotatedParts = tokenParts(rotation.body.refreshToken);
      const oldAfterRotation = await prisma.refreshToken.findUnique({
        where: { id: initialParts.id },
      });
      assert.ok(oldAfterRotation.revokedAt);
      console.log(
        `AUTH_REFRESH_ROTATION status=200 oldTokenRevoked=true newTokenIssued=true oldId=${initialParts.id} newId=${rotatedParts.id}`,
      );

      const reused = await refresh(initialLogin.body.refreshToken, tenantA.id);
      assert.equal(reused.status, 401, JSON.stringify(reused.body));
      const rotatedAfterReuse = await prisma.refreshToken.findUnique({
        where: { id: rotatedParts.id },
      });
      assert.ok(rotatedAfterReuse.revokedAt);
      const reuseAudit = await prisma.auditEvent.findFirst({
        where: {
          tenantId: tenantA.id,
          actorId: user.id,
          action: "AUTH_REFRESH_REUSE_DETECTED",
          entityId: initialParts.id,
        },
      });
      assert.ok(reuseAudit);
      console.log(
        `AUTH_REFRESH_REUSE status=${reused.status} compromiseDetected=true activeTenantSessionsRevoked=true`,
      );

      const tenantLogin = await login(email, tenantA.id);
      assert.equal(tenantLogin.status, 201, JSON.stringify(tenantLogin.body));
      const crossTenant = await refresh(tenantLogin.body.refreshToken, tenantB.id);
      assert.equal(crossTenant.status, 401, JSON.stringify(crossTenant.body));
      const correctTenantAfterRejection = await refresh(
        tenantLogin.body.refreshToken,
        tenantA.id,
      );
      assert.equal(
        correctTenantAfterRejection.status,
        200,
        JSON.stringify(correctTenantAfterRejection.body),
      );
      console.log(
        `AUTH_TENANT_ISOLATION crossTenant=${crossTenant.status} correctTenant=${correctTenantAfterRejection.status}`,
      );

      const expiredLogin = await login(email, tenantA.id);
      assert.equal(expiredLogin.status, 201, JSON.stringify(expiredLogin.body));
      const expiredParts = tokenParts(expiredLogin.body.refreshToken);
      await prisma.refreshToken.update({
        where: { id: expiredParts.id },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });
      const expired = await refresh(expiredLogin.body.refreshToken, tenantA.id);
      assert.equal(expired.status, 401, JSON.stringify(expired.body));
      console.log(`AUTH_REFRESH_EXPIRED status=${expired.status}`);

      const logoutLogin = await login(email, tenantA.id);
      assert.equal(logoutLogin.status, 201, JSON.stringify(logoutLogin.body));
      const logoutParts = tokenParts(logoutLogin.body.refreshToken);
      const loggedOut = await logout(logoutLogin.body.refreshToken, tenantA.id);
      assert.equal(loggedOut.status, 200, JSON.stringify(loggedOut.body));
      assert.deepEqual(loggedOut.body, { revoked: true });
      const storedLogout = await prisma.refreshToken.findUnique({
        where: { id: logoutParts.id },
      });
      assert.ok(storedLogout.revokedAt);
      const refreshAfterLogout = await refresh(
        logoutLogin.body.refreshToken,
        tenantA.id,
      );
      assert.equal(refreshAfterLogout.status, 401, JSON.stringify(refreshAfterLogout.body));
      const logoutAudit = await prisma.auditEvent.findFirst({
        where: {
          tenantId: tenantA.id,
          actorId: user.id,
          action: "AUTH_LOGOUT",
          entityId: logoutParts.id,
        },
      });
      assert.ok(logoutAudit);
      console.log(
        `AUTH_LOGOUT status=${loggedOut.status} tokenRevoked=true subsequentRefresh=${refreshAfterLogout.status}`,
      );
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.stack : error}\nAPI logs:\n${apiLogs}`,
      );
    }
  },
);
