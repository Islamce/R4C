import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) => readFile(resolve(root, relative), "utf8");

test("R4C Sales Command Center is registered and contract-backed", async () => {
  const [route, shell, proxy, api, copy, scope] = await Promise.all([
    read("app/(authenticated)/sales/page.tsx"),
    read("components/AppShell.tsx"),
    read("app/api/backend/[...path]/route.ts"),
    read("lib/crm-api.ts"),
    read("lib/sales-i18n.ts"),
    read("../../docs/R4C-FINAL-UI-SCOPE.md"),
  ]);
  assert.match(route, /SalesCommandCenter/);
  assert.match(shell, /href=\{preview \? "\/design-preview" : "\/sales"\}/);
  assert.match(proxy, /crm/);
  assert.match(proxy, /quotation-revisions/);
  assert.match(api, /crmApi/);
  assert.match(api, /createQuotation/);
  assert.match(copy, /Command Center/);
  assert.match(copy, /مركز القيادة/);
  assert.match(scope, /OUT OF SCOPE/);
  assert.match(scope, /government submission/);
});

test("Sales UI does not claim government execution or use unverified global search", async () => {
  const source = await read("components/SalesCommandCenter.tsx");
  assert.doesNotMatch(source, /submit.*REGA|Wafi.*submit|government.*approved/i);
  assert.doesNotMatch(source, /globalSearch|global-search/);
  assert.match(source, /salesText\(locale, "synthetic"\)/);
  assert.match(source, /availabilityNote/);
});

test("Sales UI is an action-oriented workspace rather than a permanent form wall", async () => {
  const source = await read("components/SalesCommandCenter.tsx");
  const styles = await read("app/sales.css");
  assert.match(source, /sales-signal-strip/);
  assert.match(source, /sales-action-dock/);
  assert.match(source, /sales-drawer-backdrop/);
  assert.match(source, /openDrawer\("activity"\)/);
  assert.match(source, /openDrawer\("task"\)/);
  assert.match(source, /openDrawer\("opportunity"\)/);
  assert.match(source, /crmApi\.createQuotation/);
  assert.match(source, /aria-modal="true"/);
  assert.match(styles, /@media\(max-width:680px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(source, /sales-form-inline/);
});


test("locale toggle route preserves the established bilingual cookie contract", async () => {
  const route = await read("app/api/locale/route.ts");
  assert.match(route, /LOCALE_COOKIE/);
  assert.match(route, /supportedLocales/);
  assert.match(route, /payload\.locale/);
  assert.match(route, /locale: payload\.locale/);
  assert.match(route, /maxAge: 60 \* 60 \* 24 \* 365/);
});


test("Sales drawers preserve keyboard focus and sparse context stays adaptive", async () => {
  const source = await read("components/SalesCommandCenter.tsx");
  const shell = await read("components/AppShell.tsx");
  const shellStyles = await read("app/shell.css");
  const salesStyles = await read("app/sales.css");
  assert.match(source, /drawerRef/);
  assert.match(source, /previousFocusRef/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /sales-context-panel .*is-sparse/);
  assert.match(shell, /onClick=\{toggleLanguage\}/);
  assert.match(shellStyles, /grid-template-columns:228px/);
  assert.match(salesStyles, /sales-context-panel\.is-sparse/);
  assert.match(salesStyles, /@media\(prefers-reduced-motion:reduce\)/);
});

test("Sales mobile composition has intentional flow and no overflow-hiding shortcut", async () => {
  const shell = await read("app/shell.css");
  const sales = await read("app/sales.css");
  assert.match(shell, /mobile-nav-toggle/);
  assert.match(shell, /app-sidebar\.is-nav-open/);
  assert.match(shell, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(sales, /stage-line\{display:none\}/);
  assert.match(sales, /stage-visual\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(sales, /task-chip:has\(\.button\) \.button/);
  assert.match(sales, /height:100dvh/);
  assert.doesNotMatch(shell, /overflow-x:hidden/);
  assert.doesNotMatch(sales, /overflow-x:hidden/);
});
