import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const port = Number(process.env.RATE_LIMIT_API_PORT ?? 4117);
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const tenantCode = process.env.SEED_TENANT_CODE ?? "R4C-RATE-LIMIT-CI";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "rate-limit-admin@r4c.test";
const adminPassword =
  process.env.SEED_ADMIN_PASSWORD ?? "Correct-Horse-Battery-Staple-42";
const loginLimit = Number(process.env.RATE_LIMIT_LOGIN_PER_MINUTE ?? 3);
const uploadLimit = Number(process.env.RATE_LIMIT_UPLOAD_PER_MINUTE ?? 2);
const searchLimit = Number(process.env.RATE_LIMIT_SEARCH_EXPORT_PER_MINUTE ?? 3);
const globalLimit = Number(process.env.RATE_LIMIT_GLOBAL_PER_MINUTE ?? 4);

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

async function request(path, { method = "GET", body, token, clientIp } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: response.status, body: parsed };
}

function login(tenantId, clientIp, password = adminPassword) {
  return request("/auth/login", {
    method: "POST",
    clientIp,
    body: { email: adminEmail, password, tenantId },
  });
}

async function exhaust(path, options, allowedStatus, limit) {
  const statuses = [];
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const result = await request(path, options);
    statuses.push(result.status);
    assert.equal(result.status, allowedStatus, JSON.stringify(result.body));
  }
  const blocked = await request(path, options);
  statuses.push(blocked.status);
  assert.equal(blocked.status, 429, JSON.stringify(blocked.body));
  return { statuses, blockedBody: blocked.body };
}

test(
  "rate limiting protects public and protected routes per real client IP",
  { timeout: 120_000 },
  async (t) => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
    assert.equal(process.env.TRUST_PROXY_HOPS ?? "1", "1");

    const prisma = new PrismaClient();
    const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
    assert.ok(tenant, `Seeded tenant ${tenantCode} was not found`);

    let apiLogs = "";
    const apiProcess = spawn(process.execPath, ["dist/main.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_PORT: String(port),
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

      const normalLogin = await login(tenant.id, "198.51.100.10");
      assert.equal(normalLogin.status, 201, JSON.stringify(normalLogin.body));
      assert.equal(normalLogin.body.user.role, "ADMIN");
      assert.ok(normalLogin.body.accessToken);
      console.log(
        `RATE_LIMIT_NORMAL_LOGIN status=${normalLogin.status} token=${normalLogin.body.accessToken.slice(0, 16)}...<redacted>`,
      );

      const unauthenticated = await request("/projects", {
        clientIp: "198.51.100.11",
      });
      assert.equal(unauthenticated.status, 401, JSON.stringify(unauthenticated.body));
      const authenticated = await request("/projects", {
        clientIp: "198.51.100.10",
        token: normalLogin.body.accessToken,
      });
      assert.equal(authenticated.status, 200, JSON.stringify(authenticated.body));
      console.log(
        `RATE_LIMIT_AUTH_COMPOSITION unauthenticated=${unauthenticated.status} authenticated=${authenticated.status}`,
      );

      const loginAbuseStatuses = [];
      for (let attempt = 0; attempt < loginLimit; attempt += 1) {
        const result = await login(
          tenant.id,
          "198.51.100.20",
          "deliberately-wrong-password",
        );
        loginAbuseStatuses.push(result.status);
        assert.equal(result.status, 401, JSON.stringify(result.body));
      }
      const loginBlocked = await login(
        tenant.id,
        "198.51.100.20",
        "deliberately-wrong-password",
      );
      loginAbuseStatuses.push(loginBlocked.status);
      assert.equal(loginBlocked.status, 429, JSON.stringify(loginBlocked.body));
      console.log(
        `RATE_LIMIT_LOGIN_ABUSE statuses=${loginAbuseStatuses.join(",")} response=${JSON.stringify(loginBlocked.body)}`,
      );

      const independentClient = await login(tenant.id, "198.51.100.21");
      assert.equal(independentClient.status, 201, JSON.stringify(independentClient.body));
      console.log(
        `RATE_LIMIT_PROXY_ISOLATION exhaustedClient=198.51.100.20 independentClient=198.51.100.21 status=${independentClient.status}`,
      );

      const upload = await exhaust(
        "/documents/unused-document/versions/upload-request",
        {
          method: "POST",
          clientIp: "198.51.100.30",
          body: {
            revision: "A",
            fileName: "large-model.ifc",
            mimeType: "application/x-step",
            sizeBytes: 1,
          },
        },
        401,
        uploadLimit,
      );
      console.log(
        `RATE_LIMIT_UPLOAD statuses=${upload.statuses.join(",")} response=${JSON.stringify(upload.blockedBody)}`,
      );

      const search = await exhaust(
        "/materials?q=concrete",
        { clientIp: "198.51.100.40" },
        401,
        searchLimit,
      );
      console.log(
        `RATE_LIMIT_SEARCH statuses=${search.statuses.join(",")} response=${JSON.stringify(search.blockedBody)}`,
      );

      const global = await exhaust(
        "/health",
        { clientIp: "198.51.100.50" },
        200,
        globalLimit,
      );
      console.log(
        `RATE_LIMIT_GLOBAL_PUBLIC statuses=${global.statuses.join(",")} response=${JSON.stringify(global.blockedBody)}`,
      );
    } catch (error) {
      throw new Error(`${error}\nAPI logs:\n${apiLogs}`);
    }
  },
);
