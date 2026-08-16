import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const login = await readFile(new URL("../components/LoginForm.tsx", import.meta.url), "utf8");
const request = await readFile(new URL("../components/ForgotPasswordForm.tsx", import.meta.url), "utf8");
const reset = await readFile(new URL("../components/ResetPasswordForm.tsx", import.meta.url), "utf8");
const i18n = await readFile(new URL("../lib/i18n.ts", import.meta.url), "utf8");

test("login exposes the reset journey and forms use the bounded server proxy", () => {
  assert.match(login, /href="\/forgot-password"/);
  assert.match(request, /\/api\/password-reset\/request/);
  assert.match(reset, /\/api\/password-reset\/confirm/);
  assert.match(reset, /autoComplete="new-password"/);
});

test("password reset is localized in English and Arabic", () => {
  assert.equal((i18n.match(/"passwordReset\.forgot"/g) ?? []).length, 2);
  assert.match(i18n, /هل نسيت كلمة المرور/);
});
