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
const commercialPage = await readFile(new URL("../app/(authenticated)/commercial/page.tsx", import.meta.url), "utf8");
const designPreviewPage = await readFile(new URL("../app/design-preview/page.tsx", import.meta.url), "utf8");
const serverSession = await readFile(new URL("../lib/server-session.ts", import.meta.url), "utf8");
const tenantResolution = await readFile(new URL("../lib/tenant-resolution.ts", import.meta.url), "utf8");
const shell = await readFile(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
const shellModern = await readFile(new URL("../app/shell-modern.css", import.meta.url), "utf8");
const salesPipelineCss = await readFile(new URL("../app/sales-pipeline.css", import.meta.url), "utf8");
const commercialApi = await readFile(new URL("../lib/commercial-api.ts", import.meta.url), "utf8");
const customerPortfolio = await readFile(new URL("../components/CustomerPortfolio.tsx", import.meta.url), "utf8");

test("production entry routes users into the commercial journey", () => {
  assert.match(home, /redirect\("\/login"\)/);
  assert.match(login, /router\.replace\("\/commercial"\)/);
  assert.match(commercialPage, /CommercialWorkspaceSuite/);
  assert.doesNotMatch(commercialPage, /CommercialOperatorWorkspace/);
  assert.match(designPreviewPage, /process\.env\.NODE_ENV !== "development"/);
  assert.match(designPreviewPage, /CommercialWorkspaceSuite preview/);
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
  for (const route of ["tasks", "transfer-cases", "transfer-documents", "dispatches"]) assert.match(proxy, new RegExp(route));
});

test("production commercial operations persist tasks, transfer reviews, and dispatches", () => {
  assert.match(suite, /SalesPipelineWorkspace externalReservation=\{unitReservation\} ar=\{ar\} persistent=\{!preview\}/);
  assert.match(pipeline, /commercialApi\.tasks\(\)/);
  assert.match(pipeline, /commercialApi\.createTask/);
  assert.match(pipeline, /commercialApi\.updateTask/);
  assert.match(pipeline, /commercialApi\.leads\(canViewAllLeads\)/);
  assert.match(pipeline, /commercialApi\.advanceLead/);
  assert.match(pipeline, /setCustomers\(loaded\)/);
  assert.match(commercialApi, /transferCases:/);
  assert.match(commercialApi, /reviewTransferDocument:/);
  assert.match(commercialApi, /reviewTransferCase:/);
  assert.match(commercialApi, /requestTransferDocumentUpload:/);
  assert.match(commercialApi, /confirmTransferDocumentUpload:/);
  assert.match(commercialApi, /createDispatch:/);
  assert.match(commercialApi, /projectMedia:/);
  assert.match(commercialApi, /requestProjectMediaUpload:/);
  assert.match(commercialApi, /confirmProjectMediaUpload:/);
  assert.match(pipeline, /commercialApi\.createDispatch/);
  assert.match(pipeline, /commercialApi\.requestProjectMediaUpload/);
  assert.match(suite, /commercialApi\.transferCases\(\)/);
  assert.match(suite, /fetch\(request\.uploadUrl/);
  assert.match(suite, /commercialApi\.confirmTransferDocumentUpload/);
  assert.match(suite, /selectedCase\?\.readiness !== 100/);
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

test("production web configuration cannot fall back to localhost or a .local tenant domain", () => {
  assert.match(serverSession, /API_URL is required in production/);
  assert.match(tenantResolution, /TENANT_BASE_DOMAIN is required in production/);
});

test("authenticated routes share the KYNOX shell and commercial tools use real navigation targets", () => {
  for (const target of ["/projects", "/commercial?view=customers#commercial-customers", "/commercial?view=units#commercial-units", "/commercial?view=transfer#commercial-transfer", "/commercial?view=operations#commercial-operations", "/progress", "/cost-control"]) {
    assert.match(shell, new RegExp(target.replace(/[?]/g, "\\?")));
  }
  assert.match(shell, /className="kynox-tool-link" href=\{href\}/);
  assert.match(shellModern, /\.app-shell \{ grid-template-columns: 112px/);
  assert.match(shellModern, /\.kynox-tool-link:hover/);
  assert.match(shell, /locale === "ar" \? "وضع المعاينة" : "Preview mode"/);
  assert.match(shell, /locale === "ar" && user\.role === "ADMIN" \? "مدير النظام" : user\.role/);
  assert.match(workspace, /id="commercial-customers"/);
  assert.match(workspace, /id="commercial-units"/);
  assert.match(workspace, /id="commercial-transfer"/);
  assert.match(workspace, /id="commercial-operations"/);
});

test("commercial UAT safeguards localization, dialogs, contrast, and mobile containment", () => {
  assert.doesNotMatch(suite, /caption = "Portfolio current view"/);
  assert.match(suite, /"Portfolio current view", "عرض المحفظة الحالي"/);
  assert.match(suite, /role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title"/);
  assert.match(suite, /role="dialog"\s+aria-modal="true"\s+aria-labelledby="interest-dialog-title"/);
  assert.match(salesPipelineCss, /\.commercial-suite \.commercial-operator \.page-heading h1 \{ color: #fff; \}/);
  assert.match(shellModern, /\.app-shell \{ width: 100%; max-width: 100%; grid-template-columns: minmax\(0, 1fr\); overflow-x: clip; \}/);
  assert.match(shellModern, /\.app-nav \{ min-width: 0;[^}]+overflow-x: auto;/);
  assert.match(suite, /floor-12-layout-8-units\.png/);
  for (const unit of ["A-1201", "A-1202", "A-1203", "A-1204", "A-1205", "A-1206", "A-1207", "A-1208"]) assert.match(suite, new RegExp(unit));
  assert.match(suite, /8 وحدات/);
  assert.match(pipeline, /canonicalProjectName\(externalReservation\.project\)/);
  assert.doesNotMatch(pipeline, /PERFORMANCE & ALERTING|SALES TEAM CONTROL|PROJECT CONTENT HUB|78\.0M ر\.س/);
  assert.match(customerPortfolio, /role="dialog" aria-modal="true" aria-labelledby="interest-panel-title"/);
  assert.match(customerPortfolio, /document\.body\.style\.overflow = "hidden"/);
  assert.match(customerPortfolio, /event\.key === "Escape"/);
});
