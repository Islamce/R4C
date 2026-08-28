import { TenantStatus } from "@prisma/client";
import { createPrismaClient } from "../src/prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, verifyPassword } from "../src/auth/auth.service";

const prisma = createPrismaClient();
const READ_ONLY_ACTIONS = new Set(["read", "list", "get"]);
const COMMERCIAL_ROLE_DEFINITIONS = [
  {
    code: "SALES_AGENT",
    name: "Sales Agent",
    permissions: [
      "project:read",
      "commercial:read",
      "commercial:price:view-published",
      "commercial:payment-plan:view",
      "commercial:customer:create",
      "commercial:customer:view",
      "commercial:lead:create",
      "commercial:lead:view-own",
      "commercial:lead:qualify",
      "commercial:lead:disqualify",
      "commercial:activity:view",
      "commercial:activity:log",
      "commercial:hold:create",
      "commercial:hold:release",
      "commercial:task:view",
      "commercial:dispatch:create",
      "commercial:transfer:view",
      "commercial:transfer:upload",
    ],
  },
  {
    code: "SALES_MANAGER",
    name: "Sales Manager",
    permissions: [
      "commercial:lead:view-all",
      "commercial:lead:reassign",
      "commercial:reservation:confirm",
      "commercial:task:manage",
      "commercial:transfer:upload",
      "commercial:transfer:review",
    ],
  },
] as const;
const PERMISSION_LITERAL = /(["'`])([a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+)\1/g;
const REQUIRE_PERMISSIONS = /@RequirePermissions\s*\(([\s\S]*?)\)/g;

type SeedChangeSummary = {
  created: Record<string, number>;
  updated: Record<string, number>;
  removed: Record<string, number>;
  totals: Record<string, number>;
  permissionSourceFiles: number;
};

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(absolutePath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectPermissionLiterals(source: string, target: Set<string>) {
  for (const match of source.matchAll(PERMISSION_LITERAL)) {
    const code = match[2];
    if (code) target.add(code);
  }
}

async function derivePermissionCodes(sourceRoot: string) {
  const permissionCodes = new Set<string>();
  const sourceFiles = await listTypeScriptFiles(sourceRoot);
  let contributingFiles = 0;

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    const before = permissionCodes.size;

    for (const match of source.matchAll(REQUIRE_PERMISSIONS)) {
      collectPermissionLiterals(match[1] ?? "", permissionCodes);
    }

    const relativePath = path.relative(sourceRoot, file);
    const isCentralPermissionSource =
      /permission|authorization/i.test(relativePath) || /\bPERMISSIONS?\b/.test(source);
    if (isCentralPermissionSource) {
      collectPermissionLiterals(source, permissionCodes);
    }

    if (permissionCodes.size > before) contributingFiles += 1;
  }

  if (permissionCodes.size === 0) {
    throw new Error(`No permissions were derived from ${sourceRoot}`);
  }

  return {
    codes: [...permissionCodes].sort(),
    contributingFiles,
  };
}

function permissionName(code: string) {
  return code
    .split(":")
    .flatMap((part) => part.split("-"))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isReadOnlyPermission(code: string) {
  const action = code.split(":").at(-1);
  return action !== undefined && READ_ONLY_ACTIONS.has(action);
}

async function main() {
  const production = process.env.NODE_ENV === "production";
  if (production && (!process.env.SEED_TENANT_CODE || !process.env.SEED_TENANT_NAME || !process.env.SEED_ADMIN_EMAIL)) {
    throw new Error("SEED_TENANT_CODE, SEED_TENANT_NAME, and SEED_ADMIN_EMAIL are required in production");
  }
  const tenantCode = (process.env.SEED_TENANT_CODE ?? "R4C").trim();
  const tenantName = (process.env.SEED_TENANT_NAME ?? "R4C Bootstrap Tenant").trim();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@r4c.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD is required and must contain at least 12 characters");
  }
  if (!tenantCode || !tenantName || !adminEmail) {
    throw new Error("SEED_TENANT_CODE, SEED_TENANT_NAME, and SEED_ADMIN_EMAIL must not be empty");
  }

  const sourceRoot = path.resolve(process.cwd(), "src");
  const derived = await derivePermissionCodes(sourceRoot);
  const viewerPermissionCodes = derived.codes.filter(isReadOnlyPermission);

  const existingTenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  const existingPermissions = await prisma.permission.findMany({
    where: { code: { in: derived.codes } },
  });
  const existingPermissionByCode = new Map(
    existingPermissions.map((permission) => [permission.code, permission]),
  );
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const passwordMatches = existingUser
    ? await verifyPassword(existingUser.passwordHash, adminPassword)
    : false;
  const passwordHash = passwordMatches
    ? existingUser!.passwordHash
    : await hashPassword(adminPassword);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.upsert({
      where: { code: tenantCode },
      update: { name: tenantName, status: TenantStatus.ACTIVE },
      create: { code: tenantCode, name: tenantName, status: TenantStatus.ACTIVE },
    });

    const permissions = [];
    for (const code of derived.codes) {
      permissions.push(
        await tx.permission.upsert({
          where: { code },
          update: { name: permissionName(code) },
          create: { code, name: permissionName(code) },
        }),
      );
    }

    const roleDefinitions = [
      { code: "ADMIN", name: "Administrator", permissions: derived.codes },
      { code: "VIEWER", name: "Viewer", permissions: viewerPermissionCodes },
      { ...COMMERCIAL_ROLE_DEFINITIONS[0] },
      {
        ...COMMERCIAL_ROLE_DEFINITIONS[1],
        permissions: [
          ...COMMERCIAL_ROLE_DEFINITIONS[0].permissions,
          ...COMMERCIAL_ROLE_DEFINITIONS[1].permissions,
        ],
      },
    ];
    const existingRoles = await tx.role.findMany({
      where: { tenantId: tenant.id, code: { in: roleDefinitions.map(({ code }) => code) } },
    });
    const existingRoleByCode = new Map(existingRoles.map((role) => [role.code, role]));

    const permissionIdByCode = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    );
    const seededRoles = new Map<string, { id: string; code: string; name: string }>();
    let addedRolePermissionLinks = 0;
    let removedRolePermissionLinks = 0;
    for (const definition of roleDefinitions) {
      const role = await tx.role.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: definition.code } },
        update: { name: definition.name },
        create: { tenantId: tenant.id, code: definition.code, name: definition.name },
      });
      seededRoles.set(definition.code, role);
      const permissionIds = definition.permissions.map((code) => {
        const id = permissionIdByCode.get(code);
        if (!id) throw new Error(`Derived permission ${code} was not persisted`);
        return id;
      });
      const existingLinks = await tx.rolePermission.findMany({ where: { roleId: role.id } });
      const existingIds = new Set(existingLinks.map(({ permissionId }) => permissionId));
      const removed = await tx.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { notIn: permissionIds } },
      });
      removedRolePermissionLinks += removed.count;
      for (const permissionId of permissionIds) {
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId } },
          update: {},
          create: { roleId: role.id, permissionId },
        });
        if (!existingIds.has(permissionId)) addedRolePermissionLinks += 1;
      }
    }
    const adminRole = seededRoles.get("ADMIN");
    if (!adminRole) throw new Error("ADMIN role was not persisted");

    const user = await tx.user.upsert({
      where: { email: adminEmail },
      update: {
        displayName: "R4C Administrator",
        passwordHash,
        isActive: true,
      },
      create: {
        email: adminEmail,
        displayName: "R4C Administrator",
        passwordHash,
        isActive: true,
      },
    });

    const existingMembership = await tx.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    });
    await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { roleId: adminRole.id },
      create: { tenantId: tenant.id, userId: user.id, roleId: adminRole.id },
    });

    return {
      tenant,
      user,
      adminRole,
      existingRoleByCode,
      existingMembership,
      roleDefinitions,
      addedRolePermissionLinks,
      removedRolePermissionLinks,
    };
  }, { timeout: 60_000 });

  const permissionUpdates = derived.codes.filter((code) => {
    const existing = existingPermissionByCode.get(code);
    return existing !== undefined && existing.name !== permissionName(code);
  }).length;
  const roleUpdates = [
    { code: "ADMIN", name: "Administrator" },
    { code: "VIEWER", name: "Viewer" },
    ...COMMERCIAL_ROLE_DEFINITIONS.map(({ code, name }) => ({ code, name })),
  ].filter(({ code, name }) => {
    const existing = result.existingRoleByCode.get(code);
    return existing !== undefined && existing.name !== name;
  }).length;

  const summary: SeedChangeSummary = {
    created: {
      tenants: existingTenant ? 0 : 1,
      permissions: derived.codes.length - existingPermissions.length,
      roles: ["ADMIN", "VIEWER", "SALES_AGENT", "SALES_MANAGER"].filter(
        (code) => !result.existingRoleByCode.has(code),
      ).length,
      users: existingUser ? 0 : 1,
      memberships: result.existingMembership ? 0 : 1,
      rolePermissionLinks: result.addedRolePermissionLinks,
    },
    updated: {
      tenants:
        existingTenant &&
        (existingTenant.name !== tenantName || existingTenant.status !== TenantStatus.ACTIVE)
          ? 1
          : 0,
      permissions: permissionUpdates,
      roles: roleUpdates,
      users:
        existingUser &&
        (existingUser.displayName !== "R4C Administrator" ||
          !existingUser.isActive ||
          !passwordMatches)
          ? 1
          : 0,
      memberships:
        result.existingMembership && result.existingMembership.roleId !== result.adminRole.id
          ? 1
          : 0,
    },
    removed: {
      rolePermissionLinks: result.removedRolePermissionLinks,
    },
    totals: {
      permissions: derived.codes.length,
      adminPermissions: derived.codes.length,
      viewerPermissions: viewerPermissionCodes.length,
      tenants: 1,
      roles: 4,
      users: 1,
      memberships: 1,
    },
    permissionSourceFiles: derived.contributingFiles,
  };

  console.log("R4C bootstrap seed completed");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Bootstrap tenant id: ${result.tenant.id}`);
  console.log(`Bootstrap admin email: ${result.user.email}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`R4C bootstrap seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
