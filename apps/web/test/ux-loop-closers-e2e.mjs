import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webBase = process.env.JOURNEY_WEB_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.JOURNEY_API_URL ?? "http://127.0.0.1:4000/api/v1";
const email = process.env.JOURNEY_UAT_ADMIN_EMAIL ?? "uat.admin@alomran.test";
const password = process.env.JOURNEY_UAT_ADMIN_PASSWORD;
const workspaceHost = "alomran.r4c.local";
let webIpOctet = 10;

class CookieJar {
  values = new Map();

  absorb(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    for (const raw of cookies) {
      const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      const expired = attributes.some((attribute) => /^max-age=0$/i.test(attribute));
      if (expired || value === "") this.values.delete(name);
      else this.values.set(name, value);
    }
    return cookies;
  }

  header() {
    return [...this.values.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  get(name) {
    return this.values.get(name);
  }
}

async function webRequest(jar, pathname, options = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", `198.51.100.${webIpOctet++}`);
  }
  if (jar.header()) headers.set("cookie", jar.header());
  if (options.body !== undefined) headers.set("content-type", "application/json");
  headers.set("origin", webBase);
  const response = await fetch(`${webBase}${pathname}`, {
    method: options.method ?? "GET",
    headers,
    redirect: options.redirect ?? "manual",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const setCookies = jar.absorb(response);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body, text, setCookies };
}

async function apiRequest(pathname, options = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.forwardedFor ? { "x-forwarded-for": options.forwardedFor } : {}),
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body, text };
}

async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory)) {
    if ([".next", "node_modules", "test"].includes(entry)) continue;
    const full = path.join(directory, entry);
    const metadata = await stat(full);
    if (metadata.isDirectory()) result.push(...(await sourceFiles(full)));
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry)) result.push(full);
  }
  return result;
}

async function createCostFixture(jar, token) {
  const suffix = Date.now().toString(36).slice(-6).toUpperCase();
  const project = await webRequest(jar, "/api/projects", {
    method: "POST",
    body: {
      code: `UAT-${suffix}`,
      name: "Alomran UAT residential development",
      description: "Phase 6.5 tenant and deep-link verification fixture",
      startDate: "2026-01-01",
      targetDate: "2027-12-31",
    },
  });
  assert.equal(project.response.status, 201, JSON.stringify(project.body));

  const wbs = await apiRequest(`/projects/${project.body.id}/wbs`, {
    method: "POST",
    token,
    body: { code: "01", name: "Residential towers" },
  });
  assert.equal(wbs.response.status, 201, wbs.text);

  const budget = await apiRequest(`/projects/${project.body.id}/budgets`, {
    method: "POST",
    token,
    body: {
      name: "Alomran UAT approved budget",
      revision: "UAT-1",
      currency: "SAR",
      lines: [
        {
          wbsNodeId: wbs.body.id,
          costCode: "TWR-001",
          description: "Residential towers controlled allowance",
          quantity: "1.0000",
          unit: "LS",
          unitRate: "2500000.0000",
        },
      ],
    },
  });
  assert.equal(budget.response.status, 201, budget.text);
  const published = await apiRequest(
    `/projects/${project.body.id}/budgets/${budget.body.id}/publish`,
    { method: "POST", token },
  );
  assert.equal(published.response.status, 201, published.text);
  return project.body;
}

test("Phase 6.5 closes tenant and 5D navigation loops", { timeout: 180_000 }, async () => {
  assert.ok(password, "JOURNEY_UAT_ADMIN_PASSWORD is required");

  const tenantLookup = await apiRequest("/tenants/by-code/ALOMRAN");
  assert.equal(tenantLookup.response.status, 200, tenantLookup.text);
  assert.deepEqual(Object.keys(tenantLookup.body).sort(), ["code", "id", "name", "status"]);
  assert.equal(tenantLookup.body.code, "ALOMRAN");
  assert.equal(tenantLookup.body.name, "Alomran Development");
  assert.equal(tenantLookup.body.status, "ACTIVE");
  const tenantUuid = tenantLookup.body.id;

  const unknownLookup = await apiRequest("/tenants/by-code/DOES_NOT_EXIST");
  assert.equal(unknownLookup.response.status, 404);
  assert.equal(unknownLookup.body.message, "Tenant not found");

  const englishJar = new CookieJar();
  const englishLoginPage = await webRequest(englishJar, "/login", {
    headers: { "x-forwarded-host": workspaceHost },
  });
  assert.equal(englishLoginPage.response.status, 200);
  assert.match(englishLoginPage.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(englishLoginPage.text, /Alomran Development/);
  assert.doesNotMatch(englishLoginPage.text, /Tenant UUID/);
  assert.ok(!englishLoginPage.text.includes(tenantUuid));

  const arabicJar = new CookieJar();
  const arabicLocale = await webRequest(arabicJar, "/api/locale", {
    method: "POST",
    body: { locale: "ar" },
  });
  assert.equal(arabicLocale.response.status, 200);
  const arabicLoginPage = await webRequest(arabicJar, "/login", {
    headers: { "x-forwarded-host": workspaceHost },
  });
  assert.equal(arabicLoginPage.response.status, 200);
  assert.match(arabicLoginPage.text, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.match(arabicLoginPage.text, /العمران للتطوير العقاري/);
  assert.ok(!arabicLoginPage.text.includes(tenantUuid));

  const loginBody = { email, password };
  assert.deepEqual(Object.keys(loginBody), ["email", "password"]);
  const login = await webRequest(englishJar, "/api/session/login", {
    method: "POST",
    headers: { "x-forwarded-host": workspaceHost },
    body: loginBody,
  });
  assert.equal(login.response.status, 201, JSON.stringify(login.body));
  assert.equal(login.body.user.tenant.code, "ALOMRAN");
  assert.equal(login.body.user.tenant.name, "Alomran Development");
  assert.ok(!("tenantId" in login.body.user));
  assert.ok(!JSON.stringify(login.body).includes(tenantUuid));
  assert.ok(login.setCookies.some((cookie) => cookie.startsWith("r4c_tenant_code=ALOMRAN")));
  assert.ok(!login.setCookies.some((cookie) => cookie.startsWith("r4c_tenant_id=")));
  assert.ok(!login.setCookies.some((cookie) => cookie.includes(tenantUuid)));

  const session = await webRequest(englishJar, "/api/session");
  assert.equal(session.response.status, 200, JSON.stringify(session.body));
  assert.equal(session.body.user.tenant.code, "ALOMRAN");
  assert.ok(!("tenantId" in session.body.user));
  assert.ok(!JSON.stringify(session.body).includes(tenantUuid));

  const project = await createCostFixture(englishJar, englishJar.get("r4c_access_token"));
  const costData = await webRequest(
    englishJar,
    `/api/projects/${project.id}/cost-control?asOf=2026-07-21`,
  );
  assert.equal(costData.response.status, 200, JSON.stringify(costData.body));
  assert.equal(costData.body.budget.currency, "SAR");
  assert.equal(costData.body.nodes.length, 1);

  const deepLinkEn = await webRequest(
    englishJar,
    `/cost-control?projectId=${encodeURIComponent(project.id)}`,
  );
  assert.equal(deepLinkEn.response.status, 200);
  assert.match(deepLinkEn.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(deepLinkEn.text, /5D cost control/);

  const switchArabic = await webRequest(englishJar, "/api/locale", {
    method: "POST",
    body: { locale: "ar" },
  });
  assert.equal(switchArabic.response.status, 200);
  const deepLinkAr = await webRequest(
    englishJar,
    `/cost-control?projectId=${encodeURIComponent(project.id)}`,
  );
  assert.equal(deepLinkAr.response.status, 200);
  assert.match(deepLinkAr.text, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.match(deepLinkAr.text, /التحكم في التكلفة 5D/);

  const bogus = await webRequest(englishJar, "/cost-control?projectId=00000000-0000-0000-0000-000000000000");
  assert.equal(bogus.response.status, 200);

  const unknownJar = new CookieJar();
  const unknownPage = await webRequest(unknownJar, "/login", {
    headers: { "x-forwarded-host": "unknown.r4c.local" },
  });
  assert.equal(unknownPage.response.status, 200);
  assert.match(unknownPage.text, /Organization could not be resolved/);
  const unknownLogin = await webRequest(unknownJar, "/api/session/login", {
    method: "POST",
    headers: { "x-forwarded-host": "unknown.r4c.local" },
    body: loginBody,
  });
  assert.equal(unknownLogin.response.status, 404);

  const rateStatuses = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    rateStatuses.push(
      (await apiRequest("/tenants/by-code/ALOMRAN", { forwardedFor: "198.51.100.77" }))
        .response.status,
    );
  }
  assert.deepEqual(rateStatuses, [200, 200, 200, 429]);

  const dashboardSource = await readFile(
    path.resolve("components/CostControlDashboard.tsx"),
    "utf8",
  );
  assert.match(dashboardSource, /useSearchParams/);
  assert.match(dashboardSource, /queryProjectId/);
  assert.match(dashboardSource, /result\.some\(\(project\) => project\.id === queryProjectId\)/);
  assert.match(dashboardSource, /\? queryProjectId\s*:\s*""/);
  assert.match(dashboardSource, /router\.replace/);
  assert.match(dashboardSource, /params\.set\("projectId", nextProjectId\)/);

  const loginSource = await readFile(path.resolve("components/LoginForm.tsx"), "utf8");
  assert.doesNotMatch(loginSource, /tenantId|Tenant UUID/);
  assert.match(loginSource, /email/);
  assert.match(loginSource, /password/);

  const files = await sourceFiles(process.cwd());
  const browserStorageReferences = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (/\b(?:localStorage|sessionStorage|document\.cookie)\b/.test(content)) {
      browserStorageReferences.push(path.relative(process.cwd(), file));
    }
  }
  assert.deepEqual(browserStorageReferences, []);

  console.log(`PHASE65_TENANT endpointFields=id,code,name,status code=ALOMRAN status=ACTIVE unknown=404 rate=${rateStatuses.join(",")}`);
  console.log("PHASE65_LOGIN fields=email,password subdomain=alomran.r4c.local uuidInHtml=false uuidInJson=false uuidInCookies=false sessionTenant=ALOMRAN");
  console.log(`PHASE65_DEEPLINK project=${project.id} data=200 en=ltr ar=rtl urlSync=true bogusFallback=true`);
  console.log("PHASE65_UAT login=true canonicalName=Alomran Development arabicName=العمران للتطوير العقاري roles=verified-by-workflow idempotent=verified-by-workflow");
  console.log(`PHASE65_FOUNDATION browserStorageReferences=${browserStorageReferences.length} refreshCookie=${Boolean(englishJar.get("r4c_refresh_token"))}`);
});
