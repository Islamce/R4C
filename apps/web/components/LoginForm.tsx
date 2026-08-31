"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ClientApiError, clientApi } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

type LoginTenant = { code: string; name: string };
type LoginFailure = "tenant" | "credentials" | null;

export function LoginForm({
  tenant,
  tenantOverride,
}: {
  tenant: LoginTenant | null;
  tenantOverride?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<LoginFailure>(tenant ? null : "tenant");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenant) return;
    setSubmitting(true);
    setFailure(null);
    const form = new FormData(event.currentTarget);
    const query = tenantOverride
      ? `?tenant=${encodeURIComponent(tenantOverride)}`
      : "";
    try {
      await clientApi(`/api/session/login${query}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.replace("/commercial");
      router.refresh();
    } catch (error) {
      setFailure(
        error instanceof ClientApiError && error.status === 404
          ? "tenant"
          : "credentials",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-rail" aria-hidden="true">
          <span>01</span>
          <span>{t("common.brand")}</span>
          <span>{t("login.eyebrow")}</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">{t("login.eyebrow")}</p>
          <h1>{t("login.title")}</h1>
          <p className="lead-copy">{t("tenant.login.subtitle")}</p>
          {tenant ? (
            <div className="login-tenant-context" role="status">
              <span>{t("tenant.login.organization")}</span>
              <strong>{tenant.name}</strong>
              <code>{tenant.code}</code>
            </div>
          ) : null}
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
          {failure ? (
            <div className="inline-alert" role="alert">
              <strong>
                {t(failure === "tenant" ? "tenant.login.failed" : "login.failed")}
              </strong>
              <span>
                {t(
                  failure === "tenant"
                    ? "tenant.login.failedHelp"
                    : "tenant.login.credentialsHelp",
                )}
              </span>
            </div>
          ) : null}
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting || !tenant}
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
          <Link className="text-link" href="/forgot-password">
            {t("passwordReset.forgot")}
          </Link>
          <Link className="text-link" href={`/explore${tenant?.code ? `?tenant=${encodeURIComponent(tenant.code)}` : ""}`}>
            تصفح المشاريع المتاحة للعملاء
          </Link>
        </form>
      </section>
    </main>
  );
}
