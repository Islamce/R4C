"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clientApi, ClientApiError } from "../lib/client-api";
import type { BrowserSessionUser } from "../lib/types";
import { useI18n } from "./I18nProvider";

export function AppShell({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<BrowserSessionUser | null>(preview ? {
    id: "design-preview",
    email: "islam@kynox.io",
    displayName: "Islam Makramalla",
    role: "ADMIN",
    permissions: ["commercial:manage", "commercial:read"],
    tenant: { code: "KYNOX", name: "Kynox Real Estate" },
  } : null);
  const [sessionError, setSessionError] = useState(false);
  const [working, setWorking] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (preview) return;
    let active = true;
    clientApi<{ user: BrowserSessionUser }>("/api/session")
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
  }, [preview, router]);

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
    if (preview) return;
    setWorking(true);
    try {
      await clientApi("/api/session/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const projectsActive = pathname.startsWith("/projects");
  const commercialActive = pathname.startsWith("/commercial");
  const salesActive = pathname.startsWith("/sales");

  return (
    <div className="app-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <aside className={mobileNavOpen ? "app-sidebar is-nav-open" : "app-sidebar"}>
        <div className="mobile-shell-row">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">{t("common.brand")}</span>
            <div>
              <strong>{t("common.brand")}</strong>
              <span>{t("common.platform")}</span>
            </div>
          </div>
          <button className="mobile-nav-toggle" type="button" aria-expanded={mobileNavOpen} aria-controls="app-navigation" aria-label={t("nav.controlHome")} onClick={() => setMobileNavOpen((open) => !open)}>
            <span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span>
            <span>{locale === "ar" ? "القائمة" : "Menu"}</span>
          </button>
        </div>
        <nav id="app-navigation" className="app-nav" aria-label={t("nav.controlHome")}>
          <section className="nav-group" aria-label={t("commercial.navGroup")}>
            <p className="nav-group-label">{t("commercial.navGroup")}</p>
            <Link
              className={projectsActive ? "nav-link nav-link-active" : "nav-link"}
              href={preview ? "/design-preview" : "/projects"}
              aria-current={projectsActive ? "page" : undefined}
            >
              <span className="nav-index" aria-hidden="true">01</span>
              {locale === "ar" ? "المشروعات والتطوير" : "Developments"}
            </Link>
            <Link
              className={commercialActive ? "nav-link nav-link-active" : "nav-link"}
              href={preview ? "/design-preview" : "/commercial"}
              aria-current={commercialActive ? "page" : undefined}
            >
              <span className="nav-index" aria-hidden="true">02</span>
              {t("commercial.nav")}
            </Link>
            <Link
              className={salesActive ? "nav-link nav-link-active" : "nav-link"}
              href={preview ? "/design-preview" : "/sales"}
              aria-current={salesActive ? "page" : undefined}
            >
              <span className="nav-index" aria-hidden="true">03</span>
              {locale === "ar" ? "مركز مبيعات" : "Sales command center"}
            </Link>
          </section>
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
                <strong>{user.tenant.name || user.tenant.code}</strong>
                {user.tenant.code ? <small>{user.tenant.code}</small> : null}
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
              disabled={working || preview}
            >
              {preview ? "Preview mode" : t("header.logout")}
            </button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
