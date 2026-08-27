"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Buildings, CalendarCheck, ChartLineUp, Files, Gauge, GlobeHemisphereEast, HouseLine, ShieldCheck, SignOut, SquaresFour, UserCircle, UserGear, UsersThree } from "@phosphor-icons/react";
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

  return (
    <div className="app-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark kynox-brand-symbol" aria-hidden="true"><Buildings size={29} weight="duotone" /></span>
          <div>
            <strong>KYNOX</strong>
            <span>{t("common.platform")}</span>
          </div>
        </div>
        <nav className="app-nav" aria-label={t("nav.controlHome")}>
          <section className="nav-group" aria-label={t("commercial.navGroup")}>
            <p className="nav-group-label">{t("commercial.navGroup")}</p>
            <Link
              className={projectsActive ? "nav-link nav-link-active" : "nav-link"}
              href={preview ? "/design-preview" : "/projects"}
              aria-current={projectsActive ? "page" : undefined}
            >
              <Buildings className="nav-icon" size={21} weight="duotone" aria-hidden="true" />
              {locale === "ar" ? "المشروعات والتطوير" : "Developments"}
            </Link>
            <Link
              className={commercialActive ? "nav-link nav-link-active" : "nav-link"}
              href={preview ? "/design-preview" : "/commercial"}
              aria-current={commercialActive ? "page" : undefined}
            >
              <ChartLineUp className="nav-icon" size={21} weight="duotone" aria-hidden="true" />
              {t("commercial.nav")}
            </Link>
            {user?.role === "ADMIN" ? (
              <Link className={pathname.startsWith("/admin/users") ? "nav-link nav-link-active" : "nav-link"} href="/admin/users">
                <UserGear className="nav-icon" size={21} weight="duotone" aria-hidden="true" />
                {locale === "ar" ? "المستخدمون والصلاحيات" : "Users & access"}
              </Link>
            ) : null}
          </section>
          <section className="kynox-sidebar-tools" aria-label={locale === "ar" ? "أدوات العمل التجاري" : "Commercial tools"}>
            {([
              ["portfolio", Gauge, locale === "ar" ? "المحفظة" : "Portfolio", "/projects"],
              ["pipeline", UsersThree, locale === "ar" ? "العملاء" : "Customers", "/commercial?view=customers#commercial-customers"],
              ["units", HouseLine, locale === "ar" ? "الوحدات" : "Units", "/commercial?view=units#commercial-units"],
              ["transfer", Files, locale === "ar" ? "الحجز والإفراغ" : "Booking & transfer", "/commercial?view=transfer#commercial-transfer"],
              ["operations", CalendarCheck, locale === "ar" ? "العمليات" : "Operations", "/commercial?view=operations#commercial-operations"],
            ] as const).map(([id, Icon, label, href]) => (
              preview ? (
                <button key={id} type="button" onClick={() => window.dispatchEvent(new CustomEvent("r4c:commercial-tab", { detail: id }))}>
                  <Icon size={22} weight="duotone" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ) : (
                <Link key={id} className="kynox-tool-link" href={href}>
                  <Icon size={22} weight="duotone" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              )
            ))}
          </section>
        </nav>
      </aside>

      <div className="app-stage">
        <header className="app-header">
          <div className="workspace-context">
            <span className="workspace-context-icon"><SquaresFour size={21} weight="duotone" /></span>
            <div><span className="header-kicker">KYNOX · {t("header.workspace")}</span><strong>{locale === "ar" ? "مركز العمليات التجارية" : "Commercial operations center"}</strong></div>
          </div>
          <div className="modern-session-card">
            <UserCircle size={34} weight="duotone" aria-hidden="true" />
            <div>
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
            {user ? <span className="role-chip"><ShieldCheck size={14} weight="fill" />{locale === "ar" && user.role === "ADMIN" ? "مدير النظام" : user.role}</span> : null}
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
              <GlobeHemisphereEast size={18} aria-hidden="true" />
              {locale === "ar" ? t("language.english") : t("language.arabic")}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={logout}
              disabled={working || preview}
            >
              <SignOut size={18} aria-hidden="true" />
              {preview ? (locale === "ar" ? "وضع المعاينة" : "Preview mode") : t("header.logout")}
            </button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
