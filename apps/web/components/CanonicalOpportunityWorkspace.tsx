"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Buildings,
  CalendarBlank,
  Check,
  CheckCircle,
  CurrencyCircleDollar,
  DotsThree,
  EnvelopeSimple,
  FileText,
  MagnifyingGlass,
  MapPin,
  Note,
  Phone,
  Plus,
  Target,
  UsersThree,
} from "@phosphor-icons/react";
import { commercialApi, type CommercialLead, type LeadWorkspace, type SalesActivity } from "../lib/commercial-api";

const text = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;

type StageKey = "qualification" | "needs" | "proposal" | "negotiation" | "approval" | "closed";
type OpportunityRow = {
  id: string;
  name: string;
  project: string;
  unit: string;
  stage: StageKey;
  action: string;
  due: string;
  owner: string;
  value: string;
  phone?: string;
  source?: string;
  lead?: CommercialLead;
};

const stageLabels: Record<StageKey, { en: string; ar: string }> = {
  qualification: { en: "Qualification", ar: "تأهيل" },
  needs: { en: "Needs analysis", ar: "دراسة الاحتياج" },
  proposal: { en: "Technical proposal", ar: "عرض فني" },
  negotiation: { en: "Negotiation", ar: "مفاوضات" },
  approval: { en: "Approval", ar: "موافقة" },
  closed: { en: "Closed", ar: "إغلاق" },
};

const previewRowsAr: OpportunityRow[] = [
  { id: "OP-2026-0177", name: "أحمد الغامدي", project: "مشروع المروج", unit: "البرج A · A-1203", stage: "proposal", action: "إرسال العرض التجاري", due: "2026-09-08", owner: "سارة الشهراني", value: "42,000,000 ر.س" },
  { id: "OP-2026-0176", name: "نورة القحطاني", project: "مشروع النخيل", unit: "العمارة B · B-0402", stage: "needs", action: "مكالمة متابعة", due: "2026-09-10", owner: "محمد العنزي", value: "28,000,000 ر.س" },
  { id: "OP-2026-0175", name: "عبدالله السبيعي", project: "مشروع اليانبيع", unit: "البرج C · C-0701", stage: "negotiation", action: "إرسال المستندات", due: "2026-09-12", owner: "خالد الشهري", value: "21,000,000 ر.س" },
  { id: "OP-2026-0174", name: "ريم العتيبي", project: "مشروع الوادي", unit: "العمارة D · D-0505", stage: "proposal", action: "اجتماع مع العميل", due: "2026-09-15", owner: "سارة الشهراني", value: "19,000,000 ر.س" },
  { id: "OP-2026-0173", name: "فهد الدوسري", project: "مشروع السدرة", unit: "البرج E · E-1108", stage: "needs", action: "مراجعة العقود", due: "2026-09-18", owner: "محمد العنزي", value: "16,000,000 ر.س" },
];

const previewRowsEn: OpportunityRow[] = [
  { id: "OP-2026-0177", name: "Ahmed Al-Ghamdi", project: "Al Muruj Project", unit: "Tower A · A-1203", stage: "proposal", action: "Send commercial proposal", due: "2026-09-08", owner: "Sarah Al-Shahrani", value: "SAR 42,000,000" },
  { id: "OP-2026-0176", name: "Noura Al-Qahtani", project: "Al Nakheel Project", unit: "Building B · B-0402", stage: "needs", action: "Follow-up call", due: "2026-09-10", owner: "Mohammed Al-Enezi", value: "SAR 28,000,000" },
  { id: "OP-2026-0175", name: "Abdullah Al-Subaie", project: "Al Yanabee Project", unit: "Tower C · C-0701", stage: "negotiation", action: "Send documents", due: "2026-09-12", owner: "Khalid Al-Shehri", value: "SAR 21,000,000" },
  { id: "OP-2026-0174", name: "Reem Al-Otaibi", project: "Al Wadi Project", unit: "Building D · D-0505", stage: "proposal", action: "Customer meeting", due: "2026-09-15", owner: "Sarah Al-Shahrani", value: "SAR 19,000,000" },
  { id: "OP-2026-0173", name: "Fahad Al-Dosari", project: "Al Sidra Project", unit: "Tower E · E-1108", stage: "needs", action: "Review contracts", due: "2026-09-18", owner: "Mohammed Al-Enezi", value: "SAR 16,000,000" },
];

const detailPreviewAr: OpportunityRow = {
  id: "OP-2026-0173",
  name: "مشروع واجهة الرمال السكني",
  project: "حي القيروان، الرياض",
  unit: "شركة دورة التطوير العقاري",
  stage: "proposal",
  action: "متابعة ملاحظات العميل",
  due: "2026-09-12",
  owner: "سارة الشهراني",
  value: "120,000,000 ر.س",
};

const detailPreviewEn: OpportunityRow = {
  id: "OP-2026-0173",
  name: "Rimal Facade Residential Project",
  project: "Al Qirawan, Riyadh",
  unit: "Dawrat Real Estate Development Company",
  stage: "proposal",
  action: "Follow up on customer feedback",
  due: "2026-09-12",
  owner: "Sarah Al-Shahrani",
  value: "SAR 120,000,000",
};

const previewActivitiesAr = [
  { id: "a1", type: "CALL", title: "مناقشة الملاحظات على العرض الفني", detail: "مع أ. خالد مدني، من جانب العميل", date: "2026-09-08", time: "10:14 ص" },
  { id: "a2", type: "EMAIL", title: "تم إرسال عرض فني", detail: "إرسال النسخة المحدثة من العرض الفني بعد اجتماع اليوم", date: "2026-09-07", time: "04:32 م" },
  { id: "a3", type: "MEETING", title: "اجتماع مع العميل", detail: "عرض الحلول المقترحة ومناقشة الجدول الزمني للتنفيذ", date: "2026-09-03", time: "11:20 ص" },
  { id: "a4", type: "NOTE", title: "إضافة ملاحظة", detail: "العميل مهتم بشكل كبير ويطلب بعض التعديلات على المخطط العام.", date: "2026-08-30", time: "02:17 م" },
];

const previewActivitiesEn = [
  { id: "a1", type: "CALL", title: "Discussed feedback on the technical proposal", detail: "With Mr. Khalid Madani from the customer team", date: "2026-09-08", time: "10:14 AM" },
  { id: "a2", type: "EMAIL", title: "Technical proposal sent", detail: "Sent the revised proposal following today's meeting", date: "2026-09-07", time: "04:32 PM" },
  { id: "a3", type: "MEETING", title: "Customer meeting", detail: "Presented the proposed solutions and reviewed the delivery schedule", date: "2026-09-03", time: "11:20 AM" },
  { id: "a4", type: "NOTE", title: "Note added", detail: "The customer is highly interested and requested adjustments to the master plan.", date: "2026-08-30", time: "02:17 PM" },
];

function stageForLead(status: CommercialLead["status"]): StageKey {
  if (status === "WON") return "closed";
  if (status === "RESERVED") return "approval";
  if (status === "NEGOTIATION") return "negotiation";
  if (status === "APPOINTMENT") return "proposal";
  if (status === "QUALIFIED" || status === "CONTACTED") return "needs";
  return "qualification";
}

function mapLead(lead: CommercialLead, index: number): OpportunityRow {
  const customerName = lead.customer ? `${lead.customer.firstName}${lead.customer.lastName ? ` ${lead.customer.lastName}` : ""}` : "—";
  const project = lead.project?.name ?? "—";
  const unit = lead.unit ? `${lead.unit.code} · ${lead.unit.number}` : "—";
  const stage = stageForLead(lead.status);
  const actions: Record<StageKey, string> = {
    qualification: "Qualification call",
    needs: "Follow-up call",
    proposal: "Send proposal",
    negotiation: "Send documents",
    approval: "Review approval",
    closed: "Archive opportunity",
  };
  return {
    id: lead.id,
    name: customerName,
    project,
    unit,
    stage,
    action: actions[stage],
    due: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 10),
    owner: lead.assignedTo.displayName,
    value: "—",
    phone: lead.customer?.phone,
    source: lead.source,
    lead,
  };
}

function dateLabel(ar: boolean, value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(ar ? "ar-SA" : "en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function activityIcon(type: string) {
  if (type === "EMAIL") return EnvelopeSimple;
  if (type === "MEETING") return UsersThree;
  if (type === "NOTE") return Note;
  return Phone;
}

export function CanonicalOpportunityWorkspace({ ar, persistent = false, canViewAllLeads = false }: { ar: boolean; persistent?: boolean; canViewAllLeads?: boolean }) {
  const localizedPreviewRows = ar ? previewRowsAr : previewRowsEn;
  const localizedDetailPreview = ar ? detailPreviewAr : detailPreviewEn;
  const [rows, setRows] = useState<OpportunityRow[]>(localizedPreviewRows);
  const [selectedId, setSelectedId] = useState(localizedDetailPreview.id);
  const [view, setView] = useState<"list" | "record">("list");
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"activity" | "details" | "notes">("activity");
  const [workspace, setWorkspace] = useState<LeadWorkspace | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(persistent);

  useEffect(() => {
    if (!persistent) setRows(localizedPreviewRows);
  }, [ar, persistent]);

  useEffect(() => {
    if (!persistent) return;
    setLoading(true);
    void commercialApi.leads(canViewAllLeads)
      .then((page) => {
        const mapped = page.items.map(mapLead);
        setRows(mapped);
        if (mapped[0]) setSelectedId(mapped[0].id);
      })
      .catch(() => setNotice(text(ar, "Live opportunities could not be loaded. Showing the last available view.", "تعذر تحميل الفرص الحالية. يتم عرض آخر قائمة متاحة.")))
      .finally(() => setLoading(false));
  }, [ar, canViewAllLeads, persistent]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => [row.name, row.project, row.unit, row.owner, row.action].some((value) => value.toLocaleLowerCase().includes(needle)));
  }, [query, rows]);

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0] ?? localizedDetailPreview, [rows, selectedId, localizedDetailPreview]);

  useEffect(() => {
    if (!persistent || !selected.lead) {
      setWorkspace(null);
      return;
    }
    void commercialApi.leadWorkspace(selected.lead.id).then(setWorkspace).catch(() => setWorkspace(null));
  }, [persistent, selected.lead]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  function selectRow(id: string) {
    setSelectedId(id);
    setSelectedTab("activity");
    setView("record");
  }

  function moveNext() {
    if (!selected.lead) {
      setNotice(text(ar, "The opportunity is ready for the next stage.", "الفرصة جاهزة للانتقال إلى المرحلة التالية."));
      return;
    }
    const nextStatus = selected.lead.status === "NEW" ? "CONTACTED" : selected.lead.status === "CONTACTED" ? "QUALIFIED" : selected.lead.status === "QUALIFIED" ? "APPOINTMENT" : selected.lead.status === "APPOINTMENT" ? "NEGOTIATION" : "RESERVED";
    void commercialApi.advanceLead(selected.lead.id, nextStatus).then((lead) => {
      setRows((current) => current.map((row) => row.id === selected.id ? mapLead(lead, 0) : row));
      setNotice(text(ar, "The opportunity moved to the next stage.", "تم نقل الفرصة إلى المرحلة التالية."));
    }).catch(() => setNotice(text(ar, "The stage could not be updated.", "تعذر تحديث مرحلة الفرصة.")));
  }

  const detail = selected.lead ? selected : selected.id === localizedDetailPreview.id ? localizedDetailPreview : selected;
  const activities: Array<{ id: string; type: string; title: string; detail: string; date: string; time: string }> = workspace?.activities.length
    ? workspace.activities.map((item: SalesActivity) => ({ id: item.id, type: item.type, title: item.notes, detail: item.actor.displayName, date: item.createdAt.slice(0, 10), time: new Date(item.createdAt).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" }) }))
    : ar ? previewActivitiesAr : previewActivitiesEn;

  return (
    <main className="canonical-opportunity" dir={ar ? "rtl" : "ltr"} aria-label={text(ar, "Opportunities workspace", "مساحة عمل الفرص")}>
      {notice ? <div className="canonical-notice" role="status"><CheckCircle size={18} weight="fill" />{notice}<button type="button" onClick={() => setNotice("")}>{text(ar, "Dismiss", "إغلاق")}</button></div> : null}
      {view === "list" ? <section className="canonical-worklist-panel">
        <header className="canonical-page-header">
          <div>
            <p className="canonical-eyebrow">{text(ar, "Commercial operations center", "مركز العمليات التجارية")}</p>
            <h1>{text(ar, "My opportunities", "أعمالي")}</h1>
            <p>{text(ar, "Sales opportunities assigned to me", "فرص المبيعات التي أعمل عليها")}</p>
          </div>
          <button className="canonical-primary-action" type="button" onClick={() => setNotice(text(ar, "New opportunity capture is ready.", "نموذج إضافة فرصة جديد جاهز."))}><Plus size={20} weight="bold" />{text(ar, "Add opportunity", "إضافة فرصة")}</button>
        </header>
        <label className="canonical-search">
          <MagnifyingGlass size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(ar, "Search by customer, project or unit…", "ابحث عن عميل أو مشروع أو وحدة …")} />
        </label>
        <section className="canonical-kpis" aria-label={text(ar, "Opportunity KPIs", "مؤشرات الفرص")}>
          <div><Target size={22} /><strong>{persistent ? rows.length : 5}</strong><span>{text(ar, "Active opportunities", "فرص نشطة")}</span></div>
          <div><CalendarBlank size={22} /><strong>{persistent ? Math.min(rows.length, 3) : 3}</strong><span>{text(ar, "Action due soon", "مطلوبة إجراء قريب")}</span></div>
          <div><CurrencyCircleDollar size={22} /><strong>{persistent ? "—" : text(ar, "SAR 126M", "126 مليون ر.س")}</strong><span>{text(ar, "Pipeline value", "قيمة الفرص النشطة")}</span></div>
        </section>
        <div className="canonical-table-wrap" role="region" aria-label={text(ar, "My opportunities table", "جدول فرصي")}>
          <table className="canonical-table">
            <thead><tr><th>{text(ar, "Customer / opportunity", "العميل / الفرصة")}</th><th>{text(ar, "Project and unit", "المشروع و الوحدة")}</th><th>{text(ar, "Current stage", "المرحلة الحالية")}</th><th>{text(ar, "Next action", "الإجراء التالي")}</th><th>{text(ar, "Due date", "تاريخ الاستحقاق")}</th><th>{text(ar, "Owner", "المالك")}</th><th aria-label={text(ar, "Actions", "إجراءات")} /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="canonical-empty">{text(ar, "Loading opportunities…", "جارٍ تحميل الفرص…")}</td></tr> : null}
              {!loading && !filtered.length ? <tr><td colSpan={7} className="canonical-empty">{text(ar, "No opportunities match this search.", "لا توجد فرص مطابقة لهذا البحث.")}</td></tr> : null}
              {!loading && filtered.map((row) => <tr key={row.id} className={row.id === selected.id ? "is-selected" : ""} onClick={() => selectRow(row.id)}>
                <td><button type="button" className="canonical-row-link" onClick={() => selectRow(row.id)}><strong>{row.name}</strong><small>{text(ar, "Residential unit purchase opportunity", "فرصة شراء وحدة سكنية")}</small></button></td>
                <td><strong>{row.project}</strong><small>{row.unit}</small></td>
                <td><span className={`canonical-stage stage-${row.stage}`}>{stageLabels[row.stage][ar ? "ar" : "en"]}</span></td>
                <td>{row.action}</td>
                <td dir="ltr">{dateLabel(ar, row.due)}</td>
                <td>{row.owner}</td>
                <td><button className="canonical-more" type="button" aria-label={text(ar, "More actions", "إجراءات إضافية")} onClick={(event) => { event.stopPropagation(); setNotice(text(ar, "Opportunity actions are available from the record.", "إجراءات الفرصة متاحة من داخل الملف.")); }}><DotsThree size={20} /></button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section> : null}

      {view === "record" ? <section className="canonical-record-panel" aria-label={text(ar, "Selected opportunity", "الفرصة المحددة")}>
        <header className="canonical-record-header">
          <div className="canonical-record-heading"><button type="button" className="canonical-back" onClick={() => setView("list")}><ArrowRight size={18} />{text(ar, "Back to opportunities", "العودة إلى الفرص")}</button><span className="canonical-status"><span />{text(ar, "Active", "نشط")}</span><h2>{detail.name}</h2><p><MapPin size={16} />{detail.project}</p></div>
          <div className="canonical-record-meta"><span>{text(ar, "Opportunity no.", "رقم الفرصة")} <b>{detail.id}</b></span><span>{text(ar, "Created", "تاريخ الإنشاء")} <b>2026-08-24</b></span></div>
        </header>
        <section className="canonical-highlights">
          <div><CurrencyCircleDollar size={20} /><span>{text(ar, "Opportunity value", "قيمة الفرصة")}</span><strong>{detail.value}</strong></div>
          <div><Buildings size={20} /><span>{text(ar, "Sector", "القطاع")}</span><strong>{text(ar, "Residential", "سكني")}</strong></div>
          <div><UsersThree size={20} /><span>{text(ar, "Customer", "العميل")}</span><strong>{detail.unit}</strong></div>
          <div><MapPin size={20} /><span>{text(ar, "City", "المدينة")}</span><strong>{text(ar, "Riyadh", "الرياض")}</strong></div>
          <div><Target size={20} /><span>{text(ar, "Current stage", "المرحلة الحالية")}</span><strong>{stageLabels[detail.stage][ar ? "ar" : "en"]}</strong><small>{text(ar, "Step 3 of 6", "من أصل 6 مراحل")}</small></div>
        </section>
        <section className="canonical-stage-path" aria-label={text(ar, "Opportunity stages", "مراحل الفرصة")}>
          {(Object.keys(stageLabels) as StageKey[]).map((stage, index) => {
            const currentIndex = (Object.keys(stageLabels) as StageKey[]).indexOf(detail.stage);
            const done = index < currentIndex;
            const current = index === currentIndex;
            return <div className={`canonical-stage-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`} key={stage}><span>{done ? <Check size={15} weight="bold" /> : current ? String(index + 1).padStart(2, "0") : String(index + 1).padStart(2, "0")}</span><small>{stageLabels[stage][ar ? "ar" : "en"]}</small></div>;
          })}
        </section>
        <nav className="canonical-record-tabs" aria-label={text(ar, "Opportunity record tabs", "تبويبات ملف الفرصة")}>
          <button type="button" className={selectedTab === "activity" ? "is-active" : ""} onClick={() => setSelectedTab("activity")}>{text(ar, "Activity", "نشاطات")}</button>
          <button type="button" className={selectedTab === "details" ? "is-active" : ""} onClick={() => setSelectedTab("details")}>{text(ar, "Details", "التفاصيل")}</button>
          <button type="button" className={selectedTab === "notes" ? "is-active" : ""} onClick={() => setSelectedTab("notes")}>{text(ar, "Notes", "الملاحظات")}</button>
        </nav>
        {selectedTab === "activity" ? <div className="canonical-record-grid"><section className="canonical-activity-list"><header><div><h3>{text(ar, "Activity", "نشاطات")}</h3><p>{text(ar, "A log of all interactions and updates related to this opportunity.", "سجل جميع التحديثات والتفاعلات المتعلقة بهذه الفرصة.")}</p></div><button type="button" aria-label={text(ar, "Add activity", "إضافة نشاط")} onClick={() => setNotice(text(ar, "Activity composer is ready.", "نموذج إضافة النشاط جاهز."))}><Plus size={18} /></button></header><ol>{activities.map((item) => { const Icon = activityIcon(item.type); return <li key={item.id}><time dir="ltr"><b>{item.date}</b><span>{item.time}</span></time><span className="canonical-activity-icon"><Icon size={18} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div></li>; })}</ol><form className="canonical-activity-composer" onSubmit={(event) => { event.preventDefault(); setNotice(text(ar, "The note was added to the opportunity timeline.", "تمت إضافة الملاحظة إلى سجل الفرصة.")); event.currentTarget.reset(); }}><button type="button" aria-label={text(ar, "Attach file", "إرفاق ملف")}><FileText size={18} /></button><input placeholder={text(ar, "Add an update to this opportunity…", "أضف تحديثًا على هذه الفرصة …")} /><button type="submit" aria-label={text(ar, "Send update", "إرسال التحديث")}><ArrowUpRight size={18} /></button></form></section><aside className="canonical-next-action"><p className="canonical-eyebrow">{text(ar, "Next action", "الإجراء التالي")}</p><h3>{text(ar, "Keep the opportunity moving forward.", "الخطوة المطلوبة الآن لدفع الصفقة إلى الأمام.")}</h3><div className="canonical-due"><CalendarBlank size={19} /><span>{text(ar, "Due date", "تاريخ الاستحقاق")}<strong dir="ltr">{dateLabel(ar, detail.due)}</strong></span></div><h4>{detail.action}</h4><p>{text(ar, "Follow up with the customer to review the latest proposal and capture the decision path.", "التواصل مع العميل لمراجعة الملاحظات والقرار المطلوب على العرض الفني.")}</p><button className="canonical-primary-action" type="button" onClick={moveNext}>{text(ar, "Move to next stage", "الانتقال إلى المرحلة التالية")} {ar ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</button></aside></div> : null}
        {selectedTab === "details" ? <section className="canonical-detail-grid"><div><span>{text(ar, "Customer", "العميل")}</span><strong>{detail.unit}</strong></div><div><span>{text(ar, "Project", "المشروع")}</span><strong>{detail.project}</strong></div><div><span>{text(ar, "Owner", "المالك")}</span><strong>{detail.owner}</strong></div><div><span>{text(ar, "Source", "المصدر")}</span><strong>{detail.source ?? text(ar, "Direct entry", "إدخال مباشر")}</strong></div><div><span>{text(ar, "Expected value", "القيمة المتوقعة")}</span><strong>{detail.value}</strong></div><div><span>{text(ar, "Contact", "جهة الاتصال")}</span><strong>{detail.phone ?? "—"}</strong></div></section> : null}
        {selectedTab === "notes" ? <section className="canonical-notes-panel"><Note size={24} /><h3>{text(ar, "Opportunity notes", "ملاحظات الفرصة")}</h3><p>{text(ar, "Keep decision context, customer feedback, and exceptions here so the full team can move the opportunity forward with the same context.", "احتفظ بسياق القرار وملاحظات العميل والاستثناءات هنا حتى يعمل الفريق بالسياق نفسه.")}</p><button className="canonical-secondary-action" type="button" onClick={() => setNotice(text(ar, "Notes editor is ready.", "محرر الملاحظات جاهز."))}>{text(ar, "Add note", "إضافة ملاحظة")}</button></section> : null}
      </section> : null}
    </main>
  );
}
