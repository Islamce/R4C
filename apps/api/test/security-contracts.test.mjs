import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AuthorizationService } from "../dist/common/authorization.js";
import {
  actorsAreIndependent,
  canAcceptCommissioningResult,
  resolveTurnoverState,
  safetyInvestigationRequired,
} from "../dist/common/domain-policies.js";

test("authorization is deny-by-default for missing permissions", () => {
  const authorization = new AuthorizationService();
  assert.equal(authorization.hasAll(["project:read"], ["project:read"]), true);
  assert.equal(
    authorization.hasAll(["project:read"], ["project:read", "project:update"]),
    false,
  );
  assert.equal(authorization.hasAll([], ["project:read"]), false);
});

test("separation and commissioning acceptance policies are explicit", () => {
  assert.equal(actorsAreIndependent("performer", "reviewer"), true);
  assert.equal(actorsAreIndependent("same", "same"), false);
  assert.equal(canAcceptCommissioningResult("PASS"), true);
  assert.equal(canAcceptCommissioningResult("NOT_APPLICABLE"), true);
  assert.equal(canAcceptCommissioningResult("FAIL"), false);
  assert.equal(canAcceptCommissioningResult("CONDITIONAL"), false);
});

test("serious HSE events always require investigation", () => {
  assert.equal(safetyInvestigationRequired("INCIDENT", "LOW"), true);
  assert.equal(safetyInvestigationRequired("NEAR_MISS", "MEDIUM"), true);
  assert.equal(safetyInvestigationRequired("HAZARD", "HIGH"), true);
  assert.equal(safetyInvestigationRequired("OBSERVATION", "CRITICAL"), true);
  assert.equal(safetyInvestigationRequired("OBSERVATION", "LOW"), false);
});

test("turnover readiness cannot bypass commissioning", () => {
  assert.equal(resolveTurnoverState({ acceptedPackage: false }), "NOT_STARTED");
  assert.equal(
    resolveTurnoverState({
      testStatus: "SUBMITTED",
      testResult: "PASS",
      acceptedPackage: false,
    }),
    "COMMISSIONING",
  );
  assert.equal(
    resolveTurnoverState({
      testStatus: "ACCEPTED",
      testResult: "FAIL",
      acceptedPackage: true,
    }),
    "BLOCKED",
  );
  assert.equal(
    resolveTurnoverState({
      testStatus: "ACCEPTED",
      testResult: "PASS",
      acceptedPackage: false,
    }),
    "READY_FOR_HANDOVER",
  );
  assert.equal(
    resolveTurnoverState({
      testStatus: "ACCEPTED",
      testResult: "PASS",
      acceptedPackage: true,
    }),
    "HANDED_OVER",
  );
});

test("tenant-owned Prisma models declare tenantId", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  const globalModels = new Set([
    "Tenant",
    "User",
    "Permission",
    "RolePermission",
    "RefreshToken",
    "ProjectMember",
  ]);
  const models = [...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)];
  assert.ok(models.length > 40, "expected the enterprise schema to be inspected");
  for (const [, name, body] of models) {
    if (globalModels.has(name)) continue;
    assert.match(body, /\btenantId\s+String\b/, `${name} must declare tenantId`);
  }
});

test("sensitive controllers protect every route with permissions", async () => {
  const controllers = ["commercial", "cost", "materials", "quality", "hse", "turnover"];
  for (const moduleName of controllers) {
    const source = await readFile(
      new URL(`../src/${moduleName}/${moduleName}.controller.ts`, import.meta.url),
      "utf8",
    );
    const routes = source.match(/@(Get|Post|Put|Patch|Delete)\(/g) ?? [];
    const guards = source.match(/@RequirePermissions\(/g) ?? [];
    assert.ok(routes.length > 0, `${moduleName} must expose routes`);
    assert.equal(
      guards.length,
      routes.length,
      `${moduleName} must guard every route`,
    );
  }
});
