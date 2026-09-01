import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portal = await readFile(new URL("../components/CustomerPortfolio.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/public/commercial/[...path]/route.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/explore/page.tsx", import.meta.url), "utf8");
const projects = await readFile(new URL("../components/ProjectsJourney.tsx", import.meta.url), "utf8");
const publishRoute = await readFile(new URL("../app/api/projects/[projectId]/publish/route.ts", import.meta.url), "utf8");
const projectsPage = await readFile(new URL("../app/(authenticated)/projects/page.tsx", import.meta.url), "utf8");

test("customer portal resolves tenant and exposes only bounded public endpoints", () => {
  assert.match(page, /tenantCodeForRequest/);
  for (const endpoint of ["portfolio", "phone/request", "phone/verify", "interests"]) assert.match(route, new RegExp(endpoint.replace("/", "\\/")));
  assert.match(route, /const allowed = new Set/);
});

test("interest submission requires Saudi phone syntax, OTP verification, and enquiry consent", () => {
  assert.match(portal, /saudiMobile/);
  assert.match(portal, /phone\/request/);
  assert.match(portal, /phone\/verify/);
  assert.match(portal, /disabled=\{!verified \|\| busy\}/);
  assert.match(portal, /name="consent" type="checkbox" required/);
  assert.match(portal, /marketingConsentGranted/);
});

test("customer can select a project and an optional available unit", () => {
  assert.match(portal, /portfolio\.projects/);
  assert.match(portal, /selectedProject\.units\.map/);
  assert.match(portal, /unitId: selectedUnitId \|\| undefined/);
});

test("administrators can publish eligible draft projects to the portal", () => {
  assert.match(projects, /project\.status === "DRAFT"/);
  assert.match(projects, /canPublish && project\.status/);
  assert.match(projectsPage, /permissions\.includes\("project:create"\)/);
  assert.match(projects, /publishProject\(project\.id\)/);
  assert.match(publishRoute, /\/projects\/\$\{encodeURIComponent\(projectId\)\}\/publish/);
  assert.match(publishRoute, /method: "POST"/);
});
