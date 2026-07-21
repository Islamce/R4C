"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clientApi } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);
    const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          tenantId: String(form.get("tenantId") ?? ""),
        }),
      });
      router.replace("/projects");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-rail" aria-hidden="true">
          <span>01</span>
          <span>AUTH</span>
          <span>CONTROLLED</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">{t("login.eyebrow")}</p>
          <h1>{t("login.title")}</h1>
          <p className="lead-copy">{t("login.subtitle")}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>{t("login.email")}</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>{t("login.password")}</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={12}
              required
            />
          </label>
          <label>
            <span>{t("login.tenantId")}</span>
            <input
              name="tenantId"
              type="text"
              inputMode="text"
              pattern="[0-9a-fA-F-]{36}"
              required
            />
            <small>{t("login.tenantHint")}</small>
          </label>
          {failed ? (
            <div className="inline-alert" role="alert">
              <strong>{t("login.failed")}</strong>
              <span>{t("login.failedHelp")}</span>
            </div>
          ) : null}
          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
          <Link className="text-link" href="/">
            {t("login.back")}
          </Link>
        </form>
      </section>
    </main>
  );
}
