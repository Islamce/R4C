import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url).pathname;
const read = (relative) => readFile(`${root}${relative}`, "utf8");

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
