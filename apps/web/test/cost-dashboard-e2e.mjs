import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webBase = process.env.JOURNEY_WEB_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.JOURNEY_API_URL ?? "http://127.0.0.1:4000/api/v1";
const email = process.env.JOURNEY_ADMIN_EMAIL ?? "phase5.admin@r4c.test";
const password = process.env.JOURNEY_ADMIN_PASSWORD ?? "Phase5-Correct-Horse-Battery-Staple";
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
  const setCookies = jar.absorb(response);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body, text, setCookies };
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

function assertMoney(value, label) {
  assert.equal(typeof value, "string", `${label} must remain a string`);
  assert.match(value, /^-?\d+\.\d{2}$/, `${label} must preserve decimal precision`);
}

async function createProject(token, code, name) {
  return apiRequest("/projects", token, {
    method: "POST",
    body: {
      code,
      name,
      description: "Phase 5 cost-control verification fixture",
      startDate: "2026-01-01T00:00:00.000Z",
      targetDate: "2026-12-31T00:00:00.000Z",
    },
  });
}

async function createWbs(token, projectId, code, name) {
  return apiRequest(`/projects/${projectId}/wbs`, token, {
    method: "POST",
    body: { code, name },
  });
}

async function publishBudget(token, projectId, revision, lines) {
  const budget = await apiRequest(`/projects/${projectId}/budgets`, token, {
    method: "POST",
    body: {
      name: `Phase 5 ${revision} controlled budget`,
      revision,
      currency: "SAR",
      lines,
    },
  });
  await apiRequest(`/projects/${projectId}/budgets/${budget.id}/publish`, token, {
    method: "POST",
  });
  return budget;
}

async function approveProgress(token, wbsNodeId, percent) {
  const progress = await apiRequest(`/wbs/${wbsNodeId}/progress`, token, {
    method: "POST",
    body: { percent, note: "Approved Phase 5 earned-value fixture" },
  });
  await apiRequest(`/progress/${progress.id}/review`, token, {
    method: "POST",
    body: { decision: "APPROVED", comment: "Verified for the cost dashboard" },
  });
}

async function postCost(token, projectId, wbsNodeId, entryType, externalId, amount) {
  return apiRequest(`/projects/${projectId}/cost-ledger`, token, {
    method: "POST",
    body: {
      entryType,
      externalId,
      wbsNodeId,
      description: `${entryType} Phase 5 verification entry`,
      amount,
      currency: "SAR",
      occurredAt: "2026-07-15T00:00:00.000Z",
    },
  });
}

async function populatedFixture(token, suffix) {
  const project = await createProject(token, `P5-${suffix}`, "Phase 5 earned-value tower");
  const structure = await createWbs(token, project.id, "01", "Structure and envelope");
  const fitout = await createWbs(token, project.id, "02", "MEP and fit-out");

  const schedule = await apiRequest(`/projects/${project.id}/schedules`, token, {
    method: "POST",
    body: {
      name: "Phase 5 control baseline",
      revision: "BL1",
      dataDate: "2026-07-21T00:00:00.000Z",
      activities: [
        {
          externalId: "A-100",
          name: "Complete structure and envelope",
          wbsNodeId: structure.id,
          plannedStart: "2026-01-01T00:00:00.000Z",
          plannedFinish: "2026-06-30T00:00:00.000Z",
          weight: 60,
        },
        {
          externalId: "A-200",
          name: "Install MEP and fit-out",
          wbsNodeId: fitout.id,
          plannedStart: "2026-04-01T00:00:00.000Z",
          plannedFinish: "2026-12-31T00:00:00.000Z",
          weight: 40,
        },
      ],
      dependencies: [],
    },
  });
  await apiRequest(`/projects/${project.id}/schedules/${schedule.id}/publish`, token, {
    method: "POST",
  });

  await approveProgress(token, structure.id, 80);
  await approveProgress(token, fitout.id, 20);

  await publishBudget(token, project.id, "R1", [
    {
      wbsNodeId: structure.id,
      costCode: "STR-001",
      description: "Structure and envelope allowance",
      quantity: "1.0000",
      unit: "LS",
      unitRate: "600000.0000",
    },
    {
      wbsNodeId: fitout.id,
      costCode: "FIT-001",
      description: "MEP and fit-out allowance",
      quantity: "1.0000",
      unit: "LS",
      unitRate: "400000.0000",
    },
  ]);

  await postCost(token, project.id, structure.id, "COMMITMENT", `COM-STR-${suffix}`, "550000.00");
  await postCost(token, project.id, structure.id, "ACTUAL", `ACT-STR-${suffix}`, "500000.00");
  await postCost(token, project.id, fitout.id, "COMMITMENT", `COM-FIT-${suffix}`, "250000.00");
  await postCost(token, project.id, fitout.id, "ACTUAL", `ACT-FIT-${suffix}`, "150000.00");

  return project;
}

async function partialFixture(token, suffix) {
  const project = await createProject(token, `P5N-${suffix}`, "Phase 5 partial cost state");
  const wbs = await createWbs(token, project.id, "01", "Unstarted controlled scope");
  await publishBudget(token, project.id, "R0", [
    {
      wbsNodeId: wbs.id,
      costCode: "NEW-001",
      description: "Published scope awaiting progress and cost",
      quantity: "1.0000",
      unit: "LS",
      unitRate: "125000.0000",
    },
  ]);
  return project;
}

test("5D dashboard presents populated and partial cost-control states", { timeout: 180_000 }, async () => {
  assert.ok(tenantId, "JOURNEY_TENANT_ID is required");
  const jar = new CookieJar();
  const login = await webRequest(jar, "/api/session/login", {
    method: "POST",
    body: { email, password, tenantId },
  });
  assert.equal(login.response.status, 201, JSON.stringify(login.body));
  const token = jar.get("r4c_access_token");
  assert.ok(token, "Access cookie is required for fixture setup");

  const suffix = Date.now().toString(36).slice(-6).toUpperCase();
  const populatedProject = await populatedFixture(token, suffix);
  const partialProject = await partialFixture(token, suffix);

  const populated = await webRequest(
    jar,
    `/api/projects/${populatedProject.id}/cost-control?asOf=${asOf}`,
  );
  assert.equal(populated.response.status, 200, JSON.stringify(populated.body));
  assert.equal(populated.body.budget.currency, "SAR");
  assert.equal(populated.body.nodes.length, 2);
  assert.notEqual(populated.body.summary.cpi, null);
  assert.notEqual(populated.body.summary.spi, null);
  assert.notEqual(populated.body.summary.estimateAtCompletion, null);
  assert.ok(populated.body.summary.cpi < 1);
  assert.ok(populated.body.summary.spi < 1);
  assert.ok(populated.body.nodes.some((node) => node.costVariance.startsWith("-")));
  assert.ok(populated.body.nodes.some((node) => node.scheduleVariance.startsWith("-")));

  for (const [label, value] of Object.entries({
    bac: populated.body.summary.budgetAtCompletion,
    pv: populated.body.summary.plannedValue,
    ev: populated.body.summary.earnedValue,
    ac: populated.body.summary.actualCost,
    commitments: populated.body.summary.commitments,
    exposure: populated.body.summary.forecastExposure,
    cv: populated.body.summary.costVariance,
    sv: populated.body.summary.scheduleVariance,
    eac: populated.body.summary.estimateAtCompletion,
    etc: populated.body.summary.estimateToComplete,
    vac: populated.body.summary.varianceAtCompletion,
  })) {
    assertMoney(value, label);
  }
  for (const node of populated.body.nodes) {
    for (const field of [
      "budget",
      "plannedValue",
      "earnedValue",
      "committed",
      "actualCost",
      "costVariance",
      "scheduleVariance",
      "forecastExposure",
    ]) {
      assertMoney(node[field], `${node.code}.${field}`);
    }
  }

  const partial = await webRequest(
    jar,
    `/api/projects/${partialProject.id}/cost-control?asOf=${asOf}`,
  );
  assert.equal(partial.response.status, 200, JSON.stringify(partial.body));
  assert.ok(partial.body.budget);
  assert.ok(partial.body.summary);
  assert.equal(partial.body.summary.cpi, null);
  assert.equal(partial.body.summary.spi, null);
  assert.equal(partial.body.summary.estimateAtCompletion, null);
  assert.equal(partial.body.summary.estimateToComplete, null);
  assert.equal(partial.body.summary.varianceAtCompletion, null);
  assert.equal(partial.body.nodes.length, 1);
  assert.ok(!JSON.stringify(partial.body).includes("NaN"));

  const english = await webRequest(jar, "/cost-control");
  assert.equal(english.response.status, 200);
  assert.match(english.text, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(english.text, /5D cost control/);

  const arabicToggle = await webRequest(jar, "/api/locale", {
    method: "POST",
    body: { locale: "ar" },
  });
  assert.equal(arabicToggle.response.status, 200);
  const arabic = await webRequest(jar, "/cost-control");
  assert.equal(arabic.response.status, 200);
  assert.match(arabic.text, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.match(arabic.text, /التحكم في التكلفة 5D/);

  const files = await sourceFiles(process.cwd());
  const browserStorageReferences = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (/\b(?:localStorage|sessionStorage|document\.cookie)\b/.test(content)) {
      browserStorageReferences.push(path.relative(process.cwd(), file));
    }
  }
  assert.deepEqual(browserStorageReferences, []);

  const dashboardSource = await readFile(
    path.resolve("components/CostControlDashboard.tsx"),
    "utf8",
  );
  assert.match(dashboardSource, /BigInt\(parsed\.whole\)/);
  assert.match(dashboardSource, /compareDecimalStrings/);
  assert.doesNotMatch(dashboardSource, /parseFloat\s*\(/);
  assert.doesNotMatch(
    dashboardSource,
    /Number\([^)]*(?:budget|plannedValue|earnedValue|actualCost|committed|costVariance|scheduleVariance|forecastExposure)/,
  );
  assert.match(dashboardSource, /aria-sort=/);
  assert.match(dashboardSource, /cost\.partialTitle/);

  const projects = await webRequest(jar, "/api/projects");
  assert.equal(projects.response.status, 200);
  assert.ok(projects.body.some((project) => project.id === populatedProject.id));

  const viewer = await readFile(path.resolve("components/BimViewer.tsx"), "utf8");
  assert.match(viewer, /import \* as THREE from "three"/);
  assert.match(viewer, /const API_URL = "\/api\/backend"/);

  console.log(`PHASE5_POPULATED project=${populatedProject.id} currency=SAR cpi=${populated.body.summary.cpi} spi=${populated.body.summary.spi} nodes=${populated.body.nodes.length}`);
  console.log(`PHASE5_VARIANCE adverseCost=true adverseSchedule=true bac=${populated.body.summary.budgetAtCompletion} ac=${populated.body.summary.actualCost}`);
  console.log(`PHASE5_PARTIAL project=${partialProject.id} cpi=null spi=null eac=null nodes=${partial.body.nodes.length} nan=false`);
  console.log("PHASE5_LTR lang=en dir=ltr heading=rendered populatedRoute=200");
  console.log("PHASE5_RTL lang=ar dir=rtl heading=rendered populatedRoute=200");
  console.log(`PHASE5_MONEY strings=true decimalPrecision=true bigintFormatting=true floatingMoneyMath=false currency=${populated.body.budget.currency}`);
  console.log(`PHASE5_FOUNDATION browserStorageReferences=${browserStorageReferences.length} projectsJourney=200 bimViewerServerProxy=true`);
});
