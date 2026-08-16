"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { clientApi } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError(true);
      setBusy(false);
      return;
    }
    try {
      await clientApi("/api/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">{t("passwordReset.eyebrow")}</p>
          <h1>{t("passwordReset.resetTitle")}</h1>
          <p className="lead-copy">{t("passwordReset.resetHelp")}</p>
        </div>
        {done ? (
          <div className="auth-form" role="status">
            <div className="inline-alert"><strong>{t("passwordReset.complete")}</strong></div>
            <Link className="button button-primary" href="/login">{t("passwordReset.signIn")}</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label><span>{t("passwordReset.newPassword")}</span><input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
            <label><span>{t("passwordReset.confirmPassword")}</span><input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
            {error ? <div className="inline-alert" role="alert"><strong>{t("passwordReset.invalid")}</strong></div> : null}
            <button className="button button-primary" type="submit" disabled={busy || !token}>
              {busy ? t("passwordReset.resetting") : t("passwordReset.reset")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
