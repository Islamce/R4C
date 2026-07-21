async function seedUat() {
  const password = process.env.SEED_UAT_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "SEED_UAT_ADMIN_PASSWORD is required and must contain at least 12 characters",
    );
  }

  process.env.SEED_TENANT_CODE =
    process.env.SEED_UAT_TENANT_CODE?.trim() || "ALOMRAN";
  process.env.SEED_TENANT_NAME =
    process.env.SEED_UAT_TENANT_NAME?.trim() || "Alomran Development";
  process.env.SEED_ADMIN_EMAIL =
    process.env.SEED_UAT_ADMIN_EMAIL?.trim() || "uat.admin@alomran.test";
  process.env.SEED_ADMIN_DISPLAY_NAME =
    process.env.SEED_UAT_ADMIN_DISPLAY_NAME?.trim() ||
    "Alomran UAT Administrator";
  process.env.SEED_ADMIN_PASSWORD = password;

  const { executeSeed } = await import("./seed");
  await executeSeed();
}

seedUat().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`R4C UAT seed failed: ${message}`);
  process.exitCode = 1;
});
