"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Buildings, CalendarCheck, ChartLineUp, Files, Gauge, GlobeHemisphereEast, HouseLine, ShieldCheck, SignOut, SquaresFour, UserCircle, UserGear, UsersThree } from "@phosphor-icons/react";
import { clientApi, ClientApiError } from "../lib/client-api";
import type { BrowserSessionUser } from "../lib/types";
import { useI18n } from "./I18nProvider";

export function AppShell({ children, preview = false, initialUser = null }: { children: ReactNode; preview?: boolean; initialUser?: BrowserSessionUser | null }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<BrowserSessionUser | null>(preview ? {
    id: "design-preview",
    email: "islam@kynox.io",
    displayName: "Islam Makramalla",
    role: "ADMIN",
    permissions: ["commercial:manage", "commercial:read"],
    tenant: { code: "KYNOX", name: "Kynox Real Estate" },
  } : initialUser);
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

  const commercialView = searchParams.get("view");
  if (!preview && !user && !sessionError) {
    return (
      <main className="session-gate" dir={locale === "ar" ? "rtl" : "ltr"} aria-busy="true" aria-live="polite">
        <Buildings size={36} weight="duotone" aria-hidden="true" />
        <strong>{t("shell.sessionLoading")}</strong>
      </main>
    );
  }

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
        <nav className="app-nav kynox-unified-nav" aria-label={t("nav.controlHome")}>
          <section className="nav-group" aria-label={t("commercial.navGroup")}>
            <p className="nav-group-label">{t("commercial.navGroup")}</p>
            {([
              ["portfolio", Buildings, locale === "ar" ? "المشروعات" : "Projects", "/commercial?view=portfolio"],
              ["pipeline", UsersThree, locale === "ar" ? "العملاء والفرص" : "Customers & opportunities", "/commercial?view=customers"],
              ["units", HouseLine, locale === "ar" ? "الوحدات" : "Units", "/commercial?view=units"],
              ["transfer", Files, locale === "ar" ? "الحجوزات والإفراغ" : "Reservations & transfer", "/commercial?view=transfer"],
              ["operations", CalendarCheck, locale === "ar" ? "المهام والعمليات" : "Tasks & operations", "/commercial?view=operations"],
            ] as const).map(([id, Icon, label, href]) => {
              const active = pathname.startsWith("/commercial") && (id === "pipeline" ? !commercialView || commercialView === "customers" || commercialView === "pipeline" : commercialView === id);
              return preview ? <button key={id} className={active ? "nav-link nav-link-active" : "nav-link"} type="button" onClick={() => window.dispatchEvent(new CustomEvent("r4c:commercial-tab", { detail: id }))}><Icon className="nav-icon" size={21} weight="duotone" /><span>{label}</span></button> : <Link key={id} className={active ? "nav-link nav-link-active" : "nav-link"} href={href} aria-current={active ? "page" : undefined}><Icon className="nav-icon" size={21} weight="duotone" /><span>{label}</span></Link>;
            })}
            <Link className={pathname.startsWith("/progress") ? "nav-link nav-link-active" : "nav-link"} href="/progress"><Gauge className="nav-icon" size={21} weight="duotone" />{locale === "ar" ? "تقارير التقدم" : "Progress reports"}</Link>
            <Link className={pathname.startsWith("/cost-control") ? "nav-link nav-link-active" : "nav-link"} href="/cost-control"><ChartLineUp className="nav-icon" size={21} weight="duotone" />{locale === "ar" ? "تقارير التكاليف" : "Cost reports"}</Link>
            {user?.role === "ADMIN" && !preview ? <><Link className={pathname.startsWith("/admin/projects") ? "nav-link nav-link-active" : "nav-link"} href="/admin/projects"><Buildings className="nav-icon" size={21} weight="duotone" />{locale === "ar" ? "إدارة المشروعات" : "Project administration"}</Link><Link className={pathname.startsWith("/admin/users") ? "nav-link nav-link-active" : "nav-link"} href="/admin/users"><UserGear className="nav-icon" size={21} weight="duotone" />{locale === "ar" ? "المستخدمون والصلاحيات" : "Users & access"}</Link></> : null}
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
