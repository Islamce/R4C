import { TenantStatus } from "@prisma/client";
import { createPrismaClient } from "../src/prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, verifyPassword } from "../src/auth/auth.service";

const prisma = createPrismaClient();
const READ_ONLY_ACTIONS = new Set(["read", "list", "get"]);
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

    const existingRoles = await tx.role.findMany({
      where: { tenantId: tenant.id, code: { in: ["ADMIN", "VIEWER"] } },
    });
    const existingRoleByCode = new Map(existingRoles.map((role) => [role.code, role]));

    const adminRole = await tx.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "ADMIN" } },
      update: { name: "Administrator" },
      create: { tenantId: tenant.id, code: "ADMIN", name: "Administrator" },
    });
    const viewerRole = await tx.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "VIEWER" } },
      update: { name: "Viewer" },
      create: { tenantId: tenant.id, code: "VIEWER", name: "Viewer" },
    });

    const permissionIdByCode = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    );
    const adminPermissionIds = permissions.map((permission) => permission.id);
    const viewerPermissionIds = viewerPermissionCodes.map((code) => {
      const id = permissionIdByCode.get(code);
      if (!id) throw new Error(`Derived permission ${code} was not persisted`);
      return id;
    });

    const existingAdminLinks = await tx.rolePermission.findMany({
      where: { roleId: adminRole.id },
    });
    const existingViewerLinks = await tx.rolePermission.findMany({
      where: { roleId: viewerRole.id },
    });

    const removedAdminLinks = await tx.rolePermission.deleteMany({
      where: {
        roleId: adminRole.id,
        permissionId: { notIn: adminPermissionIds },
      },
    });
    const removedViewerLinks = await tx.rolePermission.deleteMany({
      where: {
        roleId: viewerRole.id,
        permissionId: { notIn: viewerPermissionIds },
      },
    });

    for (const permissionId of adminPermissionIds) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId } },
        update: {},
        create: { roleId: adminRole.id, permissionId },
      });
    }
    for (const permissionId of viewerPermissionIds) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: viewerRole.id, permissionId } },
        update: {},
        create: { roleId: viewerRole.id, permissionId },
      });
    }

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

    const existingAdminLinkIds = new Set(
      existingAdminLinks.map((link) => link.permissionId),
    );
    const existingViewerLinkIds = new Set(
      existingViewerLinks.map((link) => link.permissionId),
    );

    return {
      tenant,
      user,
      adminRole,
      viewerRole,
      existingRoleByCode,
      existingMembership,
      addedAdminLinks: adminPermissionIds.filter((id) => !existingAdminLinkIds.has(id)).length,
      addedViewerLinks: viewerPermissionIds.filter((id) => !existingViewerLinkIds.has(id)).length,
      removedAdminLinks: removedAdminLinks.count,
      removedViewerLinks: removedViewerLinks.count,
    };
  });

  const permissionUpdates = derived.codes.filter((code) => {
    const existing = existingPermissionByCode.get(code);
    return existing !== undefined && existing.name !== permissionName(code);
  }).length;
  const roleUpdates = [
    { code: "ADMIN", name: "Administrator" },
    { code: "VIEWER", name: "Viewer" },
  ].filter(({ code, name }) => {
    const existing = result.existingRoleByCode.get(code);
    return existing !== undefined && existing.name !== name;
  }).length;

  const summary: SeedChangeSummary = {
    created: {
      tenants: existingTenant ? 0 : 1,
      permissions: derived.codes.length - existingPermissions.length,
      roles: ["ADMIN", "VIEWER"].filter(
        (code) => !result.existingRoleByCode.has(code),
      ).length,
      users: existingUser ? 0 : 1,
      memberships: result.existingMembership ? 0 : 1,
      rolePermissionLinks: result.addedAdminLinks + result.addedViewerLinks,
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
      rolePermissionLinks: result.removedAdminLinks + result.removedViewerLinks,
    },
    totals: {
      permissions: derived.codes.length,
      adminPermissions: derived.codes.length,
      viewerPermissions: viewerPermissionCodes.length,
      tenants: 1,
      roles: 2,
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
