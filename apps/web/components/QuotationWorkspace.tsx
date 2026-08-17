"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import { quotationApi, type SalesQuotation } from "../lib/quotation-api";

const syntheticQuotation: SalesQuotation = {
  id: "synthetic-quotation-001",
  quotationNumber: "SQ-20260817-DEMO01",
  revision: 1,
  status: "APPROVED_TO_SEND",
  expiresAt: "2026-09-30T15:00:00.000Z",
  currency: "SAR",
  leadId: "synthetic-lead-001",
  customer: { displayName: "Noura Al Harbi" },
  project: { code: "AL-RAWD-01", name: "Al Rawdah Residences" },
  unit: { code: "B2-804", number: "804" },
  createdById: "synthetic-agent",
  reviewedById: "synthetic-manager",
  approvedToSendById: "synthetic-manager",
  reviewedAt: "2026-08-17T09:00:00.000Z",
  approvedToSendAt: "2026-08-17T09:10:00.000Z",
  snapshotChecksum: "uat-quotation-checksum-20260817",
  previewChecksum: "uat-preview-checksum-20260817",
  priceSnapshot: { listPriceMinor: "125000000", basePriceMinor: "118500000", currency: "SAR", revision: 4 },
  paymentPlanSnapshot: { installments: [{ sequence: 1, shareBasisPoints: 1000, label: "Reservation" }, { sequence: 2, shareBasisPoints: 4000, label: "Construction" }, { sequence: 3, shareBasisPoints: 5000, label: "Handover" }] },
  customerSnapshot: { displayName: "Noura Al Harbi", email: "noura.preview@example.test" },
  unitSnapshot: { code: "B2-804", number: "804", bedrooms: 3, bathrooms: 3, grossArea: "176.4", projectName: "Al Rawdah Residences", projectCode: "AL-RAWD-01" },
  termsSnapshot: { body: "Preview terms: subject to controlled internal reservation handoff. Customer acceptance does not reserve the unit or create a payment obligation." },
  decisions: [],
  updatedAt: "2026-08-17T09:10:00.000Z",
};

const labels = {
  en: {
    eyebrow: "Governed commercial workspace",
    title: "Buyer sales quotations",
    subtitle: "Controlled commercial snapshots, internal review, and synthetic buyer-decision previews.",
    synthetic: "DESIGN/UAT PREVIEW — synthetic data only; no legal signature or live communication.",
    liveUnavailable: "Quotation service unavailable. Showing synthetic UAT workspace; no action is persisted.",
    newQuote: "New quotation draft",
    list: "Quotation register",
    review: "Internal review",
    document: "PDF preview",
    buyer: "Buyer decision preview",
    noSend: "No live email delivery is configured. Only a synthetic preview link can be generated.",
    lead: "Lead ID", plan: "Payment plan ID", expiry: "Validity expiry", terms: "Controlled terms", save: "Save draft", submit: "Submit for review",
    approve: "Approve to send", return: "Return to draft", withdraw: "Withdraw", revise: "Create revision", preview: "Open PDF preview", link: "Generate test link",
    decision: "Decision state", acceptance: "Acceptance is recorded only. It does not create a hold, reservation, sale, invoice, or payment obligation.",
    status: "Status", amount: "Quoted list price", validity: "Valid until", customer: "Customer", unit: "Unit", project: "Project", action: "Last action", snapshot: "Snapshot evidence", payment: "Payment schedule",
  },
  ar: {
    eyebrow: "مساحة العمل التجارية المحكومة",
    title: "عروض مبيعات المشترين",
    subtitle: "لقطات تجارية محكومة ومراجعة داخلية ومعاينات اصطناعية لقرار المشتري.",
    synthetic: "معاينة تصميم/قبول — بيانات اصطناعية فقط، دون توقيع قانوني أو تواصل حي.",
    liveUnavailable: "خدمة عروض الأسعار غير متاحة. يتم عرض مساحة قبول اصطناعية ولا يتم حفظ أي إجراء.",
    newQuote: "مسودة عرض جديدة",
    list: "سجل عروض الأسعار",
    review: "المراجعة الداخلية",
    document: "معاينة PDF",
    buyer: "معاينة قرار المشتري",
    noSend: "لا توجد خدمة بريد حي مهيأة. يمكن إنشاء رابط معاينة اصطناعي فقط.",
    lead: "معرّف العميل المحتمل", plan: "معرّف خطة الدفع", expiry: "انتهاء الصلاحية", terms: "الشروط المحكومة", save: "حفظ المسودة", submit: "إرسال للمراجعة",
    approve: "اعتماد للإرسال", return: "إعادة إلى مسودة", withdraw: "سحب", revise: "إنشاء مراجعة", preview: "فتح معاينة PDF", link: "إنشاء رابط اختبار",
    decision: "حالة القرار", acceptance: "يتم تسجيل القبول فقط. لا ينشئ حجزًا أو بيعًا أو فاتورة أو التزام دفع.",
    status: "الحالة", amount: "سعر القائمة المعروض", validity: "صالح حتى", customer: "العميل", unit: "الوحدة", project: "المشروع", action: "آخر إجراء", snapshot: "دليل اللقطة", payment: "جدول الدفع",
  },
} as const;

type Translation = { [K in keyof (typeof labels)["en"]]: string };

function money(quotation: SalesQuotation, locale: "en" | "ar") {
  const price = quotation.priceSnapshot?.listPriceMinor;
  const minor = typeof price === "string" ? Number(price) : typeof price === "number" ? price : 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: quotation.currency, maximumFractionDigits: 0 }).format(minor / 100);
}

function dateText(value: string, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  return `quotation-status quotation-status-${status.toLowerCase().replaceAll("_", "-")}`;
}

export function QuotationWorkspace() {
  const { locale } = useI18n();
  const language = locale === "ar" ? "ar" : "en";
  const copy: Translation = labels[language];
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [selected, setSelected] = useState<SalesQuotation | null>(null);
  const [synthetic, setSynthetic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ leadId: "", paymentPlanId: "", expiresAt: "", terms: "" });
  const [testToken, setTestToken] = useState("");
  const [pdfPreview, setPdfPreview] = useState<SalesQuotation | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = await quotationApi.list();
      setQuotations(data);
      setSelected(data[0] ?? null);
      setSynthetic(false);
      setNotice("");
    } catch {
      setQuotations([syntheticQuotation]);
      setSelected(syntheticQuotation);
      setSynthetic(true);
      setNotice(copy.liveUnavailable);
    } finally {
      setBusy(false);
    }
  }, [copy.liveUnavailable]);

  useEffect(() => { void load(); }, [load]);

  const selectedAmount = useMemo(() => selected ? money(selected, language) : "—", [selected, language]);
  const previewArabicTerms = "تخضع هذه المعاينة المحكومة لإحالة حجز داخلية. يسجل القبول الاهتمام فقط ولا يحجز الوحدة أو ينشئ التزام دفع.";
  const renderedPreviewTerms = language === "ar" && pdfPreview?.id === syntheticQuotation.id ? previewArabicTerms : pdfPreview?.termsSnapshot?.body ?? "—";
  const previewInstallmentLabels = language === "ar" ? ["دفعة الحجز", "أثناء الإنشاء", "عند التسليم"] : ["Reservation", "Construction", "Handover"];

  async function selectQuotation(quotation: SalesQuotation) {
    if (synthetic) {
      setSelected(quotation);
      return;
    }
    setBusy(true);
    try {
      setSelected(await quotationApi.detail(quotation.id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.liveUnavailable);
    } finally {
      setBusy(false);
    }
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (synthetic) {
      setNotice(copy.synthetic);
      return;
    }
    setBusy(true);
    try {
      const created = await quotationApi.create(form);
      setQuotations((items) => [created, ...items]);
      setSelected(created);
      setForm({ leadId: "", paymentPlanId: "", expiresAt: "", terms: "" });
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save quotation draft");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "submit" | "approve" | "return" | "withdraw" | "revise" | "preview" | "link") {
    if (!selected) return;
    if (synthetic) {
      if (action === "link") setTestToken("synthetic-buyer-token-preview");
      setNotice(copy.synthetic);
      return;
    }
    setBusy(true);
    try {
      if (action === "submit") setSelected(await quotationApi.submit(selected.id));
      if (action === "approve") setSelected(await quotationApi.approveToSend(selected.id));
      if (action === "return") setSelected(await quotationApi.returnToDraft(selected.id, "Controlled UAT review return"));
      if (action === "withdraw") setSelected(await quotationApi.withdraw(selected.id));
      if (action === "revise") setSelected(await quotationApi.revision(selected.id));
      if (action === "preview") {
        const preview = await quotationApi.preview(selected.id);
        setPdfPreview(preview.quotation);
        setNotice(`${preview.label} · ${preview.checksum.slice(0, 16)}`);
      }
      if (action === "link") {
        const link = await quotationApi.syntheticPreviewLink(selected.id);
        setTestToken(link.token);
        setNotice(`${copy.synthetic} ${dateText(link.expiresAt, language)}`);
      }
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Quotation action unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="quotation-workspace" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="quotation-hero">
        <div>
          <p className="quotation-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <aside className="quotation-provenance" role="note">
          <strong>{copy.synthetic}</strong>
          <span>{copy.noSend}</span>
        </aside>
      </header>

      {notice ? <div className="quotation-notice" role="status">{notice}</div> : null}

      <section className="quotation-layout" aria-label={copy.title}>
        <aside className="quotation-register card-surface">
          <div className="quotation-section-heading"><div><p>{copy.eyebrow}</p><h2>{copy.list}</h2></div><button type="button" onClick={() => void load()} disabled={busy}>↻</button></div>
          <div className="quotation-list" aria-busy={busy}>
            {quotations.map((quotation) => (
              <button key={quotation.id} type="button" className={`quotation-list-item ${selected?.id === quotation.id ? "is-selected" : ""}`} onClick={() => void selectQuotation(quotation)}>
                <span className={statusClass(quotation.status)}>{quotation.status.replaceAll("_", " ")}</span>
                <strong>{quotation.quotationNumber} · R{quotation.revision}</strong>
                <span>{quotation.customer?.displayName ?? "—"}</span>
                <small>{quotation.project?.name ?? "—"} / {quotation.unit?.code ?? "—"}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="quotation-main">
          <section className="quotation-panel card-surface" aria-labelledby="quotation-draft-title">
            <div className="quotation-section-heading"><div><p>{copy.eyebrow}</p><h2 id="quotation-draft-title">{copy.newQuote}</h2></div><span className="quotation-mode">{synthetic ? "UAT" : "LIVE API"}</span></div>
            <form className="quotation-builder" onSubmit={submitDraft}>
              <label>{copy.lead}<input required value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })} placeholder="UUID" /></label>
              <label>{copy.plan}<input required value={form.paymentPlanId} onChange={(event) => setForm({ ...form, paymentPlanId: event.target.value })} placeholder="UUID" /></label>
              <label>{copy.expiry}<input required type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
              <label className="quotation-wide">{copy.terms}<textarea required value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} placeholder={language === "ar" ? "اكتب الشروط التجارية المعتمدة" : "Enter approved commercial terms"} /></label>
              <div className="quotation-form-actions"><button className="button-primary" disabled={busy} type="submit">{copy.save}</button></div>
            </form>
          </section>

          {pdfPreview ? <section className="quotation-pdf-preview card-surface" aria-label={copy.document}>
            <header><div><p>{copy.eyebrow}</p><h2>{copy.document}</h2></div><button type="button" onClick={() => setPdfPreview(null)}>×</button></header>
            <div className="quotation-pdf-paper">
              <div className="quotation-pdf-brand">KYNOX / R4C <span>{copy.synthetic}</span></div>
              <h2>{pdfPreview.quotationNumber} · R{pdfPreview.revision}</h2>
              <p>{pdfPreview.unitSnapshot?.projectName ? String(pdfPreview.unitSnapshot.projectName) : pdfPreview.project?.name} / {pdfPreview.unitSnapshot?.code ? String(pdfPreview.unitSnapshot.code) : pdfPreview.unit?.code}</p>
              <div className="quotation-pdf-total"><span>{copy.amount}</span><strong>{money(pdfPreview, language)}</strong></div>
              <h3>{copy.payment}</h3>
              <ol>{Array.isArray(pdfPreview.paymentPlanSnapshot?.installments) ? pdfPreview.paymentPlanSnapshot.installments.map((item, index) => <li key={index}>{`${pdfPreview.id === syntheticQuotation.id ? previewInstallmentLabels[index] ?? (language === "ar" ? "دفعة" : "Installment") : typeof item === "object" && item ? String((item as { label?: unknown }).label ?? "Installment") : "—"} · ${typeof item === "object" && item ? Number((item as { shareBasisPoints?: unknown }).shareBasisPoints ?? 0) / 100 : 0}%`}</li>) : null}</ol>
              <h3>{copy.terms}</h3><p>{renderedPreviewTerms}</p>
              <footer>{copy.snapshot}: {pdfPreview.previewChecksum?.slice(0, 28) ?? "—"}</footer>
            </div>
          </section> : null}

          {selected ? <section className="quotation-panel card-surface quotation-detail" aria-label={selected.quotationNumber}>
            <div className="quotation-detail-title"><div><p>{copy.eyebrow}</p><h2>{selected.quotationNumber} <span>R{selected.revision}</span></h2></div><span className={statusClass(selected.status)}>{selected.status.replaceAll("_", " ")}</span></div>
            <div className="quotation-kpis">
              <div><span>{copy.amount}</span><strong>{selectedAmount}</strong></div><div><span>{copy.validity}</span><strong>{dateText(selected.expiresAt, language)}</strong></div><div><span>{copy.unit}</span><strong>{selected.unit?.code ?? "—"}</strong></div><div><span>{copy.customer}</span><strong>{selected.customer?.displayName ?? "—"}</strong></div>
            </div>
            <div className="quotation-detail-grid">
              <article><h3>{copy.review}</h3><p>{selected.reviewedAt ? `${copy.action}: ${dateText(selected.reviewedAt, language)}` : language === "ar" ? "بانتظار تقديم المسودة." : "Draft awaiting submission."}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("submit")} disabled={busy || selected.status !== "DRAFT"}>{copy.submit}</button><button type="button" onClick={() => void act("return")} disabled={busy || selected.status !== "INTERNAL_REVIEW"}>{copy.return}</button><button className="button-primary" type="button" onClick={() => void act("approve")} disabled={busy || selected.status !== "INTERNAL_REVIEW"}>{copy.approve}</button></div></article>
              <article><h3>{copy.document}</h3><p>{copy.snapshot}: {selected.snapshotChecksum?.slice(0, 20) ?? "—"}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("preview")} disabled={busy || !selected.snapshotChecksum}>{copy.preview}</button><button type="button" onClick={() => void act("link")} disabled={busy || selected.status !== "APPROVED_TO_SEND"}>{copy.link}</button></div>{testToken ? <Link className="quotation-test-link" href={`/buyer/quotation/${encodeURIComponent(testToken)}?preview=1`}>{copy.buyer}</Link> : null}</article>
              <article><h3>{copy.payment}</h3><ol>{Array.isArray(selected.paymentPlanSnapshot?.installments) ? selected.paymentPlanSnapshot.installments.map((item, index) => <li key={index}>{typeof item === "object" && item ? `${String((item as { label?: unknown }).label ?? "Installment")} · ${Number((item as { shareBasisPoints?: unknown }).shareBasisPoints ?? 0) / 100}%` : "—"}</li>) : <li>—</li>}</ol></article>
              <article><h3>{copy.decision}</h3><p>{copy.acceptance}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("withdraw")} disabled={busy || !["APPROVED_TO_SEND", "SENT", "VIEWED"].includes(selected.status)}>{copy.withdraw}</button><button type="button" onClick={() => void act("revise")} disabled={busy || !["APPROVED_TO_SEND", "SENT", "VIEWED", "WITHDRAWN", "EXPIRED"].includes(selected.status)}>{copy.revise}</button></div></article>
            </div>
          </section> : null}
        </section>
      </section>
    </main>
  );
}
