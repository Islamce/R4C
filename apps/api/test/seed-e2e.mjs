import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const port = Number(process.env.SEED_E2E_API_PORT ?? 4108);
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const seedConfig = {
  SEED_TENANT_CODE: "R4C-SEED-CI",
  SEED_TENANT_NAME: "R4C Seed CI Tenant",
  SEED_ADMIN_EMAIL: "bootstrap.admin@r4c.test",
};
const strongPassword = "Seed-Admin-Password-2026!";

function runSeed(passwordMarker) {
  const env = { ...process.env, ...seedConfig };
  if (passwordMarker === undefined) {
    delete env.SEED_ADMIN_PASSWORD;
  } else {
    env.SEED_ADMIN_PASSWORD = passwordMarker;
  }

  return spawnSync("pnpm", ["seed"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
}

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

async function snapshot(prisma) {
  const tenant = await prisma.tenant.findUnique({
    where: { code: seedConfig.SEED_TENANT_CODE },
  });
  const user = await prisma.user.findUnique({
    where: { email: seedConfig.SEED_ADMIN_EMAIL },
  });
  const roles = tenant
    ? await prisma.role.findMany({ where: { tenantId: tenant.id } })
    : [];
  const roleIds = roles.map((role) => role.id);

  return {
    tenants: await prisma.tenant.count({
      where: { code: seedConfig.SEED_TENANT_CODE },
    }),
    users: await prisma.user.count({
      where: { email: seedConfig.SEED_ADMIN_EMAIL },
    }),
    roles: roles.length,
    memberships:
      tenant && user
        ? await prisma.tenantMembership.count({
            where: { tenantId: tenant.id, userId: user.id },
          })
        : 0,
    permissions: await prisma.permission.count(),
    rolePermissionLinks:
      roleIds.length > 0
        ? await prisma.rolePermission.count({ where: { roleId: { in: roleIds } } })
        : 0,
  };
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

test(
  "bootstrap seed is guarded, idempotent, and authenticates through the real API",
  { timeout: 120_000 },
  async (t) => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
    const prisma = new PrismaClient();

    const initial = await snapshot(prisma);

    const missingPassword = runSeed(undefined);
    assert.notEqual(missingPassword.status, 0, missingPassword.stdout);
    assert.match(
      `${missingPassword.stdout}\n${missingPassword.stderr}`,
      /SEED_ADMIN_PASSWORD is required and must contain at least 12 characters/,
    );

    const weakPassword = runSeed("too-short");
    assert.notEqual(weakPassword.status, 0, weakPassword.stdout);
    assert.match(
      `${weakPassword.stdout}\n${weakPassword.stderr}`,
      /SEED_ADMIN_PASSWORD is required and must contain at least 12 characters/,
    );

    const afterGuardrails = await snapshot(prisma);
    assert.deepEqual(afterGuardrails, initial, "guardrail failures must not write data");
    console.log("SEED_GUARDRAIL missing=REJECTED weak=REJECTED writes=0");

    const firstRun = runSeed(strongPassword);
    assert.equal(
      firstRun.status,
      0,
      `First seed failed:\n${firstRun.stdout}\n${firstRun.stderr}`,
    );
    process.stdout.write(firstRun.stdout);
    const afterFirst = await snapshot(prisma);

    assert.equal(afterFirst.tenants, 1);
    assert.equal(afterFirst.users, 1);
    assert.equal(afterFirst.roles, 2);
    assert.equal(afterFirst.memberships, 1);
    assert.ok(afterFirst.permissions > 0, "permissions must be derived from source");
    assert.ok(
      afterFirst.rolePermissionLinks >= afterFirst.permissions,
      "ADMIN must receive every permission",
    );
    console.log(`SEED_FIRST_RUN counts=${JSON.stringify(afterFirst)}`);

    const secondRun = runSeed(strongPassword);
    assert.equal(
      secondRun.status,
      0,
      `Second seed failed:\n${secondRun.stdout}\n${secondRun.stderr}`,
    );
    process.stdout.write(secondRun.stdout);
    const afterSecond = await snapshot(prisma);
    assert.deepEqual(afterSecond, afterFirst);
    console.log(
      `SEED_SECOND_RUN counts=${JSON.stringify(afterSecond)} duplicates=0`,
    );

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: seedConfig.SEED_TENANT_CODE },
    });

    let apiLogs = "";
    const apiProcess = spawn(process.execPath, ["dist/main.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_PORT: String(port),
        HOLD_EXPIRY_SWEEP_INTERVAL_MS: process.env.HOLD_EXPIRY_SWEEP_INTERVAL_MS ?? "3600000",
        JWT_ACCESS_SECRET:
          process.env.JWT_ACCESS_SECRET ??
          "seed-e2e-secret-at-least-32-characters-long",
        BIM_WORKER_URL: process.env.BIM_WORKER_URL ?? "http://127.0.0.1:65535",
        BIM_WORKER_TOKEN: process.env.BIM_WORKER_TOKEN ?? "seed-e2e-worker-token",
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
      await prisma.$disconnect();
    });

    try {
      await waitForApi(apiProcess);
      const login = await request("/auth/login", {
        method: "POST",
        body: {
          email: seedConfig.SEED_ADMIN_EMAIL,
          password: strongPassword,
          tenantId: tenant.id,
        },
      });
      assert.equal(login.response.status, 201, JSON.stringify(login.body));
      assert.equal(login.body.tokenType, "Bearer");
      assert.equal(login.body.user.role, "ADMIN");
      assert.ok(login.body.accessToken);
      assert.ok(login.body.user.permissions.length > 0);

      const projects = await request("/projects", {
        token: login.body.accessToken,
      });
      assert.equal(projects.response.status, 200, JSON.stringify(projects.body));

      console.log(
        `SEEDED_LOGIN status=201 accessToken=${login.body.accessToken.slice(0, 12)}...<redacted> role=${login.body.user.role} permissions=${login.body.user.permissions.length}`,
      );
      console.log("SEEDED_TOKEN_USE method=GET path=/projects status=200");
    } catch (error) {
      throw new Error(`${error}\nAPI logs:\n${apiLogs}`);
    }
  },
);
