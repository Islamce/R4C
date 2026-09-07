"use client";

import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  CalendarCheck,
  ChartLineUp,
  FolderOpen,
  SignIn,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./I18nProvider";

type DemoKey = "pipeline" | "inventory" | "reservation";

const copy = {
  ar: {
    nav: { solution: "الحل", journey: "رحلة العمل", demo: "العرض" },
    signIn: "تسجيل الدخول",
    heroEyebrow: "منصة إدارة التطوير والعمليات التجارية",
    heroTitle: "منصة واحدة تربط المشروع بالمبيعات",
    heroBody: "من التخطيط والمخزون إلى العملاء والحجوزات والاعتمادات — مساحة عمل واضحة تربط القرار بالتنفيذ.",
    explore: "استكشف رحلة العمل",
    proofEyebrow: "شاشات من المنتج الفعلي",
    proofTitle: "رؤية واحدة للعمل من الفرصة حتى القرار",
    proofBody: "تنقّل بين لقطات توضيحية حقيقية من R4C واكتشف كيف تتصل العمليات في مساحة عمل واحدة.",
    tabs: { pipeline: "مسار المبيعات", inventory: "المخزون والوحدات", reservation: "الحجز والاعتماد" },
    demoAlt: { pipeline: "لوحة مسار المبيعات في R4C", inventory: "واجهة إدارة المشروع والوحدات في R4C", reservation: "واجهة مراجعة الحجز في R4C" },
    annotations: {
      pipeline: ["لوحة موحدة لمسار المبيعات", "إدارة العملاء والاهتمامات", "وضوح المرحلة والمسؤولية"],
      inventory: ["مخزون متصل بالمشروع", "تفاصيل الوحدات والمخططات", "حالة تجارية محدثة"],
      reservation: ["مراجعة الوحدة والسعر", "تثبيت الحجز بضوابط واضحة", "سجل موثوق للقرار"],
    },
    journeyEyebrow: "رحلة عمل مترابطة",
    journeyTitle: "من الفرصة حتى المتابعة والقرار",
    journey: [
      ["التقاط الفرصة", "تسجيل الاهتمام من أي قناة وربطه بفرصة واضحة."],
      ["اختيار المشروع والوحدة", "عرض الخيارات والمخططات والأسعار من مصدر واحد."],
      ["مراجعة السعر والحجز", "تأكيد تفاصيل الوحدة والسعر وإنشاء حجز مضبوط."],
      ["المتابعة والقرار", "متابعة الحالة والأنشطة والموافقات حتى الإغلاق."],
    ],
    forTitle: "مصمم لكل من",
    audiences: [
      ["المطور العقاري", "رؤية مترابطة بين المشروع والعمليات التجارية."],
      ["إدارة المشروع", "مصدر واضح للمخزون والجاهزية والقرارات."],
      ["فريق المبيعات", "رحلة يومية أسرع من الاهتمام إلى الحجز."],
    ],
    finalTitle: "شاهد R4C يعمل على رحلة حقيقية",
    finalBody: "استكشف كيف تربط المنصة خطوات العمل من الفرصة إلى قرار الشراء في مساحة واحدة.",
    startDemo: "ابدأ العرض التوضيحي",
    footer: "R4C من KYNOX — منصة للتحكم في تسليم المشاريع العقارية وعملياتها التجارية.",
  },
  en: {
    nav: { solution: "Solution", journey: "Workflow", demo: "Demo" },
    signIn: "Sign in",
    heroEyebrow: "Development and commercial operations platform",
    heroTitle: "One platform connecting projects to sales",
    heroBody: "From planning and inventory to customers, reservations, and approvals — one workspace connecting decisions to delivery.",
    explore: "Explore the workflow",
    proofEyebrow: "Screens from the real product",
    proofTitle: "One view from opportunity to decision",
    proofBody: "Move through real R4C demonstration captures and see how operations connect in one workspace.",
    tabs: { pipeline: "Sales pipeline", inventory: "Inventory and units", reservation: "Reservation controls" },
    demoAlt: { pipeline: "R4C sales pipeline dashboard", inventory: "R4C project and unit inventory", reservation: "R4C reservation review interface" },
    annotations: {
      pipeline: ["One sales pipeline workspace", "Customer and enquiry management", "Clear ownership and stage"],
      inventory: ["Project-connected inventory", "Unit details and floor plans", "Current commercial status"],
      reservation: ["Unit and price review", "Controlled reservation confirmation", "A reliable decision record"],
    },
    journeyEyebrow: "A connected workflow",
    journeyTitle: "From opportunity to follow-up and decision",
    journey: [
      ["Capture the opportunity", "Record interest from any channel and connect it to a clear opportunity."],
      ["Select project and unit", "Review options, floor plans, and prices from one source."],
      ["Review price and reserve", "Confirm the unit and price, then create a controlled reservation."],
      ["Follow up and decide", "Track status, activity, and approvals through closing."],
    ],
    forTitle: "Designed for",
    audiences: [
      ["Real-estate developers", "A connected view of delivery and commercial operations."],
      ["Project management", "A clear source for inventory, readiness, and decisions."],
      ["Sales teams", "A faster daily journey from enquiry to reservation."],
    ],
    finalTitle: "See R4C work through a real journey",
    finalBody: "Explore how the platform connects every step from opportunity to purchase decision in one workspace.",
    startDemo: "Start the product tour",
    footer: "R4C by KYNOX — control for real-estate project delivery and commercial operations.",
  },
} as const;

const demos: Record<DemoKey, string> = {
  pipeline: "/assets/landing/sales-pipeline.png",
  inventory: "/assets/landing/project-inventory.png",
  reservation: "/assets/landing/reservation-confirmed.png",
};

const journeyIcons = [UsersThree, Buildings, CalendarCheck, ChartLineUp];
const audienceIcons = [Buildings, FolderOpen, UsersThree];

export function LandingPage() {
  const { locale, direction } = useI18n();
  const router = useRouter();
  const c = copy[locale];
  const [activeDemo, setActiveDemo] = useState<DemoKey>("pipeline");
  const ForwardArrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  async function switchLanguage() {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }),
    });
    router.refresh();
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="R4C by KYNOX">
          <strong>R4C</strong><span>/</span><b>KYNOX</b>
        </Link>
        <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
          <a href="#solution">{c.nav.solution}</a>
          <a href="#journey">{c.nav.journey}</a>
          <a href="#demo">{c.nav.demo}</a>
        </nav>
        <div className="landing-header-actions">
          <button className="landing-language" type="button" onClick={switchLanguage} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}>
            <span className={locale === "ar" ? "active" : ""}>AR</span><i />
            <span className={locale === "en" ? "active" : ""}>EN</span>
          </button>
          <Link className="button button-secondary landing-signin" href="/login">
            <SignIn size={19} weight="bold" />{c.signIn}
          </Link>
        </div>
      </header>

      <section className="landing-hero" id="solution">
        <div className="landing-hero-copy">
          <p className="eyebrow">{c.heroEyebrow}</p>
          <h1>{c.heroTitle}</h1>
          <p>{c.heroBody}</p>
          <div className="landing-hero-actions">
            <a className="button button-primary" href="#journey">{c.explore}<ForwardArrow size={19} weight="bold" /></a>
            <Link className="button button-secondary" href="/login"><SignIn size={19} weight="bold" />{c.signIn}</Link>
          </div>
        </div>
        <div className="landing-hero-visual" aria-label={c.proofEyebrow}>
          <figure className="hero-shot hero-shot-back"><img src={demos.pipeline} alt={c.demoAlt.pipeline} /></figure>
          <figure className="hero-shot hero-shot-front"><img src={demos.inventory} alt={c.demoAlt.inventory} /></figure>
        </div>
      </section>

      <section className="landing-demo" id="demo">
        <div className="landing-section-heading">
          <p className="eyebrow">{c.proofEyebrow}</p>
          <h2>{c.proofTitle}</h2>
          <p>{c.proofBody}</p>
        </div>
        <div className="demo-tabs" role="tablist" aria-label={c.proofTitle}>
          {(Object.keys(demos) as DemoKey[]).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={activeDemo === key} onClick={() => setActiveDemo(key)}>{c.tabs[key]}</button>
          ))}
        </div>
        <div className="demo-stage">
          <div className="demo-shot-frame"><img key={activeDemo} src={demos[activeDemo]} alt={c.demoAlt[activeDemo]} /></div>
          <ol className="demo-annotations">
            {c.annotations[activeDemo].map((item, index) => <li key={item}><span>{index + 1}</span><strong>{item}</strong></li>)}
          </ol>
        </div>
      </section>

      <section className="landing-journey" id="journey">
        <div className="landing-section-heading centered">
          <p className="eyebrow">{c.journeyEyebrow}</p>
          <h2>{c.journeyTitle}</h2>
        </div>
        <ol className="journey-steps">
          {c.journey.map(([title, body], index) => {
            const Icon = journeyIcons[index]!;
            return <li key={title}><span className="journey-icon"><Icon size={28} weight="duotone" /></span><small>{String(index + 1).padStart(2, "0")}</small><h3>{title}</h3><p>{body}</p></li>;
          })}
        </ol>
      </section>

      <section className="landing-audiences">
        <h2>{c.forTitle}</h2>
        <div>
          {c.audiences.map(([title, body], index) => {
            const Icon = audienceIcons[index]!;
            return <article key={title}><Icon size={30} weight="duotone" /><span><h3>{title}</h3><p>{body}</p></span></article>;
          })}
        </div>
      </section>

      <section className="landing-final-cta">
        <div><h2>{c.finalTitle}</h2><p>{c.finalBody}</p></div>
        <div><a className="button button-primary" href="#demo">{c.startDemo}<ForwardArrow size={19} weight="bold" /></a><Link className="button button-secondary" href="/login">{c.signIn}<SignIn size={19} weight="bold" /></Link></div>
      </section>

      <footer className="landing-footer"><div className="landing-brand"><strong>R4C</strong><span>/</span><b>KYNOX</b></div><p>{c.footer}</p></footer>
    </main>
  );
}
