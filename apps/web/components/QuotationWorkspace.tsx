"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import { commercialApi, type CommercialLead, type PaymentPlan } from "../lib/commercial-api";
import { quotationApi, type SalesQuotation } from "../lib/quotation-api";
import { syntheticCommercialLead, syntheticPaymentPlans, syntheticSalesQuotation } from "../lib/quotation-preview-adapter";
import {
  customerVisibleStatuses,
  quotationDate,
  quotationMoney,
  quotationStatusClass,
  quotationStatusLabel,
  revisableStatuses,
  snapshotInstallments,
} from "../lib/quotation-presentation";

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
    status: "Status", amount: "Quoted list price", validity: "Valid until", customer: "Customer", unit: "Unit", project: "Project", action: "Last action", snapshot: "Snapshot evidence", payment: "Payment schedule", refresh: "Refresh quotation register", closePreview: "Close document preview", formHint: "Select an authorized lead and eligible payment plan. The server revalidates availability, pricing, and plan scope before a draft is created.", leadSearch: "Search loaded leads", leadSelect: "Lead / customer context", leadLoading: "Loading eligible leads…", leadEmpty: "No eligible lead is available for quotation. A lead requires customer, project, and unit context.", leadUnavailable: "Lead selector is unavailable for this session. Sign in with commercial lead-view permission.", planSelect: "Eligible payment plan", planLoading: "Loading eligible payment plans…", planEmpty: "No eligible payment plan is available for the selected project.", planUnavailable: "Payment-plan access is unavailable for the selected project.", leadContext: "Authoritative lead context", projectUnit: "Project and available unit",
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
    status: "الحالة", amount: "سعر القائمة المعروض", validity: "صالح حتى", customer: "العميل", unit: "الوحدة", project: "المشروع", action: "آخر إجراء", snapshot: "دليل اللقطة", payment: "جدول الدفع", refresh: "تحديث سجل عروض الأسعار", closePreview: "إغلاق معاينة المستند", formHint: "اختر عميلًا محتملاً مخولًا وخطة دفع مؤهلة. يعيد الخادم التحقق من الإتاحة والسعر ونطاق الخطة قبل إنشاء المسودة.", leadSearch: "البحث في العملاء المحتملين المحملين", leadSelect: "سياق العميل المحتمل / المشتري", leadLoading: "يتم تحميل العملاء المحتملين المؤهلين…", leadEmpty: "لا يوجد عميل محتمل مؤهل لعرض السعر. يحتاج العميل إلى سياق المشتري والمشروع والوحدة.", leadUnavailable: "محدد العميل المحتمل غير متاح لهذه الجلسة. سجل الدخول بصلاحية عرض العملاء المحتملين التجارية.", planSelect: "خطة الدفع المؤهلة", planLoading: "يتم تحميل خطط الدفع المؤهلة…", planEmpty: "لا توجد خطة دفع مؤهلة للمشروع المحدد.", planUnavailable: "الوصول إلى خطة الدفع غير متاح للمشروع المحدد.", leadContext: "سياق العميل المحتمل المعتمد", projectUnit: "المشروع والوحدة المتاحة",
  },
} as const;

type Translation = { [K in keyof (typeof labels)["en"]]: string };

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
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectorState, setSelectorState] = useState<"idle" | "loading-leads" | "loading-plans" | "lead-unavailable" | "plan-unavailable">("idle");
  const [testToken, setTestToken] = useState("");
  const [pdfPreview, setPdfPreview] = useState<SalesQuotation | null>(null);

  useEffect(() => {
    if (!pdfPreview) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPdfPreview(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pdfPreview]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = await quotationApi.list();
      setQuotations(data);
      setSelected(data[0] ?? null);
      setSynthetic(false);
      setNotice("");
    } catch {
      setQuotations([syntheticSalesQuotation]);
      setSelected(syntheticSalesQuotation);
      setSynthetic(true);
      setNotice(copy.liveUnavailable);
    } finally {
      setBusy(false);
    }
  }, [copy.liveUnavailable]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (synthetic) {
      setLeads([syntheticCommercialLead]);
      setSelectorState("idle");
      return;
    }
    let active = true;
    setSelectorState("loading-leads");
    void commercialApi.leads(false).catch(() => commercialApi.leads(true)).then((page) => {
      if (!active) return;
      setLeads(page.items.filter((lead) => Boolean(lead.customerId && lead.projectId && lead.unitId)));
      setSelectorState("idle");
    }).catch(() => {
      if (active) setSelectorState("lead-unavailable");
    });
    return () => { active = false; };
  }, [synthetic]);

  const selectedLead = leads.find((lead) => lead.id === form.leadId) ?? null;
  const filteredLeads = useMemo(() => {
    const needle = leadSearch.trim().toLocaleLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => [lead.customer?.firstName, lead.customer?.lastName, lead.customer?.email, lead.project?.code, lead.project?.name, lead.unit?.code, lead.unit?.number].filter(Boolean).join(" ").toLocaleLowerCase().includes(needle));
  }, [leadSearch, leads]);

  const selectedAmount = useMemo(() => selected ? quotationMoney(selected, language) : "—", [selected, language]);
  const previewArabicTerms = "تخضع هذه المعاينة المحكومة لإحالة حجز داخلية. يسجل القبول الاهتمام فقط ولا يحجز الوحدة أو ينشئ التزام دفع.";
  const renderedPreviewTerms = language === "ar" && pdfPreview?.id === syntheticSalesQuotation.id ? previewArabicTerms : pdfPreview?.termsSnapshot?.body ?? "—";

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

  async function chooseLead(leadId: string) {
    const lead = leads.find((item) => item.id === leadId) ?? null;
    setForm((current) => ({ ...current, leadId, paymentPlanId: "" }));
    setPaymentPlans([]);
    if (!lead?.projectId) return;
    if (synthetic) {
      setPaymentPlans(syntheticPaymentPlans);
      setSelectorState("idle");
      return;
    }
    setSelectorState("loading-plans");
    try {
      setPaymentPlans(await commercialApi.paymentPlans(lead.projectId));
      setSelectorState("idle");
    } catch {
      setSelectorState("plan-unavailable");
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
      setPaymentPlans([]);
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
      if (action === "preview") setPdfPreview(selected);
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
        setNotice(`${copy.synthetic} ${quotationDate(link.expiresAt, language)}`);
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
          <div className="quotation-section-heading"><div><p>{copy.eyebrow}</p><h2>{copy.list}</h2></div><button type="button" aria-label={copy.refresh} title={copy.refresh} onClick={() => void load()} disabled={busy}>↻</button></div>
          <div className="quotation-list" aria-busy={busy}>
            {quotations.map((quotation) => (
              <button key={quotation.id} type="button" className={`quotation-list-item ${selected?.id === quotation.id ? "is-selected" : ""}`} onClick={() => void selectQuotation(quotation)}>
                <span className={quotationStatusClass(quotation.status)}>{quotationStatusLabel(quotation.status, language)}</span>
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
              <p className="quotation-form-hint">{copy.formHint}</p>
              <label className="quotation-wide">{copy.leadSearch}<input value={leadSearch} onChange={(event) => setLeadSearch(event.target.value)} placeholder={language === "ar" ? "الاسم أو المشروع أو الوحدة" : "Customer, project, or unit"} /></label>
              <label>{copy.leadSelect}<select required value={form.leadId} disabled={selectorState === "loading-leads" || selectorState === "lead-unavailable"} onChange={(event) => void chooseLead(event.target.value)}><option value="">{selectorState === "loading-leads" ? copy.leadLoading : copy.leadSelect}</option>{filteredLeads.map((lead) => <option key={lead.id} value={lead.id}>{[lead.customer ? `${lead.customer.firstName} ${lead.customer.lastName ?? ""}`.trim() : null, lead.project?.code, lead.unit?.code].filter(Boolean).join(" · ")}</option>)}</select></label>
              <label>{copy.planSelect}<select required value={form.paymentPlanId} disabled={!selectedLead || selectorState === "loading-plans" || selectorState === "plan-unavailable"} onChange={(event) => setForm({ ...form, paymentPlanId: event.target.value })}><option value="">{selectorState === "loading-plans" ? copy.planLoading : copy.planSelect}</option>{paymentPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.installments.map((installment) => `${installment.label ?? installment.sequence}: ${installment.shareBasisPoints / 100}%`).join(" · ")}</option>)}</select></label>
              {selectedLead ? <aside className="quotation-lead-context quotation-wide" role="status"><strong>{copy.leadContext}</strong><span>{selectedLead.customer ? `${selectedLead.customer.firstName} ${selectedLead.customer.lastName ?? ""}`.trim() : "—"}</span><span>{copy.projectUnit}: {selectedLead.project?.name ?? "—"} / {selectedLead.unit?.code ?? "—"}</span></aside> : null}
              {selectorState === "lead-unavailable" ? <p className="quotation-selector-error quotation-wide" role="alert">{copy.leadUnavailable}</p> : null}
              {selectorState === "plan-unavailable" ? <p className="quotation-selector-error quotation-wide" role="alert">{copy.planUnavailable}</p> : null}
              {selectorState === "idle" && !filteredLeads.length ? <p className="quotation-selector-empty quotation-wide">{copy.leadEmpty}</p> : null}
              {selectedLead && selectorState === "idle" && !paymentPlans.length ? <p className="quotation-selector-empty quotation-wide">{copy.planEmpty}</p> : null}
              <label>{copy.expiry}<input required type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
              <label className="quotation-wide">{copy.terms}<textarea required value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} placeholder={language === "ar" ? "اكتب الشروط التجارية المعتمدة" : "Enter approved commercial terms"} /></label>
              <div className="quotation-form-actions"><button className="button-primary" disabled={busy || !form.leadId || !form.paymentPlanId} type="submit">{copy.save}</button></div>
            </form>
          </section>

          {pdfPreview ? <section className="quotation-pdf-preview card-surface" role="dialog" aria-modal="true" aria-label={copy.document} tabIndex={-1}>
            <header><div><p>{copy.eyebrow}</p><h2>{copy.document}</h2></div><button type="button" aria-label={copy.closePreview} title={copy.closePreview} onClick={() => setPdfPreview(null)}>×</button></header>
            <div className="quotation-pdf-paper">
              <div className="quotation-pdf-brand">KYNOX / R4C <span>{copy.synthetic}</span></div>
              <h2>{pdfPreview.quotationNumber} · R{pdfPreview.revision}</h2>
              <p>{pdfPreview.unitSnapshot?.projectName ? String(pdfPreview.unitSnapshot.projectName) : pdfPreview.project?.name} / {pdfPreview.unitSnapshot?.code ? String(pdfPreview.unitSnapshot.code) : pdfPreview.unit?.code}</p>
              <div className="quotation-pdf-total"><span>{copy.amount}</span><strong>{quotationMoney(pdfPreview, language)}</strong></div>
              <h3>{copy.payment}</h3>
              <ol>{snapshotInstallments(pdfPreview, language, pdfPreview.id === syntheticSalesQuotation.id).map((installment, index) => <li key={index}>{`${installment.label} · ${installment.percentage}%`}</li>)}</ol>
              <h3>{copy.terms}</h3><p>{renderedPreviewTerms}</p>
              <footer>{copy.snapshot}: {pdfPreview.previewChecksum?.slice(0, 28) ?? "—"}</footer>
            </div>
          </section> : null}

          {selected ? <section className="quotation-panel card-surface quotation-detail" aria-label={selected.quotationNumber}>
            <div className="quotation-detail-title"><div><p>{copy.eyebrow}</p><h2>{selected.quotationNumber} <span>R{selected.revision}</span></h2></div><span className={quotationStatusClass(selected.status)}>{quotationStatusLabel(selected.status, language)}</span></div>
            <div className="quotation-kpis">
              <div><span>{copy.amount}</span><strong>{selectedAmount}</strong></div><div><span>{copy.validity}</span><strong>{quotationDate(selected.expiresAt, language)}</strong></div><div><span>{copy.unit}</span><strong>{selected.unit?.code ?? "—"}</strong></div><div><span>{copy.customer}</span><strong>{selected.customer?.displayName ?? "—"}</strong></div>
            </div>
            <div className="quotation-detail-grid">
              <article><h3>{copy.review}</h3><p>{selected.reviewedAt ? `${copy.action}: ${quotationDate(selected.reviewedAt, language)}` : language === "ar" ? "بانتظار تقديم المسودة." : "Draft awaiting submission."}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("submit")} disabled={busy || selected.status !== "DRAFT"}>{copy.submit}</button><button type="button" onClick={() => void act("return")} disabled={busy || selected.status !== "INTERNAL_REVIEW"}>{copy.return}</button><button className="button-primary" type="button" onClick={() => void act("approve")} disabled={busy || selected.status !== "INTERNAL_REVIEW"}>{copy.approve}</button></div></article>
              <article><h3>{copy.document}</h3><p>{copy.snapshot}: {selected.snapshotChecksum?.slice(0, 20) ?? "—"}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("preview")} disabled={busy || !selected.snapshotChecksum}>{copy.preview}</button><button type="button" onClick={() => void act("link")} disabled={busy || selected.status !== "APPROVED_TO_SEND"}>{copy.link}</button></div>{testToken ? <Link className="quotation-test-link" href={`/buyer/quotation/${encodeURIComponent(testToken)}?preview=1`}>{copy.buyer}</Link> : null}</article>
              <article><h3>{copy.payment}</h3><ol>{snapshotInstallments(selected, language).length ? snapshotInstallments(selected, language).map((installment, index) => <li key={index}>{`${installment.label} · ${installment.percentage}%`}</li>) : <li>—</li>}</ol></article>
              <article><h3>{copy.decision}</h3><p>{copy.acceptance}</p><div className="quotation-action-row"><button type="button" onClick={() => void act("withdraw")} disabled={busy || !customerVisibleStatuses.includes(selected.status)}>{copy.withdraw}</button><button type="button" onClick={() => void act("revise")} disabled={busy || !revisableStatuses.includes(selected.status)}>{copy.revise}</button></div></article>
            </div>
          </section> : null}
        </section>
      </section>
    </main>
  );
}
