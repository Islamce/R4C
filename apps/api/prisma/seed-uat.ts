import { spawn } from "node:child_process";

async function seedUat() {
  const password = process.env.SEED_UAT_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "SEED_UAT_ADMIN_PASSWORD is required and must contain at least 12 characters",
    );
  }

  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const child = spawn(command, ["seed"], {
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
      SEED_ADMIN_PASSWORD: password,
    },
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`Bootstrap seed exited with code ${exitCode}`);
}

seedUat().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`R4C UAT seed failed: ${message}`);
  process.exitCode = 1;
});
