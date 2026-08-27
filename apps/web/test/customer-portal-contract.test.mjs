import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portal = await readFile(new URL("../components/CustomerPortfolio.tsx", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/public/commercial/[...path]/route.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/explore/page.tsx", import.meta.url), "utf8");

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
