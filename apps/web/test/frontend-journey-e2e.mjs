import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webBase = process.env.JOURNEY_WEB_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.JOURNEY_API_URL ?? "http://127.0.0.1:4000/api/v1";
const email = process.env.JOURNEY_ADMIN_EMAIL ?? "phase4.admin@r4c.test";
const password = process.env.JOURNEY_ADMIN_PASSWORD ?? "Phase4-Correct-Horse-Battery-Staple";
const tenantId = process.env.JOURNEY_TENANT_ID;

class CookieJar {
  values = new Map();

  absorb(response) {
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      const expired = attributes.some((attribute) => /^max-age=0$/i.test(attribute));
      if (expired || value === "") this.values.delete(name);
      else this.values.set(name, value);
    }
    return setCookies;
  }

  header() {
    return [...this.values.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  get(name) {
    return this.values.get(name);
  }

  set(name, value) {
    this.values.set(name, value);
  }
}

async function webRequest(jar, pathname, options = {}) {
  const headers = new Headers(options.headers);
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
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body };
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

function cookieWith(name, setCookies) {
  return setCookies.find((value) => value.startsWith(`${name}=`));
}

test("frontend foundation completes the real bilingual project journey", { timeout: 120_000 }, async () => {
  assert.ok(tenantId, "JOURNEY_TENANT_ID is required");
  const jar = new CookieJar();

  const guarded = await webRequest(jar, "/projects");
  assert.ok([303, 307, 308].includes(guarded.response.status));
  assert.equal(new URL(guarded.response.headers.get("location"), webBase).pathname, "/login");

  const loginPage = await webRequest(jar, "/login");
  assert.equal(loginPage.response.status, 200);
  assert.match(loginPage.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(loginPage.text, /Enter the R4C delivery workspace/);

  const login = await webRequest(jar, "/api/session/login", {
    method: "POST",
    body: { email, password, tenantId },
  });
  assert.equal(login.response.status, 201, JSON.stringify(login.body));
  const refreshCookie = cookieWith("r4c_refresh_token", login.setCookies);
  const accessCookie = cookieWith("r4c_access_token", login.setCookies);
  assert.match(refreshCookie ?? "", /HttpOnly/i);
  assert.match(refreshCookie ?? "", /Secure/i);
  assert.match(refreshCookie ?? "", /SameSite=Lax/i);
  assert.match(accessCookie ?? "", /HttpOnly/i);
  assert.match(accessCookie ?? "", /Secure/i);
  assert.ok(jar.get("r4c_refresh_token"));
  assert.ok(jar.get("r4c_access_token"));

  const files = await sourceFiles(process.cwd());
  const browserStorageReferences = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (/\b(?:localStorage|sessionStorage|document\.cookie)\b/.test(content)) {
      browserStorageReferences.push(path.relative(process.cwd(), file));
    }
  }
  assert.deepEqual(browserStorageReferences, []);

  const listed = await webRequest(jar, "/api/projects");
  assert.equal(listed.response.status, 200, JSON.stringify(listed.body));
  assert.ok(Array.isArray(listed.body));

  const code = `P4-${Date.now().toString(36).slice(-6)}`.toUpperCase();
  const created = await webRequest(jar, "/api/projects", {
    method: "POST",
    body: {
      code,
      name: "Phase 4 governed delivery",
      description: "Created through the Next.js server session boundary",
      startDate: "2026-07-21",
      targetDate: "2027-07-21",
    },
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.code, code);
  assert.equal(created.body.tenantId, tenantId);

  const wbsCreated = await apiRequest(`/projects/${created.body.id}/wbs`, {
    method: "POST",
    token: jar.get("r4c_access_token"),
    body: { code: "01", name: "Foundation and substructure" },
  });
  assert.equal(wbsCreated.response.status, 201, JSON.stringify(wbsCreated.body));

  const detail = await webRequest(jar, `/api/projects/${created.body.id}`);
  assert.equal(detail.response.status, 200, JSON.stringify(detail.body));
  assert.equal(detail.body.project.id, created.body.id);
  assert.equal(detail.body.wbs.length, 1);
  assert.equal(detail.body.wbs[0].code, "01");

  const english = await webRequest(jar, "/projects");
  assert.equal(english.response.status, 200);
  assert.match(english.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(english.text, />Projects</);

  const arabicToggle = await webRequest(jar, "/api/locale", {
    method: "POST",
    body: { locale: "ar" },
  });
  assert.equal(arabicToggle.response.status, 200);
  const arabic = await webRequest(jar, "/projects");
  assert.equal(arabic.response.status, 200);
  assert.match(arabic.text, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.match(arabic.text, /المشاريع/);

  const previousRefresh = jar.get("r4c_refresh_token");
  jar.set("r4c_access_token", "expired.invalid.access-token");
  const silentlyRefreshed = await webRequest(jar, "/api/projects");
  assert.equal(silentlyRefreshed.response.status, 200, JSON.stringify(silentlyRefreshed.body));
  assert.equal(silentlyRefreshed.response.headers.get("x-r4c-session-refresh-count"), "1");
  assert.notEqual(jar.get("r4c_refresh_token"), previousRefresh);
  assert.ok(jar.get("r4c_access_token"));

  const logout = await webRequest(jar, "/api/session/logout", { method: "POST" });
  assert.equal(logout.response.status, 200, JSON.stringify(logout.body));
  assert.equal(jar.get("r4c_refresh_token"), undefined);
  assert.equal(jar.get("r4c_access_token"), undefined);

  const guardedAgain = await webRequest(jar, "/projects");
  assert.ok([303, 307, 308].includes(guardedAgain.response.status));
  assert.equal(new URL(guardedAgain.response.headers.get("location"), webBase).pathname, "/login");

  const viewer = await readFile(path.resolve("components/BimViewer.tsx"), "utf8");
  assert.match(viewer, /import \* as THREE from "three"/);

  console.log(`PHASE4_GUARD loggedOut=${guarded.response.status} redirect=/login`);
  console.log("PHASE4_LOGIN status=201 accessCookie=httpOnly+secure refreshCookie=httpOnly+secure sameSite=lax");
  console.log(`PHASE4_STORAGE localStorage=0 sessionStorage=0 documentCookie=0 files=${files.length}`);
  console.log(`PHASE4_PROJECTS list=${listed.response.status} create=${created.response.status} code=${code}`);
  console.log(`PHASE4_DETAIL status=${detail.response.status} project=${created.body.id} wbsNodes=${detail.body.wbs.length}`);
  console.log("PHASE4_LTR lang=en dir=ltr projectsHeading=rendered");
  console.log("PHASE4_RTL lang=ar dir=rtl projectsHeading=rendered");
  console.log("PHASE4_REFRESH forced401=true refreshCount=1 retry=success rotatedRefreshPersisted=true");
  console.log("PHASE4_LOGOUT status=200 cookiesCleared=true protectedRedirect=/login");
  console.log("PHASE4_BIM_VIEWER sourceIntact=true buildRequired=true");
});
