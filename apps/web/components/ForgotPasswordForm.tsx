"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { clientApi } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") ?? "") }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">{t("passwordReset.eyebrow")}</p>
          <h1>{t("passwordReset.requestTitle")}</h1>
          <p className="lead-copy">{t("passwordReset.requestHelp")}</p>
        </div>
        {sent ? (
          <div className="auth-form" role="status">
            <div className="inline-alert"><strong>{t("passwordReset.sent")}</strong></div>
            <Link className="text-link" href="/login">{t("passwordReset.back")}</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label><span>{t("login.email")}</span><input name="email" type="email" autoComplete="email" required /></label>
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? t("passwordReset.sending") : t("passwordReset.send")}
            </button>
            <Link className="text-link" href="/login">{t("passwordReset.back")}</Link>
          </form>
        )}
      </section>
    </main>
  );
}
