import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webBase = process.env.JOURNEY_WEB_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.JOURNEY_API_URL ?? "http://127.0.0.1:4000/api/v1";
const adminEmail = process.env.JOURNEY_ADMIN_EMAIL ?? "phase6.admin@r4c.test";
const adminPassword = process.env.JOURNEY_ADMIN_PASSWORD ?? "Phase6-Admin-Correct-Horse-Battery-Staple";
const submitEmail = process.env.JOURNEY_SUBMIT_EMAIL ?? "phase6.submit@r4c.test";
const submitPassword = process.env.JOURNEY_SUBMIT_PASSWORD ?? "Phase6-Submit-Correct-Horse-Battery-Staple";
const tenantId = process.env.JOURNEY_TENANT_ID;
const asOf = "2026-07-21";

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
  jar.absorb(response);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body, text };
}

async function apiRequest(pathname, token, options = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  assert.ok(response.ok, `${options.method ?? "GET"} ${pathname}: ${response.status} ${text}`);
  return body;
}

async function login(jar, email, password) {
  const result = await webRequest(jar, "/api/session/login", {
    method: "POST",
    body: { email, password, tenantId },
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  return result;
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

test("progress workspace closes submit, review, history, and earned-value loop", { timeout: 180_000 }, async () => {
  assert.ok(tenantId, "JOURNEY_TENANT_ID is required");
  const adminJar = new CookieJar();
  const submitJar = new CookieJar();
  await login(adminJar, adminEmail, adminPassword);
  await login(submitJar, submitEmail, submitPassword);

  const adminToken = adminJar.get("r4c_access_token");
  assert.ok(adminToken, "Admin access cookie is required for fixture setup");

  const submitSession = await webRequest(submitJar, "/api/session");
  assert.equal(submitSession.response.status, 200);
  assert.ok(submitSession.body.user.permissions.includes("progress:read"));
  assert.ok(submitSession.body.user.permissions.includes("progress:submit"));
  assert.ok(!submitSession.body.user.permissions.includes("progress:review"));

  const suffix = Date.now().toString(36).slice(-6).toUpperCase();
  const project = await apiRequest("/projects", adminToken, {
    method: "POST",
    body: {
      code: `P6-${suffix}`,
      name: "Phase 6 progress approval loop",
      description: "Progress reporting and approval verification fixture",
      startDate: "2026-01-01T00:00:00.000Z",
      targetDate: "2026-12-31T00:00:00.000Z",
    },
  });
  const wbs = await apiRequest(`/projects/${project.id}/wbs`, adminToken, {
    method: "POST",
    body: { code: "01", name: "Controlled structural package" },
  });
  const budget = await apiRequest(`/projects/${project.id}/budgets`, adminToken, {
    method: "POST",
    body: {
      name: "Phase 6 earned-value loop budget",
      revision: "R1",
      currency: "SAR",
      lines: [
        {
          wbsNodeId: wbs.id,
          costCode: "P6-STR-001",
          description: "Controlled structural package allowance",
          quantity: "1.0000",
          unit: "LS",
          unitRate: "100000.0000",
        },
      ],
    },
  });
  await apiRequest(`/projects/${project.id}/budgets/${budget.id}/publish`, adminToken, {
    method: "POST",
  });

  const submitted = await webRequest(
    submitJar,
    `/api/wbs/${wbs.id}/progress`,
    {
      method: "POST",
      body: { percent: 42.5, note: "Structure progress ready for independent approval" },
    },
  );
  assert.equal(submitted.response.status, 201, JSON.stringify(submitted.body));
  const updateId = submitted.body.id;
  assert.ok(updateId);

  const submittedHistory = await webRequest(submitJar, `/api/wbs/${wbs.id}/progress`);
  assert.equal(submittedHistory.response.status, 200);
  assert.equal(submittedHistory.body.length, 1);
  assert.equal(submittedHistory.body[0].status, "SUBMITTED");
  assert.equal(submittedHistory.body[0].percent, "42.5");
  assert.equal(submittedHistory.body[0].reportedBy.displayName, "Phase 6 Submitter");
  assert.equal(submittedHistory.body[0].reviewedBy, null);

  const beforeApproval = await webRequest(
    adminJar,
    `/api/projects/${project.id}/cost-control?asOf=${asOf}`,
  );
  assert.equal(beforeApproval.response.status, 200, JSON.stringify(beforeApproval.body));
  assert.equal(beforeApproval.body.summary.earnedValue, "0.00");

  const forbiddenReview = await webRequest(
    submitJar,
    `/api/progress/${updateId}/review`,
    {
      method: "POST",
      body: { decision: "APPROVED", comment: "Submitter must not approve this record" },
    },
  );
  assert.equal(forbiddenReview.response.status, 403);

  const approved = await webRequest(adminJar, `/api/progress/${updateId}/review`, {
    method: "POST",
    body: { decision: "APPROVED", comment: "Independent reviewer confirms installed progress" },
  });
  assert.equal(approved.response.status, 200, JSON.stringify(approved.body));
  assert.equal(approved.body.status, "APPROVED");

  const approvedHistory = await webRequest(adminJar, `/api/wbs/${wbs.id}/progress`);
  assert.equal(approvedHistory.response.status, 200);
  assert.equal(approvedHistory.body[0].status, "APPROVED");
  assert.equal(approvedHistory.body[0].reportedBy.displayName, "Phase 6 Submitter");
  assert.equal(approvedHistory.body[0].reviewedBy.displayName, "R4C Administrator");
  assert.equal(approvedHistory.body[0].reviewComment, "Independent reviewer confirms installed progress");
  assert.ok(approvedHistory.body[0].reviewedAt);

  const afterApproval = await webRequest(
    adminJar,
    `/api/projects/${project.id}/cost-control?asOf=${asOf}`,
  );
  assert.equal(afterApproval.response.status, 200, JSON.stringify(afterApproval.body));
  assert.equal(afterApproval.body.summary.earnedValue, "42500.00");

  const decidedAgain = await webRequest(adminJar, `/api/progress/${updateId}/review`, {
    method: "POST",
    body: { decision: "REJECTED", comment: "A decided update cannot be reviewed again" },
  });
  assert.equal(decidedAgain.response.status, 409);
  assert.equal(decidedAgain.body.error.status, 409);
  assert.match(decidedAgain.body.error.message, /Only submitted progress may be reviewed/);
  assert.ok(!JSON.stringify(decidedAgain.body).includes("stack"));

  const english = await webRequest(adminJar, "/progress");
  assert.equal(english.response.status, 200);
  assert.match(english.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(english.text, /Progress reporting and approval/);

  const arabicToggle = await webRequest(adminJar, "/api/locale", {
    method: "POST",
    body: { locale: "ar" },
  });
  assert.equal(arabicToggle.response.status, 200);
  const arabic = await webRequest(adminJar, "/progress");
  assert.equal(arabic.response.status, 200);
  assert.match(arabic.text, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.match(arabic.text, /تسجيل التقدم واعتماده/);

  const componentSource = await readFile(path.resolve("components/ProgressWorkspace.tsx"), "utf8");
  assert.match(componentSource, /permissions\.includes\("progress:submit"\)/);
  assert.match(componentSource, /permissions\.includes\("progress:review"\)/);
  assert.match(componentSource, /canReview && update\.status === "SUBMITTED"/);
  assert.match(componentSource, /error\.status === 409/);
  assert.match(componentSource, /progress\.reviewConflict/);
  assert.match(componentSource, /\/cost-control\?projectId=/);
  assert.match(componentSource, /statusIcons\[update\.status\]/);

  const files = await sourceFiles(process.cwd());
  const browserStorageReferences = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (/\b(?:localStorage|sessionStorage|document\.cookie)\b/.test(content)) {
      browserStorageReferences.push(path.relative(process.cwd(), file));
    }
  }
  assert.deepEqual(browserStorageReferences, []);

  const projects = await webRequest(adminJar, "/api/projects");
  assert.equal(projects.response.status, 200);
  assert.ok(projects.body.some((row) => row.id === project.id));
  const costPage = await webRequest(adminJar, "/cost-control");
  assert.equal(costPage.response.status, 200);
  const viewer = await readFile(path.resolve("components/BimViewer.tsx"), "utf8");
  assert.match(viewer, /const API_URL = "\/api\/backend"/);

  console.log(`PHASE6_SUBMIT project=${project.id} wbs=${wbs.id} update=${updateId} percent=42.5 status=SUBMITTED reporter=submit-only`);
  console.log("PHASE6_SEPARATION submitPermission=true reviewPermission=false forbiddenReview=403 uiReviewHidden=true");
  console.log("PHASE6_APPROVE status=APPROVED reviewer=admin historyReporter=true historyReviewer=true");
  console.log(`PHASE6_EV_LOOP before=0.00 after=${afterApproval.body.summary.earnedValue} currency=${afterApproval.body.budget.currency}`);
  console.log("PHASE6_CONFLICT secondReview=409 normalized=true gracefulMessage=true stack=false");
  console.log("PHASE6_LTR lang=en dir=ltr heading=rendered route=200");
  console.log("PHASE6_RTL lang=ar dir=rtl heading=rendered route=200");
  console.log(`PHASE6_FOUNDATION browserStorageReferences=${browserStorageReferences.length} projects=200 costControl=200 bimViewerServerProxy=true`);
});
