import { createPrismaClient } from "../src/prisma/client";
import { spawn } from "node:child_process";
import { hashPassword, verifyPassword } from "../src/auth/auth.service";

const prisma = createPrismaClient();

function requiredPassword(name: string) {
  const password = process.env[name];
  if (!password || password.length < 12) {
    throw new Error(`${name} is required and must contain at least 12 characters`);
  }
  return password;
}

async function runBootstrapSeed() {
  const adminPassword = requiredPassword("SEED_UAT_ADMIN_PASSWORD");
  const isWindows = process.platform === "win32";
  const command = isWindows ? process.env.ComSpec || "cmd.exe" : "pnpm";
  const args = isWindows ? ["/d", "/s", "/c", "pnpm.cmd seed"] : ["seed"];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      SEED_TENANT_CODE:
        process.env.SEED_UAT_TENANT_CODE?.trim() || "ALOMRAN",
      SEED_TENANT_NAME:
        process.env.SEED_UAT_TENANT_NAME?.trim() || "Alomran Development",
      SEED_ADMIN_EMAIL:
        process.env.SEED_UAT_ADMIN_EMAIL?.trim() || "uat.admin@alomran.test",
      SEED_ADMIN_PASSWORD: adminPassword,
    },
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`Bootstrap seed exited with code ${exitCode}`);
}

async function seedProgressSubmitter() {
  const configuredPassword = process.env.SEED_UAT_SUBMIT_PASSWORD;
  if (!configuredPassword) {
    console.log(
      "R4C UAT progress submitter skipped: SEED_UAT_SUBMIT_PASSWORD is not configured",
    );
    return;
  }
  if (configuredPassword.length < 12) {
    throw new Error(
      "SEED_UAT_SUBMIT_PASSWORD must contain at least 12 characters when configured",
    );
  }

  const tenantCode =
    process.env.SEED_UAT_TENANT_CODE?.trim() || "ALOMRAN";
  const email = (
    process.env.SEED_UAT_SUBMIT_EMAIL || "uat.submit@alomran.test"
  )
    .trim()
    .toLowerCase();
  const displayName =
    process.env.SEED_UAT_SUBMIT_DISPLAY_NAME?.trim() ||
    "Alomran UAT Progress Submitter";
  const password = configuredPassword;

  if (!email || !displayName) {
    throw new Error(
      "SEED_UAT_SUBMIT_EMAIL and SEED_UAT_SUBMIT_DISPLAY_NAME must not be empty",
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) throw new Error(`UAT tenant ${tenantCode} was not created`);

  const viewerRole = await prisma.role.findUnique({
    where: { tenantId_code: { tenantId: tenant.id, code: "VIEWER" } },
    include: { permissions: { include: { permission: true } } },
  });
  if (!viewerRole) throw new Error(`VIEWER role is missing for ${tenantCode}`);

  const progressSubmit = await prisma.permission.findUnique({
    where: { code: "progress:submit" },
  });
  if (!progressSubmit) {
    throw new Error(
      "progress:submit was not derived by the bootstrap permission logic",
    );
  }

  const desiredPermissionIds = new Set(
    viewerRole.permissions.map((link) => link.permissionId),
  );
  desiredPermissionIds.add(progressSubmit.id);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = existingUser
    ? await verifyPassword(existingUser.passwordHash, password)
    : false;
  const passwordHash = passwordMatches
    ? existingUser!.passwordHash
    : await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: "PROGRESS_SUBMITTER",
        },
      },
      update: { name: "Progress submitter" },
      create: {
        tenantId: tenant.id,
        code: "PROGRESS_SUBMITTER",
        name: "Progress submitter",
      },
    });

    const existingLinks = await tx.rolePermission.findMany({
      where: { roleId: role.id },
    });
    const removed = await tx.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: [...desiredPermissionIds] },
      },
    });
    for (const permissionId of desiredPermissionIds) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }

    const user = await tx.user.upsert({
      where: { email },
      update: { displayName, passwordHash, isActive: true },
      create: { email, displayName, passwordHash, isActive: true },
    });
    const existingMembership = await tx.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    });
    await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { roleId: role.id },
      create: { tenantId: tenant.id, userId: user.id, roleId: role.id },
    });

    return {
      role,
      user,
      createdLinks: [...desiredPermissionIds].filter(
        (permissionId) =>
          !existingLinks.some((link) => link.permissionId === permissionId),
      ).length,
      removedLinks: removed.count,
      membershipCreated: existingMembership ? 0 : 1,
    };
  });

  const effectivePermissions = await prisma.rolePermission.findMany({
    where: { roleId: result.role.id },
    include: { permission: true },
  });
  const permissionCodes = effectivePermissions.map((link) => link.permission.code);
  if (!permissionCodes.includes("progress:submit")) {
    throw new Error("PROGRESS_SUBMITTER is missing progress:submit");
  }
  if (permissionCodes.includes("progress:review")) {
    throw new Error("PROGRESS_SUBMITTER must not receive progress:review");
  }

  console.log("R4C UAT progress submitter completed");
  console.log(
    JSON.stringify(
      {
        tenantCode,
        email: result.user.email,
        role: result.role.code,
        permissions: permissionCodes.length,
        canSubmit: true,
        canReview: false,
        createdRolePermissionLinks: result.createdLinks,
        removedRolePermissionLinks: result.removedLinks,
        membershipsCreated: result.membershipCreated,
      },
      null,
      2,
    ),
  );
}

async function seedCommercialOperators() {
  const agentPassword = process.env.SEED_UAT_SALES_AGENT_PASSWORD;
  const managerPassword = process.env.SEED_UAT_SALES_MANAGER_PASSWORD;
  if (!agentPassword && !managerPassword) {
    console.log("R4C UAT commercial operators skipped: sales passwords are not configured");
    return;
  }
  if (!agentPassword || !managerPassword) {
    throw new Error("Both SEED_UAT_SALES_AGENT_PASSWORD and SEED_UAT_SALES_MANAGER_PASSWORD are required together");
  }
  if (agentPassword.length < 12 || managerPassword.length < 12) {
    throw new Error("Commercial operator passwords must contain at least 12 characters");
  }

  const tenantCode = process.env.SEED_UAT_TENANT_CODE?.trim() || "ALOMRAN";
  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) throw new Error(`UAT tenant ${tenantCode} was not created`);
  const definitions = [
    {
      roleCode: "SALES_AGENT",
      email: (process.env.SEED_UAT_SALES_AGENT_EMAIL || "uat.sales-agent@alomran.test").trim().toLowerCase(),
      displayName: "Alomran UAT Sales Agent",
      password: agentPassword,
    },
    {
      roleCode: "SALES_MANAGER",
      email: (process.env.SEED_UAT_SALES_MANAGER_EMAIL || "uat.sales-manager@alomran.test").trim().toLowerCase(),
      displayName: "Alomran UAT Sales Manager",
      password: managerPassword,
    },
  ];

  for (const definition of definitions) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { tenantId_code: { tenantId: tenant.id, code: definition.roleCode } },
    });
    const existing = await prisma.user.findUnique({ where: { email: definition.email } });
    const passwordMatches = existing
      ? await verifyPassword(existing.passwordHash, definition.password)
      : false;
    const passwordHash = passwordMatches
      ? existing!.passwordHash
      : await hashPassword(definition.password);
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      update: { displayName: definition.displayName, passwordHash, isActive: true },
      create: { email: definition.email, displayName: definition.displayName, passwordHash, isActive: true },
    });
    await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { roleId: role.id },
      create: { tenantId: tenant.id, userId: user.id, roleId: role.id },
    });
  }
  console.log("R4C UAT commercial operators completed");
}

async function seedUat() {
  await runBootstrapSeed();
  await seedProgressSubmitter();
  await seedCommercialOperators();
}

seedUat()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`R4C UAT seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
