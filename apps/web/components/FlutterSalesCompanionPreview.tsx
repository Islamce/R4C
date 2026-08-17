"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";

const screens = ["home", "inventory", "unit", "interest", "timeline", "drafts", "builder", "review", "decision", "handoff", "offline", "session"] as const;
type Screen = (typeof screens)[number];

const copy = {
  en: {
    title: "Flutter internal-sales companion", note: "FLUTTER DESIGN PREVIEW — APPLICATION NOT YET IMPLEMENTED", login: "Sales sign-in", home: "Active projects", inventory: "Inventory search", unit: "Unit detail", interest: "Lead & interest", timeline: "Customer timeline", drafts: "Quotation drafts", builder: "Quotation builder", review: "Internal review", decision: "Customer decision", handoff: "Reservation handoff", offline: "Offline queue", session: "Expired session", project: "Al Rawdah Residences", projectCode: "AL-RAWD-01", unitCode: "B2-804", customer: "Noura Al Harbi", available: "Available", price: "SAR 1,250,000", status: "APPROVED TO SEND", safeguard: "Acceptance is recorded only. Reservation stays separately authorized.", retry: "Retry safely", capture: "Capture interest", reviewText: "Manager review required before customer preview.", accepted: "Customer accepted — follow up required", noConnection: "No connection. Draft saved locally; no pricing is recalculated offline.", signIn: "Your session expired. Sign in to restore governed access." },
  ar: {
    title: "رفيق المبيعات الداخلي لفلاتر", note: "معاينة تصميم فلاتر — التطبيق لم يُنفذ بعد", login: "تسجيل دخول المبيعات", home: "المشروعات النشطة", inventory: "بحث المخزون", unit: "تفاصيل الوحدة", interest: "العميل والاهتمام", timeline: "سجل العميل", drafts: "مسودات عروض السعر", builder: "منشئ عرض السعر", review: "المراجعة الداخلية", decision: "قرار المشتري", handoff: "إحالة الحجز", offline: "قائمة العمل دون اتصال", session: "انتهت الجلسة", project: "مساكن الروضة", projectCode: "AL-RAWD-01", unitCode: "B2-804", customer: "نورة الحربي", available: "متاحة", price: "١٬٢٥٠٬٠٠٠ ر.س.", status: "معتمد للإرسال", safeguard: "يُسجل القبول فقط. يبقى الحجز بتفويض منفصل.", retry: "إعادة المحاولة بأمان", capture: "تسجيل الاهتمام", reviewText: "تتطلب معاينة المشتري مراجعة المدير أولاً.", accepted: "قبل المشتري — متابعة مطلوبة", noConnection: "لا يوجد اتصال. تم حفظ المسودة محليًا ولا يعاد احتساب الأسعار دون اتصال.", signIn: "انتهت جلستك. سجل الدخول لاستعادة الوصول المحكوم." },
} as const;

export function FlutterSalesCompanionPreview() {
  const { locale } = useI18n();
  const language = locale === "ar" ? "ar" : "en";
  const t = copy[language];
  const [screen, setScreen] = useState<Screen>("home");
  const heading = ({ home: t.home, inventory: t.inventory, unit: t.unit, interest: t.interest, timeline: t.timeline, drafts: t.drafts, builder: t.builder, review: t.review, decision: t.decision, handoff: t.handoff, offline: t.offline, session: t.session } as Record<Screen, string>)[screen];
  return <main className="flutter-preview" dir={language === "ar" ? "rtl" : "ltr"}>
    <header><div><p>R4C MOBILE SYSTEM DESIGN</p><h1>{t.title}</h1><span>{t.note}</span></div><aside><strong>{t.login}</strong><small>JWT + tenant-scoped API · no FCM · no buyer app</small></aside></header>
    <section className="flutter-preview-grid">
      <nav className="flutter-screen-nav" aria-label={t.title}>{screens.map((item) => <button key={item} className={screen === item ? "is-active" : ""} type="button" onClick={() => setScreen(item)}>{({ home: t.home, inventory: t.inventory, unit: t.unit, interest: t.interest, timeline: t.timeline, drafts: t.drafts, builder: t.builder, review: t.review, decision: t.decision, handoff: t.handoff, offline: t.offline, session: t.session } as Record<Screen, string>)[item]}</button>)}</nav>
      <div className="flutter-phone-shell"><div className="flutter-notch" /><div className="flutter-mobile-app"><div className="flutter-mobile-top"><span>09:41</span><strong>R4C</strong><span>◉ ◔</span></div><div className="flutter-mobile-crumb">{t.projectCode} · Internal sales</div><h2>{heading}</h2><FlutterScreen screen={screen} t={t} /><nav className="flutter-tabbar"><button type="button" onClick={() => setScreen("home")}>⌂<span>{t.home}</span></button><button type="button" onClick={() => setScreen("inventory")}>⌕<span>{t.inventory}</span></button><button type="button" onClick={() => setScreen("drafts")}>▤<span>{t.drafts}</span></button><button type="button" onClick={() => setScreen("timeline")}>◷<span>{t.timeline}</span></button></nav></div></div>
      <aside className="flutter-spec-card"><h2>{heading}</h2><p>{t.note}</p><dl><div><dt>Identity</dt><dd>Internal sales JWT; tenant and permission filtered.</dd></div><div><dt>Data</dt><dd>Versioned mobile DTOs; no client-side pricing authority.</dd></div><div><dt>Lifecycle</dt><dd>DRAFT → INTERNAL REVIEW → APPROVED TO SEND → buyer decision.</dd></div><div><dt>Safety</dt><dd>{t.safeguard}</dd></div></dl></aside>
    </section>
  </main>;
}

function FlutterScreen({ screen, t }: { screen: Screen; t: Record<string, string> }) {
  if (screen === "offline") return <section className="flutter-state-card warning"><strong>{t.offline}</strong><p>{t.noConnection}</p><button>{t.retry}</button></section>;
  if (screen === "session") return <section className="flutter-state-card"><strong>{t.signIn}</strong><button>{t.login}</button></section>;
  if (screen === "home") return <><div className="flutter-stat-row"><div><span>Active projects</span><strong>03</strong></div><div><span>Follow ups</span><strong>08</strong></div></div><section className="flutter-list-card"><span className="flutter-pill">LIVE · GOVERNED</span><h3>{t.project}</h3><p>{t.projectCode} · 42 available units</p><button>{t.inventory}</button></section><section className="flutter-list-card accent"><h3>{t.decision}</h3><p>{t.accepted}</p><button>{t.handoff}</button></section></>;
  if (screen === "inventory" || screen === "unit") return <><label className="flutter-search">⌕ <input placeholder={t.inventory} /></label><section className="flutter-unit-card"><span className="flutter-pill">{t.available}</span><h3>{t.unitCode}</h3><p>3 BR · 176.4 m² · Level 08</p><strong>{t.price}</strong><button>{screen === "inventory" ? t.unit : t.capture}</button></section></>;
  if (screen === "interest") return <section className="flutter-form-card"><h3>{t.customer}</h3><label>Source<input value="Site visit" readOnly /></label><label>Preferred unit<input value={t.unitCode} readOnly /></label><button>{t.capture}</button></section>;
  if (screen === "timeline") return <section className="flutter-timeline"><h3>{t.customer}</h3><p><strong>Today</strong> · Site visit recorded</p><p><strong>Yesterday</strong> · Payment plan discussed</p><p><strong>17 Aug</strong> · Quotation draft created</p></section>;
  if (screen === "drafts" || screen === "builder") return <section className="flutter-form-card"><span className="flutter-pill">DRAFT</span><h3>SQ-20260817-DEMO01</h3><p>{t.unitCode} · {t.price}</p><label>Payment plan<input value="10 / 40 / 50" readOnly /></label><label>Validity<input value="30 Sep 2026" readOnly /></label><button>{screen === "drafts" ? t.builder : t.review}</button></section>;
  if (screen === "review") return <section className="flutter-state-card"><span className="flutter-pill">{t.status}</span><strong>{t.reviewText}</strong><p>{t.safeguard}</p><button>{t.decision}</button></section>;
  if (screen === "decision") return <section className="flutter-state-card success"><span className="flutter-pill">CUSTOMER ACCEPTED</span><strong>{t.accepted}</strong><p>{t.safeguard}</p><button>{t.handoff}</button></section>;
  return <section className="flutter-state-card"><strong>{t.safeguard}</strong><button>{t.handoff}</button></section>;
}
