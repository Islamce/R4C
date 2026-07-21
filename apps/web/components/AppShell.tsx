"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clientApi, ClientApiError } from "../lib/client-api";
import type { SessionUser } from "../lib/types";
import { useI18n } from "./I18nProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    clientApi<{ user: SessionUser }>("/api/session")
      .then((response) => {
        if (active) setUser(response.user);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ClientApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setSessionError(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function toggleLanguage() {
    setWorking(true);
    try {
      await clientApi("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }),
      });
      window.location.reload();
    } finally {
      setWorking(false);
    }
  }

  async function logout() {
    setWorking(true);
    try {
      await clientApi("/api/session/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const projectsActive = pathname.startsWith("/projects");
  const costControlActive = pathname.startsWith("/cost-control");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">{t("common.brand")}</span>
          <div>
            <strong>{t("common.brand")}</strong>
            <span>{t("common.platform")}</span>
          </div>
        </div>
        <nav className="app-nav" aria-label={t("nav.controlHome")}>
          <Link
            className={projectsActive ? "nav-link nav-link-active" : "nav-link"}
            href="/projects"
            aria-current={projectsActive ? "page" : undefined}
          >
            <span className="nav-index" aria-hidden="true">01</span>
            {t("nav.projects")}
          </Link>
          <Link
            className={costControlActive ? "nav-link nav-link-active" : "nav-link"}
            href="/cost-control"
            aria-current={costControlActive ? "page" : undefined}
          >
            <span className="nav-index" aria-hidden="true">02</span>
            {t("nav.costControl")}
          </Link>
        </nav>
        <div className="sidebar-grid-key" aria-hidden="true">
          <span>{t("common.brand")}</span>
          <span>{t("header.workspace")}</span>
        </div>
      </aside>

      <div className="app-stage">
        <header className="app-header">
          <div>
            <span className="header-kicker">{t("header.workspace")}</span>
            {sessionError ? (
              <strong>{t("shell.sessionError")}</strong>
            ) : user ? (
              <div className="session-identity">
                <strong>{user.displayName || user.email}</strong>
                <span>{user.email}</span>
              </div>
            ) : (
              <strong>{t("shell.sessionLoading")}</strong>
            )}
          </div>
          <div className="header-actions">
            {user ? (
              <div className="tenant-chip">
                <span>{t("header.tenant")}</span>
                <strong>{user.tenantId}</strong>
              </div>
            ) : null}
            <button
              className="button button-quiet"
              type="button"
              onClick={toggleLanguage}
              disabled={working}
              aria-label={t("header.language")}
            >
              {locale === "ar" ? t("language.english") : t("language.arabic")}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={logout}
              disabled={working}
            >
              {t("header.logout")}
            </button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
