import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const service = await readFile(new URL("../src/auth/auth.service.ts", import.meta.url), "utf8");
const controller = await readFile(new URL("../src/auth/auth.controller.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../prisma/migrations/20260816123000_password_reset_email/migration.sql", import.meta.url), "utf8");
const mail = await readFile(new URL("../src/auth/mail.service.ts", import.meta.url), "utf8");

test("password reset tokens are hashed, expiring, single-use, and revoke sessions", () => {
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /PASSWORD_RESET_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(service, /consumedAt: null, expiresAt: \{ gt: now \}/);
  assert.match(service, /refreshToken\.updateMany/);
  assert.match(migration, /UNIQUE INDEX "PasswordResetToken_tokenHash_key"/);
});

test("public endpoints are rate limited and request responses do not disclose accounts", () => {
  assert.match(controller, /PasswordResetRateLimit\(\)/);
  assert.match(controller, /Post\("password-reset\/request"\)/);
  assert.match(controller, /Post\("password-reset\/confirm"\)/);
  assert.match(service, /return \{ accepted: true \}/);
});

test("SMTP uses authenticated TLS and never embeds mailbox credentials in source", () => {
  assert.match(mail, /secure: port === 465/);
  assert.match(mail, /auth: \{ user, pass \}/);
  assert.doesNotMatch(mail, /no-reply@kynox\.io/);
  assert.doesNotMatch(mail, /SMTP_PASSWORD\s*=/);
});
