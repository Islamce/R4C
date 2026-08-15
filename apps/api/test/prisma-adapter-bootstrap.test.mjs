import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL = "postgresql://invalid:invalid@127.0.0.1:1/db";

const { PrismaService } = await import("../dist/prisma/prisma.service.js");

test("Prisma uses the PostgreSQL adapter path without a Rust-engine panic", async () => {
  const prisma = new PrismaService();
  try {
    await assert.rejects(
      prisma.$queryRaw`SELECT 1`,
      (error) => {
        assert.notEqual(error?.name, "PrismaClientRustPanicError");
        assert.match(String(error?.message), /Can't reach database server/);
        return true;
      },
    );
  } finally {
    await prisma.$disconnect();
  }
});
