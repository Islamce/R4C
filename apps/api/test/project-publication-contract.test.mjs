import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const controller = await readFile(new URL("../src/projects/projects.controller.ts", import.meta.url), "utf8");
const service = await readFile(new URL("../src/projects/projects.service.ts", import.meta.url), "utf8");

test("project publication is permission guarded and tenant scoped", () => {
  assert.match(controller, /Post\(":projectId\/publish"\)[\s\S]*RequirePermissions\("project:create"\)/);
  assert.match(service, /async publish\(tenantId: string, projectId: string, actorId: string\)/);
  assert.match(service, /requireProject\(tenantId, projectId\)/);
});

test("only draft projects with available inventory can be published", () => {
  assert.match(service, /project\.status !== "DRAFT"/);
  assert.match(service, /where: \{ tenantId, projectId, status: "AVAILABLE" \}/);
  assert.match(service, /availableUnits === 0/);
  assert.match(service, /data: \{ status: "ACTIVE" \}/);
  assert.match(service, /action: "PROJECT_PUBLISHED"/);
});
