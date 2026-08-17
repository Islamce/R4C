"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { quotationApi, type BuyerQuotation, type CustomerDecisionType } from "../lib/quotation-api";
import { syntheticBuyerQuotation } from "../lib/quotation-preview-adapter";
import { decisionHint as selectedDecisionHint, quotationDate, quotationMoney, snapshotInstallments } from "../lib/quotation-presentation";
import { useI18n } from "./I18nProvider";

const text = {
  en: { brand: "KYNOX / R4C", title: "Your buyer quotation", preview: "DESIGN/UAT PREVIEW — NO LEGAL SIGNATURE OR LIVE COMMUNICATION", loading: "Securely retrieving your quotation…", unavailable: "This quotation link is unavailable.", project: "Project", unit: "Unit", quotedPrice: "Quoted price", validity: "Valid until", schedule: "Payment schedule", terms: "Terms", pdf: "Preview controlled PDF", closePreview: "Close document preview", accept: "Accept quotation", decline: "Decline quotation", clarify: "Request clarification", comment: "Optional message", decisionPrompt: "Choose one response before recording your decision.", acceptedHint: "You are recording acceptance of this quotation. A separate authorized team must handle any reservation.", declinedHint: "You are recording that this quotation is declined. You may add a reason if helpful.", clarificationHint: "Tell the sales team what needs clarification. A message is required.", receipt: "Decision recorded", noReservation: "Your response records a quotation decision only. It does not create a unit hold, reservation, sale, invoice, or payment obligation.", final: "This quotation decision has already been recorded.", expired: "This quotation has expired.", expiredDetail: "The validity period ended before a decision could be recorded. Please contact the sales team for an updated quotation.", checksum: "Evidence reference", send: "Record decision" },
  ar: { brand: "كينوكس / R4C", title: "عرض المشتري الخاص بك", preview: "معاينة تصميم/قبول — دون توقيع قانوني أو تواصل حي", loading: "يتم استرجاع عرضك بأمان…", unavailable: "رابط عرض السعر غير متاح.", project: "المشروع", unit: "الوحدة", quotedPrice: "السعر المعروض", validity: "صالح حتى", schedule: "جدول الدفع", terms: "الشروط", pdf: "معاينة PDF محكومة", closePreview: "إغلاق معاينة المستند", accept: "قبول عرض السعر", decline: "رفض عرض السعر", clarify: "طلب توضيح", comment: "رسالة اختيارية", decisionPrompt: "اختر ردًا واحدًا قبل تسجيل قرارك.", acceptedHint: "أنت تسجل قبول عرض السعر. يتولى فريق مخول منفصل أي حجز.", declinedHint: "أنت تسجل رفض عرض السعر. يمكنك إضافة سبب عند الحاجة.", clarificationHint: "أخبر فريق المبيعات بما يحتاج إلى توضيح. الرسالة مطلوبة.", receipt: "تم تسجيل القرار", noReservation: "يسجل ردك قرار عرض السعر فقط. لا ينشئ حجزًا أو بيعًا أو فاتورة أو التزام دفع.", final: "تم تسجيل قرار عرض السعر هذا بالفعل.", expired: "انتهت صلاحية عرض السعر هذا.", expiredDetail: "انتهت فترة الصلاحية قبل تسجيل القرار. يرجى التواصل مع فريق المبيعات للحصول على عرض محدث.", checksum: "مرجع الدليل", send: "تسجيل القرار" },
} as const;

export function BuyerQuotationExperience({ token, preview, previewState }: { token: string; preview: boolean; previewState?: "expired" }) {
  const { locale } = useI18n();
  const language = locale === "ar" ? "ar" : "en";
  const copy = text[language];
  const [quotation, setQuotation] = useState<BuyerQuotation | null>(preview ? syntheticBuyerQuotation(previewState === "expired" ? "EXPIRED" : "APPROVED_TO_SEND") : null);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<CustomerDecisionType | null>(null);
  const [comment, setComment] = useState("");
  const [receipt, setReceipt] = useState<{ decision: CustomerDecisionType; recordedAt: string; message: string } | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (!showPdf) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setShowPdf(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPdf]);

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

  const installments = snapshotInstallments(quotation, language, preview);
  const previewArabicTerms = "تخضع هذه المعاينة المحكومة لإحالة حجز داخلية. يسجل القبول الاهتمام فقط ولا يحجز الوحدة أو ينشئ التزام دفع.";
  const renderedTerms = preview && language === "ar" ? previewArabicTerms : quotation.termsSnapshot?.body ?? "—";
  const unit = quotation.unitSnapshot ?? {};
  const decisionHint = selectedDecisionHint(decision, language);
  return <main className="buyer-quotation-page" dir={language === "ar" ? "rtl" : "ltr"}>
    <section className="buyer-card">
      <header className="buyer-header"><div><p>{copy.brand}</p><h1>{copy.title}</h1><span>{copy.preview}</span></div><div className="buyer-quote-code"><strong>{quotation.quotationNumber}</strong><small>Revision {quotation.revision}</small></div></header>
      <div className="buyer-overview"><div><span>{copy.project}</span><strong>{String(unit.projectName ?? "—")}</strong></div><div><span>{copy.unit}</span><strong>{String(unit.code ?? "—")}</strong></div><div><span>{copy.quotedPrice}</span><strong>{quotationMoney(quotation, language)}</strong></div><div><span>{copy.validity}</span><strong>{quotationDate(quotation.expiresAt, language)}</strong></div></div>
      <aside className="buyer-warning"><strong>{copy.noReservation}</strong></aside>
      <div className="buyer-body"><article><h2>{copy.schedule}</h2><ol>{installments.map((installment, index) => <li key={index}><span>{installment.label}</span><strong>{installment.percentage}%</strong></li>)}</ol></article><article><h2>{copy.terms}</h2><p>{renderedTerms}</p><button type="button" className="buyer-pdf" onClick={() => setShowPdf(true)}>{copy.pdf}</button><small>{copy.checksum}: {quotation.snapshotChecksum?.slice(0, 22) ?? "—"}</small></article></div>
      {showPdf ? <section className="buyer-pdf-sheet" role="dialog" aria-modal="true" aria-label={copy.pdf} tabIndex={-1}><header><strong>KYNOX / R4C</strong><button type="button" aria-label={copy.closePreview} onClick={() => setShowPdf(false)}>×</button></header><h2>{quotation.quotationNumber} · R{quotation.revision}</h2><p>{String(unit.projectName ?? "—")} / {String(unit.code ?? "—")}</p><div><span>{copy.quotedPrice}</span><strong>{quotationMoney(quotation, language)}</strong></div><h3>{copy.terms}</h3><p>{renderedTerms}</p><small>{copy.preview} · {copy.checksum}: {quotation.snapshotChecksum?.slice(0, 22) ?? "—"}</small></section> : null}
      {receipt ? <section className="buyer-receipt" aria-live="polite"><span>{copy.receipt}</span><h2>{receipt.decision.replaceAll("_", " ")}</h2><p>{receipt.message}</p><small>{quotationDate(receipt.recordedAt, language)}</small></section> : finalState ? <section className="buyer-receipt"><h2>{quotation.status === "EXPIRED" ? copy.expired : copy.final}</h2>{quotation.status === "EXPIRED" ? <p>{copy.expiredDetail}</p> : null}</section> : <form className="buyer-decision" onSubmit={decide}><h2>{copy.title}</h2><div className="buyer-choice-grid"><button type="button" aria-pressed={decision === "ACCEPTED"} className={decision === "ACCEPTED" ? "is-selected accept" : "accept"} onClick={() => setDecision("ACCEPTED")}>{copy.accept}</button><button type="button" aria-pressed={decision === "DECLINED"} className={decision === "DECLINED" ? "is-selected decline" : "decline"} onClick={() => setDecision("DECLINED")}>{copy.decline}</button><button type="button" aria-pressed={decision === "CLARIFICATION_REQUESTED"} className={decision === "CLARIFICATION_REQUESTED" ? "is-selected clarify" : "clarify"} onClick={() => setDecision("CLARIFICATION_REQUESTED")}>{copy.clarify}</button></div><p className="buyer-decision-hint" aria-live="polite">{decisionHint}</p><label>{copy.comment}<textarea required={decision === "CLARIFICATION_REQUESTED"} value={comment} onChange={(event) => setComment(event.target.value)} /></label><button disabled={!decision} className="buyer-submit" type="submit">{copy.send}</button></form>}
    </section>
  </main>;
}
