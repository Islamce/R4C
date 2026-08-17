"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { quotationApi, type BuyerQuotation, type CustomerDecisionType } from "../lib/quotation-api";
import { useI18n } from "./I18nProvider";

const previewQuotation: BuyerQuotation = {
  quotationNumber: "SQ-20260817-DEMO01",
  revision: 1,
  status: "APPROVED_TO_SEND",
  expiresAt: "2026-09-30T15:00:00.000Z",
  currency: "SAR",
  priceSnapshot: { listPriceMinor: "125000000", basePriceMinor: "118500000", revision: 4 },
  paymentPlanSnapshot: { installments: [{ sequence: 1, shareBasisPoints: 1000, label: "Reservation" }, { sequence: 2, shareBasisPoints: 4000, label: "Construction" }, { sequence: 3, shareBasisPoints: 5000, label: "Handover" }] },
  customerSnapshot: { displayName: "Noura Al Harbi" },
  unitSnapshot: { code: "B2-804", number: "804", bedrooms: 3, bathrooms: 3, grossArea: "176.4", projectName: "Al Rawdah Residences" },
  termsSnapshot: { body: "This controlled preview is subject to internal reservation handoff. Acceptance records interest only and does not reserve the unit or create a payment obligation." },
  snapshotChecksum: "uat-preview-checksum-20260817",
  customerDecisions: [],
};

const text = {
  en: { brand: "KYNOX / R4C", title: "Your buyer quotation", preview: "DESIGN/UAT PREVIEW — NO LEGAL SIGNATURE OR LIVE COMMUNICATION", loading: "Securely retrieving your quotation…", unavailable: "This quotation link is unavailable.", project: "Project", unit: "Unit", quotedPrice: "Quoted price", validity: "Valid until", schedule: "Payment schedule", terms: "Terms", pdf: "Preview controlled PDF", accept: "Accept quotation", decline: "Decline quotation", clarify: "Request clarification", comment: "Optional message", receipt: "Decision recorded", noReservation: "Your response records a quotation decision only. It does not create a unit hold, reservation, sale, invoice, or payment obligation.", final: "This quotation decision has already been recorded.", checksum: "Evidence reference", send: "Record decision" },
  ar: { brand: "كينوكس / R4C", title: "عرض المشتري الخاص بك", preview: "معاينة تصميم/قبول — دون توقيع قانوني أو تواصل حي", loading: "يتم استرجاع عرضك بأمان…", unavailable: "رابط عرض السعر غير متاح.", project: "المشروع", unit: "الوحدة", quotedPrice: "السعر المعروض", validity: "صالح حتى", schedule: "جدول الدفع", terms: "الشروط", pdf: "معاينة PDF محكومة", accept: "قبول عرض السعر", decline: "رفض عرض السعر", clarify: "طلب توضيح", comment: "رسالة اختيارية", receipt: "تم تسجيل القرار", noReservation: "يسجل ردك قرار عرض السعر فقط. لا ينشئ حجزًا أو بيعًا أو فاتورة أو التزام دفع.", final: "تم تسجيل قرار عرض السعر هذا بالفعل.", checksum: "مرجع الدليل", send: "تسجيل القرار" },
} as const;

function currency(quotation: BuyerQuotation, locale: "en" | "ar") {
  const value = quotation.priceSnapshot?.listPriceMinor;
  const amount = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: quotation.currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function BuyerQuotationExperience({ token, preview, previewState }: { token: string; preview: boolean; previewState?: "expired" }) {
  const { locale } = useI18n();
  const language = locale === "ar" ? "ar" : "en";
  const copy = text[language];
  const [quotation, setQuotation] = useState<BuyerQuotation | null>(preview ? { ...previewQuotation, ...(previewState === "expired" ? { status: "EXPIRED" as const } : {}) } : null);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<CustomerDecisionType | null>(null);
  const [comment, setComment] = useState("");
  const [receipt, setReceipt] = useState<{ decision: CustomerDecisionType; recordedAt: string; message: string } | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (preview) return;
    let active = true;
    void quotationApi.resolveBuyer(token).then((result) => {
      if (!active) return;
      setQuotation(result.quotation);
    }).catch(() => {
      if (active) setError(copy.unavailable);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [copy.unavailable, preview, token]);

  const finalState = useMemo(() => quotation?.status === "CUSTOMER_ACCEPTED" || quotation?.status === "CUSTOMER_DECLINED" || quotation?.status === "EXPIRED", [quotation?.status]);

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    if (preview) {
      setReceipt({ decision, recordedAt: new Date().toISOString(), message: copy.noReservation });
      return;
    }
    try {
      const result = await quotationApi.recordBuyerDecision(token, decision, comment || undefined);
      setReceipt(result.receipt);
      if (quotation && decision !== "CLARIFICATION_REQUESTED") setQuotation({ ...quotation, status: decision === "ACCEPTED" ? "CUSTOMER_ACCEPTED" : "CUSTOMER_DECLINED" });
    } catch {
      setError(copy.unavailable);
    }
  }

  if (loading) return <main className="buyer-quotation-page" dir={language === "ar" ? "rtl" : "ltr"}><p className="buyer-loading">{copy.loading}</p></main>;
  if (error || !quotation) return <main className="buyer-quotation-page" dir={language === "ar" ? "rtl" : "ltr"}><section className="buyer-card buyer-error"><strong>{copy.brand}</strong><h1>{copy.unavailable}</h1></section></main>;

  const installments = Array.isArray(quotation.paymentPlanSnapshot?.installments) ? quotation.paymentPlanSnapshot.installments : [];
  const previewArabicTerms = "تخضع هذه المعاينة المحكومة لإحالة حجز داخلية. يسجل القبول الاهتمام فقط ولا يحجز الوحدة أو ينشئ التزام دفع.";
  const renderedTerms = preview && language === "ar" ? previewArabicTerms : quotation.termsSnapshot?.body ?? "—";
  const previewInstallmentLabels = language === "ar" ? ["دفعة الحجز", "أثناء الإنشاء", "عند التسليم"] : ["Reservation", "Construction", "Handover"];
  const unit = quotation.unitSnapshot ?? {};
  return <main className="buyer-quotation-page" dir={language === "ar" ? "rtl" : "ltr"}>
    <section className="buyer-card">
      <header className="buyer-header"><div><p>{copy.brand}</p><h1>{copy.title}</h1><span>{copy.preview}</span></div><div className="buyer-quote-code"><strong>{quotation.quotationNumber}</strong><small>Revision {quotation.revision}</small></div></header>
      <div className="buyer-overview"><div><span>{copy.project}</span><strong>{String(unit.projectName ?? "—")}</strong></div><div><span>{copy.unit}</span><strong>{String(unit.code ?? "—")}</strong></div><div><span>{copy.quotedPrice}</span><strong>{currency(quotation, language)}</strong></div><div><span>{copy.validity}</span><strong>{new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(quotation.expiresAt))}</strong></div></div>
      <aside className="buyer-warning"><strong>{copy.noReservation}</strong></aside>
      <div className="buyer-body"><article><h2>{copy.schedule}</h2><ol>{installments.map((item, index) => <li key={index}><span>{preview ? previewInstallmentLabels[index] ?? (language === "ar" ? "دفعة" : "Installment") : typeof item === "object" && item ? String((item as { label?: unknown }).label ?? "Installment") : "Installment"}</span><strong>{typeof item === "object" && item ? Number((item as { shareBasisPoints?: unknown }).shareBasisPoints ?? 0) / 100 : 0}%</strong></li>)}</ol></article><article><h2>{copy.terms}</h2><p>{renderedTerms}</p><button type="button" className="buyer-pdf" onClick={() => setShowPdf(true)}>{copy.pdf}</button><small>{copy.checksum}: {quotation.snapshotChecksum?.slice(0, 22) ?? "—"}</small></article></div>
      {showPdf ? <section className="buyer-pdf-sheet" role="dialog" aria-label={copy.pdf}><header><strong>KYNOX / R4C</strong><button type="button" onClick={() => setShowPdf(false)}>×</button></header><h2>{quotation.quotationNumber} · R{quotation.revision}</h2><p>{String(unit.projectName ?? "—")} / {String(unit.code ?? "—")}</p><div><span>{copy.quotedPrice}</span><strong>{currency(quotation, language)}</strong></div><h3>{copy.terms}</h3><p>{renderedTerms}</p><small>{copy.preview} · {copy.checksum}: {quotation.snapshotChecksum?.slice(0, 22) ?? "—"}</small></section> : null}
      {receipt ? <section className="buyer-receipt" aria-live="polite"><span>{copy.receipt}</span><h2>{receipt.decision.replaceAll("_", " ")}</h2><p>{receipt.message}</p><small>{new Date(receipt.recordedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-GB")}</small></section> : finalState ? <section className="buyer-receipt"><h2>{copy.final}</h2></section> : <form className="buyer-decision" onSubmit={decide}><h2>{copy.title}</h2><div className="buyer-choice-grid"><button type="button" className={decision === "ACCEPTED" ? "is-selected accept" : "accept"} onClick={() => setDecision("ACCEPTED")}>{copy.accept}</button><button type="button" className={decision === "DECLINED" ? "is-selected decline" : "decline"} onClick={() => setDecision("DECLINED")}>{copy.decline}</button><button type="button" className={decision === "CLARIFICATION_REQUESTED" ? "is-selected clarify" : "clarify"} onClick={() => setDecision("CLARIFICATION_REQUESTED")}>{copy.clarify}</button></div><label>{copy.comment}<textarea value={comment} onChange={(event) => setComment(event.target.value)} /></label><button disabled={!decision} className="buyer-submit" type="submit">{copy.send}</button></form>}
    </section>
  </main>;
}
