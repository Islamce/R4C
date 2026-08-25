import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workspace = await readFile(new URL("../components/CommercialOperatorWorkspace.tsx", import.meta.url), "utf8");
const messages = await readFile(new URL("../lib/commercial-i18n.ts", import.meta.url), "utf8");
const proxy = await readFile(new URL("../app/api/backend/[...path]/route.ts", import.meta.url), "utf8");
const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const login = await readFile(new URL("../components/LoginForm.tsx", import.meta.url), "utf8");
const suite = await readFile(new URL("../components/CommercialWorkspaceSuite.tsx", import.meta.url), "utf8");
const pipeline = await readFile(new URL("../components/SalesPipelineWorkspace.tsx", import.meta.url), "utf8");

test("production entry routes users into the commercial journey", () => {
  assert.match(home, /redirect\("\/login"\)/);
  assert.match(login, /router\.replace\("\/commercial"\)/);
});

test("commercial journey authorizes exclusively through session permissions", () => {
  for (const permission of [
    "commercial:lead:view-own", "commercial:lead:view-all", "commercial:lead:qualify",
    "commercial:lead:reassign", "commercial:hold:create", "commercial:hold:release",
    "commercial:reservation:confirm", "commercial:manage",
  ]) assert.match(workspace, new RegExp(permission.replaceAll(":", "\\:")));
  assert.doesNotMatch(workspace, /user\.role\s*===|role\s*===\s*["'](?:ADMIN|SALES_)/);
});

test("English and Arabic use the shared i18n provider and RTL-safe logical CSS", async () => {
  assert.match(messages, /en:\s*\{/);
  assert.match(messages, /ar:\s*\{/);
  assert.match(messages, /"commercial\.review"/);
  assert.match(workspace, /useI18n\(\)/);
  assert.match(workspace, /commercialApi\.unit\(id, locale\)/);
  assert.match(suite, /<SalesPipelineWorkspace[^>]+ar=\{ar\}/);
  assert.match(pipeline, /dir=\{ar \? "rtl" : "ltr"\}/);
  for (const label of ["Sales pipeline", "Customer pipeline", "Project library", "Performance & alerts", "Consolidated customer register"]) {
    assert.match(pipeline, new RegExp(`text\\(ar, "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  const css = await readFile(new URL("../app/commercial.css", import.meta.url), "utf8");
  assert.match(css, /border-inline-start/);
  assert.match(css, /padding-inline/);
});

test("the browser proxy exposes only the bounded journey contracts", () => {
  assert.match(proxy, /commercial\\\/projects\\\/\[\^\/\]\+\\\/payment-plans/);
  assert.match(proxy, /commercial\\\/leads/);
  assert.match(proxy, /commercial\\\/holds/);
  assert.match(proxy, /commercial\\\/assignees/);
  assert.match(proxy, /admin\\\/users/);
});

test("mass import validates contacts and campaign results before governed creation", () => {
  assert.match(workspace, /parseBulkCsv\(contents/);
  assert.match(workspace, /bulkMode === "campaign"/);
  assert.match(workspace, /commercialApi\.createCustomer/);
  assert.match(workspace, /commercialApi\.createLead/);
  assert.match(workspace, /commercialApi\.logActivity\(lead\.id/);
  assert.match(messages, /"commercial\.bulkCampaign"/);
  assert.match(messages, /"commercial\.bulkReady"/);
});

test("project inventory requests cannot overwrite a newer unit selection context", () => {
  assert.match(workspace, /let active = true;/);
  assert.match(workspace, /if \(active\) setUnits\(items\)/);
  assert.match(workspace, /return \(\) => \{ active = false; \};/);
  assert.match(workspace, /status: "AVAILABLE"/);
});
