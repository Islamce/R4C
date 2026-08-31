"use client";

import { Buildings, CheckCircle, DeviceMobile, HouseLine, SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Unit = { id: string; code: string; number: string; grossArea: string; bedrooms: number; bathrooms: number; view: string | null; building: { name: string }; floor: { name: string }; unitType: { name: string }; price: { amountMinor: string; currency: string } | null };
type Project = { id: string; code: string; name: string; description: string | null; _count: { units: number }; units: Unit[] };
type Portfolio = { tenant: { code: string; name: string }; projects: Project[] };

const saudiMobile = /^(?:\+966|00966|966|0)?5\d{8}$/;

export function CustomerPortfolio({ tenantCode }: { tenantCode: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [uatCode, setUatCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState("");
  useEffect(() => { if (!tenantCode) return; void fetch(`/api/public/commercial/portfolio?tenantCode=${encodeURIComponent(tenantCode)}`).then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<Portfolio>; }).then(setPortfolio).catch(() => setNotice("تعذر تحميل المشاريع المتاحة حالياً.")); }, [tenantCode]);
  const mobileValid = useMemo(() => saudiMobile.test(phone.replace(/[\s()-]/g, "")), [phone]);

  async function requestCode() {
    if (!mobileValid) return setNotice("أدخل رقم جوال سعودي صحيحاً، مثال: 05XXXXXXXX.");
    setBusy(true); setNotice("");
    try { const response = await fetch("/api/public/commercial/phone/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenantCode, phone }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message); setVerificationId(body.verificationId); setUatCode(body.uatCode ?? ""); setNotice("تم إرسال رمز تحقق مكون من 6 أرقام إلى جوالك."); } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر إرسال رمز التحقق."); } finally { setBusy(false); }
  }

  async function verifyCode() {
    setBusy(true); setNotice("");
    try { const response = await fetch("/api/public/commercial/phone/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenantCode, verificationId, code }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message); setVerified(true); setNotice("تم التحقق من رقم الجوال بنجاح."); } catch (error) { setNotice(error instanceof Error ? error.message : "رمز التحقق غير صحيح."); } finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedProject || !verified) return;
    setBusy(true); setNotice("");
    const data = new FormData(event.currentTarget);
    try { const response = await fetch("/api/public/commercial/interests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenantCode, verificationId, firstName: data.get("firstName"), lastName: data.get("lastName") || undefined, phone, email: data.get("email"), projectId: selectedProject.id, unitId: selectedUnitId || undefined, enquiryConsentGranted: data.get("consent") === "on", marketingConsentGranted: data.get("marketing") === "on" }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message); setComplete(body.reference); } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر تسجيل الاهتمام."); } finally { setBusy(false); }
  }

  if (complete) return <main className="customer-portal customer-success" dir="rtl"><CheckCircle size={70} weight="duotone" /><p>تم تسجيل اهتمامك بنجاح</p><h1>سيتواصل معك مسؤول المبيعات قريباً</h1><span>رقم المرجع: <b dir="ltr">{complete}</b></span></main>;
  return <main className="customer-portal" dir="rtl">
    <header className="customer-hero"><div className="customer-brand"><Buildings size={34} weight="duotone" /><span>KYNOX · R4C</span></div><div><p>{portfolio?.tenant.name ?? "المحفظة العقارية"}</p><h1>اكتشف منزلك القادم</h1><span>تصفح المشاريع والوحدات المتاحة وسجّل اهتمامك بأمان.</span></div><a href="/login">دخول فريق المبيعات</a></header>
    {notice ? <div className="customer-notice" role="status">{notice}</div> : null}
    <section className="customer-projects"><header><p>المشاريع المتاحة</p><h2>اختر المشروع المناسب لك</h2></header><div className="customer-project-grid">{portfolio?.projects.map((project, index) => <article key={project.id}><div className={`project-art project-art-${index % 3}`}><Buildings size={54} weight="duotone" /><b>{project.code}</b></div><div><span>{project._count.units} وحدة متاحة</span><h3>{project.name}</h3><p>{project.description ?? "مشروع سكني متكامل بتصميم عصري وموقع مميز."}</p><button onClick={() => { setSelectedProject(project); setSelectedUnitId(""); setVerified(false); setVerificationId(""); }}>عرض الوحدات وتسجيل الاهتمام</button></div></article>)}</div>{portfolio && portfolio.projects.length === 0 ? <p className="customer-empty">لا توجد مشاريع متاحة للبيع حالياً.</p> : null}</section>
    {selectedProject ? <section className="interest-panel" aria-label="تسجيل الاهتمام"><header><button onClick={() => setSelectedProject(null)}>إغلاق</button><div><p>تسجيل الاهتمام</p><h2>{selectedProject.name}</h2></div></header><form onSubmit={submit}><label><span>الوحدة المفضلة (اختياري)</span><select value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)}><option value="">لم أحدد وحدة بعد</option>{selectedProject.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.code} · {unit.unitType.name} · {unit.grossArea} م²{unit.price ? ` · ${(Number(unit.price.amountMinor) / 100).toLocaleString("ar-SA")} ر.س` : ""}</option>)}</select></label><div className="form-pair"><label><span>الاسم الأول</span><input name="firstName" required maxLength={160} /></label><label><span>اسم العائلة</span><input name="lastName" maxLength={160} /></label></div><label><span>البريد الإلكتروني</span><input name="email" type="email" required /></label><label><span>رقم الجوال السعودي</span><div className="phone-control"><input value={phone} onChange={(event) => { setPhone(event.target.value); setVerified(false); setVerificationId(""); }} inputMode="tel" dir="ltr" placeholder="05XXXXXXXX" aria-invalid={phone.length > 0 && !mobileValid} required /><button type="button" onClick={requestCode} disabled={!mobileValid || busy || verified}><DeviceMobile size={18} />{verified ? "تم التحقق" : "إرسال الرمز"}</button></div></label>{verificationId && !verified ? <label><span>رمز التحقق</span><div className="phone-control"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" placeholder="000000" /><button type="button" onClick={verifyCode} disabled={code.length !== 6 || busy}>تأكيد الرقم</button></div>{uatCode ? <small>رمز بيئة الاختبار: {uatCode}</small> : null}</label> : null}<label className="consent"><input name="consent" type="checkbox" required /><span>أوافق على استخدام بياناتي للتواصل معي بخصوص هذا الاستفسار.</span></label><label className="consent"><input name="marketing" type="checkbox" /><span>أرغب في استلام عروض ومشاريع عقارية مستقبلية.</span></label><button className="interest-submit" disabled={!verified || busy}>{busy ? <SpinnerGap className="spin" size={20} /> : <HouseLine size={20} />}تسجيل الاهتمام</button></form></section> : null}
  </main>;
}
