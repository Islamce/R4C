"use client";

import {
  AddressBook,
  Buildings,
  CalendarCheck,
  ChartBar,
  CheckCircle,
  ClockCountdown,
  EnvelopeSimple,
  FileImage,
  FolderOpen,
  Funnel,
  HandHeart,
  IdentificationCard,
  MagnifyingGlass,
  MapPin,
  Money,
  Notification,
  PaperPlaneTilt,
  Phone,
  Plus,
  PresentationChart,
  SelectionAll,
  Sparkle,
  Target,
  UserSwitch,
  X,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { commercialApi, type SalesAssignee } from "../lib/commercial-api";

export type UnitReservationHandoff = {
  reference: string;
  customer: string;
  phone: string;
  project: string;
  unit: string;
};

type Stage = "lead" | "interest" | "hold" | "booking";
type WorkspaceView = "pipeline" | "media" | "tasks" | "performance";

type Customer = {
  id: string;
  name: string;
  phone: string;
  project: string;
  unit: string;
  owner: string;
  source: string;
  stage: Stage;
  lastContact: string;
  nextAction: string;
  value: string;
};

const text = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;
const englishValues: Record<string, string> = {
  "جميع المشروعات": "All projects", "مرتفعات الرياض": "Riyadh Heights", "مارينا جدة": "Jeddah Marina", "حدائق قرطبة": "Qurtubah Gardens", "واجهة الدمام": "Dammam Waterfront",
  "سعد محمد آل سعود": "Saad Mohammed Al Saud", "عبدالله العتيبي": "Abdullah Al Otaibi", "نورة القحطاني": "Noura Al Qahtani", "فيصل الغامدي": "Faisal Al Ghamdi", "لطيفة بنت خالد": "Latifa bint Khalid", "خالد الشهري": "Khalid Al Shehri", "مها العتيبي": "Maha Al Otaibi", "سارة بنت فيصل": "Sarah bint Faisal",
  "أحمد العتيبي": "Ahmed Al Otaibi", "ريم الحربي": "Reem Al Harbi", "ناصر المطيري": "Nasser Al Mutairi", "فريق المبيعات": "Sales team", "غير مسند": "Unassigned",
  "الموقع الإلكتروني": "Website", "إحالة عميل": "Customer referral", "معرض عقاري": "Property exhibition", "حملة رقمية": "Digital campaign", "وسيط عقاري": "Property broker", "إعلان جوجل": "Google Ads", "زيارة المكتب": "Office visit", "إدخال يدوي": "Manual entry", "حجز من مخطط الوحدات": "Unit-layout reservation",
  "اليوم، 10:12 ص": "Today, 10:12 AM", "اليوم، 09:40 ص": "Today, 9:40 AM", "أمس، 04:20 م": "Yesterday, 4:20 PM", "منذ يومين": "2 days ago", "منذ 3 أيام": "3 days ago", "منذ 4 أيام": "4 days ago", "منذ 5 أيام": "5 days ago", "منذ 6 أيام": "6 days ago", "الآن": "Now",
  "اتصال تأهيلي": "Qualification call", "إرسال عرض السعر": "Send quotation", "استكمال العربون": "Complete deposit", "زيارة الموقع": "Site visit", "إعداد العقد": "Prepare contract", "تأكيد الميزانية": "Confirm budget", "اعتماد مدير المبيعات": "Sales manager approval", "متابعة التمويل": "Financing follow-up", "متابعة الإجراء": "Follow up action", "اعتماد الحجز": "Approve reservation", "استكمال بيانات العميل": "Complete customer details",
  "غير محددة": "Not specified", "عميل جديد": "New customer",
};
const displayValue = (ar: boolean, value: string) => ar ? value : (englishValues[value] ?? value.replace("ر.س", "SAR"));
const arabicProjectNames: Record<string, string> = {
  "Riyadh Heights": "مرتفعات الرياض",
  "Jeddah Marina": "مارينا جدة",
  "Qurtubah Gardens": "حدائق قرطبة",
  "Dammam Waterfront": "واجهة الدمام",
};
const canonicalProjectName = (value: string) => arabicProjectNames[value] ?? value;
const stageMeta = (ar: boolean): Record<Stage, { label: string; shortLabel: string }> => ({
  lead: { label: text(ar, "Leads", "العملاء المحتملون"), shortLabel: text(ar, "Lead", "عميل محتمل") },
  interest: { label: text(ar, "Interests", "الاهتمامات"), shortLabel: text(ar, "Interest", "اهتمام") },
  hold: { label: text(ar, "Temporary reservations", "الحجوزات المؤقتة"), shortLabel: text(ar, "Temporary reservation", "حجز مؤقت") },
  booking: { label: text(ar, "Confirmed bookings", "الحجوزات المؤكدة"), shortLabel: text(ar, "Confirmed booking", "حجز مؤكد") },
});

const seedCustomers: Customer[] = [
  { id: "C-1032", name: "سعد محمد آل سعود", phone: "+966 55 123 4567", project: "مرتفعات الرياض", unit: "A-1101", owner: "أحمد العتيبي", source: "الموقع الإلكتروني", stage: "lead", lastContact: "اليوم، 10:12 ص", nextAction: "اتصال تأهيلي", value: "1,620,000 ر.س" },
  { id: "C-1031", name: "عبدالله العتيبي", phone: "+966 54 987 6543", project: "مرتفعات الرياض", unit: "A-1212", owner: "ريم الحربي", source: "إحالة عميل", stage: "interest", lastContact: "اليوم، 09:40 ص", nextAction: "إرسال عرض السعر", value: "1,980,000 ر.س" },
  { id: "C-1030", name: "نورة القحطاني", phone: "+966 50 345 6789", project: "مارينا جدة", unit: "JM-B-0911", owner: "ناصر المطيري", source: "معرض عقاري", stage: "hold", lastContact: "أمس، 04:20 م", nextAction: "استكمال العربون", value: "1,850,000 ر.س" },
  { id: "C-1029", name: "فيصل الغامدي", phone: "+966 54 112 9988", project: "مرتفعات الرياض", unit: "A-1008", owner: "أحمد العتيبي", source: "حملة رقمية", stage: "interest", lastContact: "منذ يومين", nextAction: "زيارة الموقع", value: "1,540,000 ر.س" },
  { id: "C-1028", name: "لطيفة بنت خالد", phone: "+966 56 122 7890", project: "مارينا جدة", unit: "JM-A-0706", owner: "ناصر المطيري", source: "وسيط عقاري", stage: "booking", lastContact: "منذ 3 أيام", nextAction: "إعداد العقد", value: "2,280,000 ر.س" },
  { id: "C-1027", name: "خالد الشهري", phone: "+966 56 111 2233", project: "حدائق قرطبة", unit: "QG-D-0308", owner: "ريم الحربي", source: "إعلان جوجل", stage: "lead", lastContact: "منذ 4 أيام", nextAction: "تأكيد الميزانية", value: "1,620,000 ر.س" },
  { id: "C-1026", name: "مها العتيبي", phone: "+966 50 776 6554", project: "واجهة الدمام", unit: "DV-A-0506", owner: "ريم الحربي", source: "زيارة المكتب", stage: "hold", lastContact: "منذ 5 أيام", nextAction: "اعتماد مدير المبيعات", value: "1,740,000 ر.س" },
  { id: "C-1025", name: "سارة بنت فيصل", phone: "+966 55 987 6540", project: "مارينا جدة", unit: "JM-B-0911", owner: "ناصر المطيري", source: "إحالة عميل", stage: "booking", lastContact: "منذ 6 أيام", nextAction: "متابعة التمويل", value: "1,890,000 ر.س" },
];

const projects = ["جميع المشروعات", "مرتفعات الرياض", "مارينا جدة", "حدائق قرطبة", "واجهة الدمام"];

const stageOrder: Stage[] = ["lead", "interest", "hold", "booking"];
const stageIcons = { lead: UserPlus, interest: HandHeart, hold: CalendarCheck, booking: CheckCircle };

export function SalesPipelineWorkspace({ externalReservation, ar, persistent = false }: { externalReservation?: UnitReservationHandoff | null; ar: boolean; persistent?: boolean }) {
  const [customers, setCustomers] = useState(seedCustomers);
  const [project, setProject] = useState("جميع المشروعات");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seedCustomers[1]!.id);
  const [notice, setNotice] = useState("");
  const [fullRecordOpen, setFullRecordOpen] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("pipeline");

  useEffect(() => {
    if (!externalReservation) return;
    setCustomers((current) => current.some((item) => item.id === externalReservation.reference) ? current : [{
      id: externalReservation.reference,
      name: externalReservation.customer,
      phone: externalReservation.phone,
      project: canonicalProjectName(externalReservation.project),
      unit: externalReservation.unit,
      owner: "فريق المبيعات",
      source: "حجز من مخطط الوحدات",
      stage: "hold",
      lastContact: "الآن",
      nextAction: "اعتماد الحجز",
      value: "50,000 ر.س",
    }, ...current]);
    setSelectedId(externalReservation.reference);
    setNotice(`تمت مزامنة الحجز ${externalReservation.reference} من مخطط الوحدات إلى سجل العملاء.`);
  }, [externalReservation]);

  const filtered = useMemo(() => customers.filter((customer) => {
    const projectMatches = project === "جميع المشروعات" || customer.project === project;
    const stageMatches = stage === "all" || customer.stage === stage;
    const needle = query.trim().toLocaleLowerCase("ar");
    const queryMatches = !needle || [customer.name, customer.phone, customer.unit, customer.id].some((value) => value.toLocaleLowerCase("ar").includes(needle));
    return projectMatches && stageMatches && queryMatches;
  }), [customers, project, query, stage]);

  const selected = customers.find((item) => item.id === selectedId) ?? customers[0]!;

  function addLead() {
    const newLead: Customer = {
      id: `C-${1040 + customers.length}`,
      name: "عميل جديد",
      phone: "+966 5X XXX XXXX",
      project: project === "جميع المشروعات" ? "مرتفعات الرياض" : project,
      unit: "غير محددة",
      owner: "غير مسند",
      source: "إدخال يدوي",
      stage: "lead",
      lastContact: "الآن",
      nextAction: "استكمال بيانات العميل",
      value: "—",
    };
    setCustomers((current) => [newLead, ...current]);
    setSelectedId(newLead.id);
    setNotice("تمت إضافة العميل المحتمل إلى قائمة المشروع والسجل التراكمي.");
  }

  function advanceSelected() {
    const currentIndex = stageOrder.indexOf(selected.stage);
    if (currentIndex === stageOrder.length - 1) {
      setNotice("الحجز مؤكد بالفعل ولا توجد مرحلة لاحقة.");
      return;
    }
    const nextStage = stageOrder[currentIndex + 1]!;
    setCustomers((current) => current.map((customer) => customer.id === selected.id ? { ...customer, stage: nextStage, lastContact: "الآن", nextAction: nextStage === "booking" ? "إعداد العقد" : "متابعة الإجراء" } : customer));
      setNotice(text(ar, `${selected.name} moved to “${stageMeta(ar)[nextStage].label}” and the latest status was updated.`, `تم نقل ${selected.name} إلى مرحلة «${stageMeta(ar)[nextStage].label}» وتحديث آخر حالة.`));
  }

  return (
    <main className="kynox-pipeline" aria-label={text(ar, "Sales operations workspace", "مساحة تشغيل المبيعات")} dir={ar ? "rtl" : "ltr"}>
      <section className="pipeline-commandbar">
        <div className="pipeline-title">
          <span className="kynox-section-mark"><Buildings size={22} weight="duotone" /></span>
          <div><p>{text(ar, "KYNOX PORTFOLIO · COMMERCIAL", "محفظة KYNOX · القطاع التجاري")}</p><h1>{text(ar, "Sales pipeline", "مسار المبيعات")}</h1></div>
        </div>
        <label className="pipeline-search">
          <MagnifyingGlass size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(ar, "Search by customer, mobile, or unit", "ابحث باسم العميل أو الجوال أو الوحدة")} />
        </label>
        <div className="pipeline-actions">
          <button className="button button-secondary" type="button" onClick={() => setNotice(text(ar, "A new contact was added to the customer timeline.", "تم تسجيل تواصل جديد في سجل العميل الزمني."))}><Phone size={19} />{text(ar, "Log contact", "تسجيل تواصل")}</button>
          <button className="button button-primary" type="button" onClick={addLead}><Plus size={19} weight="bold" />{text(ar, "Add lead", "إضافة عميل محتمل")}</button>
        </div>
      </section>

      <nav className="sales-workspace-switcher" aria-label={text(ar, "Sales workspaces", "مساحات تشغيل المبيعات")}>
        {([
          ["pipeline", UsersThree, text(ar, "Customer pipeline", "مسار العملاء")],
          ["media", FolderOpen, text(ar, "Project library", "مكتبة المشروع")],
          ["tasks", UserSwitch, text(ar, "Tasks & team", "المهام والفريق")],
          ["performance", PresentationChart, text(ar, "Performance & alerts", "الأداء والتنبيهات")],
        ] as const).map(([id, Icon, label]) => <button key={id} type="button" aria-selected={workspaceView === id} onClick={() => setWorkspaceView(id)}><Icon size={19} weight="duotone" />{label}</button>)}
      </nav>

      {workspaceView === "pipeline" ? <>
      {notice ? <div className="pipeline-notice" role="status"><CheckCircle size={20} weight="fill" />{notice}<button type="button" onClick={() => setNotice("")}>{text(ar, "Close", "إغلاق")}</button></div> : null}

      <section className="portfolio-strip" aria-label={text(ar, "Portfolio metrics", "مؤشرات المحفظة")}>
        <div><UsersThree size={22} /><span>{text(ar, "Customers in pipeline", "عملاء في المسار")}</span><strong>320</strong></div>
        <div><HandHeart size={22} /><span>{text(ar, "Active interests", "اهتمامات نشطة")}</span><strong>182</strong></div>
        <div><CalendarCheck size={22} /><span>{text(ar, "Temporary reservations", "حجوزات مؤقتة")}</span><strong>46</strong></div>
        <div><CheckCircle size={22} /><span>{text(ar, "Confirmed bookings", "حجوزات مؤكدة")}</span><strong>78</strong></div>
        <div><ClockCountdown size={22} /><span>{text(ar, "Overdue actions", "إجراءات متأخرة")}</span><strong className="warn">12</strong></div>
      </section>

      <section className="project-context-bar">
        <div className="project-filter-block">
          <label htmlFor="pipeline-project">{text(ar, "View scope", "نطاق العرض")}</label>
          <select id="pipeline-project" value={project} onChange={(event) => setProject(event.target.value)}>{projects.map((item) => <option key={item} value={item}>{displayValue(ar, item)}</option>)}</select>
        </div>
        <div className="project-stage-links" aria-label={text(ar, "Project lists", "قوائم المشروع")}>
          <button className={stage === "all" ? "active" : ""} type="button" onClick={() => setStage("all")}><AddressBook size={18} />{text(ar, "All customers", "كل العملاء")}<b>{customers.length}</b></button>
          {stageOrder.map((item) => {
            const Icon = stageIcons[item];
            const count = customers.filter((customer) => (project === "جميع المشروعات" || customer.project === project) && customer.stage === item).length;
            return <button className={stage === item ? "active" : ""} type="button" key={item} onClick={() => setStage(item)}><Icon size={18} />{stageMeta(ar)[item].label}<b>{count}</b></button>;
          })}
        </div>
      </section>

      <section className="pipeline-stage-grid" aria-label={text(ar, "Sales pipeline stages", "مراحل مسار المبيعات")}>
        {stageOrder.map((item) => {
          const Icon = stageIcons[item];
          const records = customers.filter((customer) => (project === "جميع المشروعات" || customer.project === project) && customer.stage === item).slice(0, 3);
          return (
            <article className={`pipeline-stage stage-${item}`} key={item}>
              <header><Icon size={24} weight="duotone" /><div><h2>{stageMeta(ar)[item].label}</h2><span>{records.length} {text(ar, "records in view", "سجلات في العرض")}</span></div><strong>{customers.filter((customer) => customer.stage === item).length}</strong></header>
              <div className="stage-records">
                {records.map((customer) => <button type="button" key={customer.id} className={selected.id === customer.id ? "selected" : ""} onClick={() => setSelectedId(customer.id)}><span className="customer-initial">{displayValue(ar, customer.name).charAt(0)}</span><span><b>{displayValue(ar, customer.name)}</b><small>{customer.unit} · {displayValue(ar, customer.owner)}</small></span><time>{displayValue(ar, customer.lastContact)}</time></button>)}
                {!records.length ? <p className="stage-empty">{text(ar, "No records in this scope.", "لا توجد سجلات ضمن هذا النطاق.")}</p> : null}
              </div>
              <button className="stage-view-all" type="button" onClick={() => setStage(item)}>{text(ar, "View full list", "عرض القائمة كاملة")}</button>
            </article>
          );
        })}
      </section>

      <section className="customer-ledger-layout">
        <div className="customer-ledger">
          <header className="ledger-heading"><div><p>{text(ar, "All projects", "جميع المشروعات")}</p><h2>{text(ar, "Consolidated customer register", "السجل التراكمي للعملاء")}</h2></div><span><Funnel size={18} />{filtered.length} {text(ar, "results", "نتيجة")}</span></header>
          <div className="ledger-table" role="table" aria-label={text(ar, "Consolidated customer register", "السجل التراكمي للعملاء")}>
            <div className="ledger-row ledger-head" role="row"><span>{text(ar, "Customer", "العميل")}</span><span>{text(ar, "Mobile", "الجوال")}</span><span>{text(ar, "Project / unit", "المشروع / الوحدة")}</span><span>{text(ar, "Sales owner", "مسؤول المبيعات")}</span><span>{text(ar, "Latest status", "آخر حالة")}</span><span>{text(ar, "Last contact", "آخر تواصل")}</span><span>{text(ar, "Next action", "الإجراء التالي")}</span><span>{text(ar, "Expected value", "القيمة المتوقعة")}</span></div>
            {filtered.map((customer) => <button type="button" role="row" key={customer.id} className={`ledger-row ${selected.id === customer.id ? "selected" : ""}`} onClick={() => setSelectedId(customer.id)}><span><b>{displayValue(ar, customer.name)}</b><small>{customer.id} · {displayValue(ar, customer.source)}</small></span><span dir="ltr">{customer.phone}</span><span><b>{displayValue(ar, customer.project)}</b><small>{customer.unit}</small></span><span>{displayValue(ar, customer.owner)}</span><span><i className={`stage-pill stage-pill-${customer.stage}`}>{stageMeta(ar)[customer.stage].shortLabel}</i></span><span>{displayValue(ar, customer.lastContact)}</span><span>{displayValue(ar, customer.nextAction)}</span><span><b>{displayValue(ar, customer.value)}</b></span></button>)}
          </div>
        </div>

        <aside className="customer-intelligence" aria-label={text(ar, "Selected customer details", "تفاصيل العميل المحدد")}>
          <header><span className="customer-avatar">{displayValue(ar, selected.name).charAt(0)}</span><div><small>{selected.id}</small><h2>{displayValue(ar, selected.name)}</h2><p dir="ltr">{selected.phone}</p></div></header>
          <div className="customer-status"><span>{text(ar, "Latest status", "آخر حالة")}</span><strong className={`stage-pill stage-pill-${selected.stage}`}>{stageMeta(ar)[selected.stage].shortLabel}</strong></div>
          <dl>
            <div><dt>{text(ar, "Project", "المشروع")}</dt><dd>{displayValue(ar, selected.project)}</dd></div><div><dt>{text(ar, "Unit", "الوحدة")}</dt><dd>{selected.unit}</dd></div><div><dt>{text(ar, "Source", "المصدر")}</dt><dd>{displayValue(ar, selected.source)}</dd></div><div><dt>{text(ar, "Sales owner", "مسؤول المبيعات")}</dt><dd>{displayValue(ar, selected.owner)}</dd></div><div><dt>{text(ar, "Next action", "الإجراء التالي")}</dt><dd>{displayValue(ar, selected.nextAction)}</dd></div><div><dt>{text(ar, "Expected value", "القيمة المتوقعة")}</dt><dd>{displayValue(ar, selected.value)}</dd></div>
          </dl>
          <section className="customer-timeline"><h3>{text(ar, "Recent interactions", "آخر التفاعلات")}</h3><ol><li><Phone size={16} /><span><b>{text(ar, "Follow-up call", "مكالمة متابعة")}</b><small>{displayValue(ar, selected.lastContact)}</small></span></li><li><HandHeart size={16} /><span><b>{text(ar, "Unit interest recorded", "تسجيل اهتمام بالوحدة")}</b><small>{selected.unit}</small></span></li><li><Buildings size={16} /><span><b>{text(ar, "Added to project list", "إضافة إلى قائمة المشروع")}</b><small>{displayValue(ar, selected.project)}</small></span></li></ol></section>
          <div className="customer-actions"><button className="button button-primary" type="button" onClick={advanceSelected}>{text(ar, "Move to next stage", "نقل إلى المرحلة التالية")}</button><button className="button button-secondary" type="button" onClick={() => setFullRecordOpen(true)}>{text(ar, "Open full record", "فتح الملف الكامل")}</button></div>
        </aside>
      </section>
      </> : null}
      {workspaceView === "media" ? <ProjectMediaRepository project={project} setProject={setProject} onNotice={setNotice} notice={notice} /> : null}
      {workspaceView === "tasks" ? <SalesTeamTasks onNotice={setNotice} notice={notice} persistent={persistent} /> : null}
      {workspaceView === "performance" ? <SalesPerformanceDashboard /> : null}
      {fullRecordOpen ? (
        <div className="customer-file-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setFullRecordOpen(false);
        }}>
          <section className="customer-file-modal" role="dialog" aria-modal="true" aria-labelledby="customer-file-title">
            <header>
              <div className="customer-file-heading">
                <span><IdentificationCard size={26} weight="duotone" /></span>
                <div><small>{selected.id} · ملف العميل</small><h2 id="customer-file-title">{selected.name}</h2></div>
              </div>
              <button className="customer-file-close" type="button" aria-label="إغلاق ملف العميل" onClick={() => setFullRecordOpen(false)}><X size={22} /></button>
            </header>
            <div className="customer-file-grid">
              <article><Phone size={21} /><span>رقم التواصل</span><strong dir="ltr">{selected.phone}</strong></article>
              <article><MapPin size={21} /><span>المشروع والوحدة</span><strong>{selected.project} · {selected.unit}</strong></article>
              <article><UsersThree size={21} /><span>مسؤول المبيعات</span><strong>{selected.owner}</strong></article>
              <article><Money size={21} /><span>القيمة المتوقعة</span><strong>{selected.value}</strong></article>
            </div>
            <div className="customer-file-body">
              <section>
                <h3>ملخص الفرصة</h3>
                <dl>
                  <div><dt>{text(ar, "Current status", "الحالة الحالية")}</dt><dd><i className={`stage-pill stage-pill-${selected.stage}`}>{stageMeta(ar)[selected.stage].shortLabel}</i></dd></div>
                  <div><dt>مصدر العميل</dt><dd>{selected.source}</dd></div>
                  <div><dt>آخر تواصل</dt><dd>{selected.lastContact}</dd></div>
                  <div><dt>الإجراء التالي</dt><dd>{selected.nextAction}</dd></div>
                </dl>
              </section>
              <section className="customer-file-timeline">
                <h3>سجل التفاعلات</h3>
                <ol><li><Phone size={17} /><div><b>مكالمة متابعة</b><small>{selected.lastContact}</small></div></li><li><HandHeart size={17} /><div><b>تسجيل اهتمام بالوحدة {selected.unit}</b><small>تم ربط الاهتمام بالمخزون</small></div></li><li><Buildings size={17} /><div><b>إضافة إلى مشروع {selected.project}</b><small>المصدر: {selected.source}</small></div></li></ol>
              </section>
            </div>
            <footer><button className="button button-secondary" type="button" onClick={() => setFullRecordOpen(false)}>إغلاق</button><button className="button button-primary" type="button" onClick={() => { setFullRecordOpen(false); setNotice(`تم تجهيز متابعة ملف ${selected.name} وإسنادها إلى ${selected.owner}.`); }}>إنشاء مهمة متابعة</button></footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}

const mediaAssets = [
  { id: "M-101", project: "مرتفعات الرياض", name: "الكتيب التعريفي للمشروع", type: "كتيب PDF", channel: "البريد وواتساب", updated: "اليوم" },
  { id: "M-102", project: "مرتفعات الرياض", name: "صور الواجهات والمرافق", type: "معرض صور", channel: "البريد والحملات", updated: "أمس" },
  { id: "M-103", project: "مرتفعات الرياض", name: "مخططات الوحدات السكنية", type: "مخططات", channel: "عروض العملاء", updated: "منذ يومين" },
  { id: "M-201", project: "مارينا جدة", name: "عرض نمط الحياة البحري", type: "عرض تقديمي", channel: "البريد والاجتماعات", updated: "اليوم" },
  { id: "M-202", project: "مارينا جدة", name: "حزمة صور المشروع", type: "معرض صور", channel: "الحملات الرقمية", updated: "منذ 3 أيام" },
  { id: "M-301", project: "حدائق قرطبة", name: "دليل المشروع والأسعار", type: "كتيب PDF", channel: "البريد", updated: "منذ 4 أيام" },
  { id: "M-401", project: "واجهة الدمام", name: "تصاميم الحملة الإعلانية", type: "تصاميم", channel: "الحملات الرقمية", updated: "أمس" },
];

function WorkspaceNotice({ notice, onClose }: { notice: string; onClose: () => void }) {
  return notice ? <div className="pipeline-notice" role="status"><CheckCircle size={20} weight="fill" />{notice}<button type="button" onClick={onClose}>إغلاق</button></div> : null;
}

function ProjectMediaRepository({ project, setProject, onNotice, notice }: { project: string; setProject: (project: string) => void; onNotice: (notice: string) => void; notice: string }) {
  const [selectedAsset, setSelectedAsset] = useState(mediaAssets[0]!.id);
  const [emailOpen, setEmailOpen] = useState(false);
  const activeProject = project === "جميع المشروعات" ? "مرتفعات الرياض" : project;
  const visibleAssets = mediaAssets.filter((asset) => asset.project === activeProject);
  const selected = mediaAssets.find((asset) => asset.id === selectedAsset) ?? visibleAssets[0]!;
  return <section className="workspace-module media-repository" aria-label="مكتبة المواد الدعائية للمشروع">
    <WorkspaceNotice notice={notice} onClose={() => onNotice("")} />
    <header className="module-heading"><div><p>مركز محتوى المشروع</p><h2>مكتبة المواد الدعائية</h2><span>مستودع مركزي للصور والكتيبات والمخططات والتصاميم المرتبطة بكل مشروع.</span></div><label><span>المشروع</span><select value={activeProject} onChange={(event) => setProject(event.target.value)}>{projects.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label></header>
    <div className="media-layout">
      <div className="media-grid">{visibleAssets.map((asset) => <button type="button" className={selected?.id === asset.id ? "media-card selected" : "media-card"} key={asset.id} onClick={() => setSelectedAsset(asset.id)}><span className="media-card-icon">{asset.type === "معرض صور" ? <FileImage size={27} weight="duotone" /> : asset.type === "عرض تقديمي" ? <PresentationChart size={27} weight="duotone" /> : <SelectionAll size={27} weight="duotone" />}</span><small>{asset.id} · {asset.type}</small><strong>{asset.name}</strong><span>{asset.channel}</span><time>تحديث {asset.updated}</time></button>)}</div>
      <aside className="media-detail"><span className="media-preview"><Sparkle size={38} weight="duotone" /></span><small>{selected?.type}</small><h3>{selected?.name}</h3><p>{selected?.project}</p><dl><div><dt>قنوات الاستخدام</dt><dd>{selected?.channel}</dd></div><div><dt>آخر تحديث</dt><dd>{selected?.updated}</dd></div><div><dt>حالة الاعتماد</dt><dd className="good">معتمد للنشر</dd></div></dl><button className="button button-primary" type="button" onClick={() => setEmailOpen(true)}><EnvelopeSimple size={18} />إرسال للعميل</button><button className="button button-secondary" type="button" onClick={() => onNotice(`تم فتح معاينة «${selected?.name}».`)}>معاينة المادة</button></aside>
    </div>
    {emailOpen ? <form className="media-email-composer" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onNotice(`تمت إضافة «${selected?.name}» إلى رسالة ${String(data.get("recipient"))} ووضعها في قائمة الإرسال.`); setEmailOpen(false); }}><header><div><PaperPlaneTilt size={22} weight="duotone" /><h3>إرسال مادة دعائية</h3></div><button type="button" aria-label="إغلاق" onClick={() => setEmailOpen(false)}><X size={20} /></button></header><label><span>بريد العميل</span><input name="recipient" type="email" defaultValue="client@example.com" required /></label><label><span>عنوان الرسالة</span><input name="subject" defaultValue={`مواد مشروع ${selected?.project}`} required /></label><label><span>الرسالة</span><textarea name="message" defaultValue={`مرحباً، نرفق لكم ${selected?.name} للاطلاع. يسعدنا الإجابة عن استفساراتكم.`} required /></label><div><span className="email-attachment"><FileImage size={17} />{selected?.name}</span><button className="button button-primary" type="submit">إضافة إلى قائمة الإرسال</button></div></form> : null}
  </section>;
}

type TeamTask = { id: string; title: string; assignee: string; manager: string; due: string; priority: string; status: string };
const initialTasks: TeamTask[] = [
  { id: "T-221", title: "متابعة تمويل نورة القحطاني", assignee: "ناصر المطيري", manager: "سارة الدوسري", due: "25 أغسطس", priority: "عالية", status: "قيد التنفيذ" },
  { id: "T-220", title: "إرسال عرض سعر A-1212", assignee: "ريم الحربي", manager: "سارة الدوسري", due: "اليوم", priority: "عاجلة", status: "متأخرة" },
  { id: "T-219", title: "تأكيد زيارة موقع مرتفعات الرياض", assignee: "أحمد العتيبي", manager: "خالد الشهري", due: "26 أغسطس", priority: "متوسطة", status: "جديدة" },
];

function SalesTeamTasks({ onNotice, notice, persistent }: { onNotice: (notice: string) => void; notice: string; persistent: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [assignees, setAssignees] = useState<SalesAssignee[]>([]);
  useEffect(() => {
    if (!persistent) return;
    void commercialApi.tasks().then((storedTasks) => {
      setTasks(storedTasks.map((task) => ({ id: task.id, title: task.title, assignee: task.assignee.displayName, manager: task.createdBy.displayName, due: new Date(task.dueAt).toLocaleDateString("ar-SA"), priority: ({ LOW: "منخفضة", MEDIUM: "متوسطة", HIGH: "عالية", URGENT: "عاجلة" } as const)[task.priority], status: ({ OPEN: "جديدة", IN_PROGRESS: "قيد التنفيذ", COMPLETED: "مكتملة", CANCELLED: "ملغاة" } as const)[task.status] })));
    }).catch(() => onNotice("تعذر تحميل المهام المحفوظة. تحقق من الصلاحيات والاتصال."));
    // Sales agents may view their assigned tasks but cannot enumerate or manage the team.
    void commercialApi.assignees().then(setAssignees).catch(() => setAssignees([]));
  }, [onNotice, persistent]);
  return <section className="workspace-module team-tasks" aria-label="توزيع مهام فريق المبيعات">
    <WorkspaceNotice notice={notice} onClose={() => onNotice("")} />
    <header className="module-heading"><div><p>إدارة فريق المبيعات</p><h2>المهام والأدوار</h2><span>توزيع العمل وإسناده لأعضاء الفريق التابعين لكل مسؤول مبيعات.</span></div><div className="module-kpis"><span><b>3</b> فرق</span><span><b>{tasks.length}</b> مهام نشطة</span><span className="warn"><b>{tasks.filter((task) => task.status === "متأخرة").length}</b> متأخرة</span></div></header>
    <div className="task-layout"><form className="task-assignment" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const assigneeValue = String(data.get("assignee")); const assignee = persistent ? assignees.find((item) => item.id === assigneeValue)?.displayName ?? assigneeValue : assigneeValue; const newTask = { id: `T-${222 + tasks.length}`, title: String(data.get("title")), assignee, manager: "مدير المبيعات", due: String(data.get("due")), priority: String(data.get("priority")), status: "جديدة" }; if (persistent) { const priority = ({ "عاجلة": "URGENT", "عالية": "HIGH", "متوسطة": "MEDIUM", "منخفضة": "LOW" } as const)[newTask.priority as "عاجلة" | "عالية" | "متوسطة" | "منخفضة"]; void commercialApi.createTask({ title: newTask.title, assigneeId: assigneeValue, dueAt: new Date(`${newTask.due}T12:00:00+03:00`).toISOString(), priority }).then((saved) => { setTasks((current) => [{ ...newTask, id: saved.id, assignee: saved.assignee.displayName, manager: saved.createdBy.displayName }, ...current]); onNotice(`تم حفظ المهمة وإسنادها إلى ${saved.assignee.displayName}.`); form.reset(); }).catch(() => onNotice("تعذر حفظ المهمة. تحقق من الصلاحيات والبيانات.")); } else { setTasks((current) => [newTask, ...current]); onNotice(`تم إسناد المهمة إلى ${assignee} وإرسال تنبيه له.`); form.reset(); } }}><h3><UserSwitch size={21} weight="duotone" />إسناد مهمة جديدة</h3><label><span>عنوان المهمة</span><input name="title" placeholder="مثال: متابعة عرض السعر" required /></label><label><span>عضو الفريق</span><select name="assignee">{persistent ? assignees.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>) : <><option>ريم الحربي</option><option>ناصر المطيري</option><option>أحمد العتيبي</option><option>مها القحطاني</option></>}</select></label><div><label><span>موعد الاستحقاق</span><input name="due" type="date" required /></label><label><span>الأولوية</span><select name="priority"><option>عاجلة</option><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></label></div><button className="button button-primary" type="submit" disabled={persistent && assignees.length === 0}><Plus size={18} />إسناد وحفظ المهمة</button></form>
      <div className="task-board"><header><span>المهمة</span><span>المسند إليه</span><span>المسؤول</span><span>الاستحقاق</span><span>الأولوية</span><span>الحالة</span></header>{tasks.map((task) => <article key={task.id}><span><b>{task.title}</b><small>{task.id}</small></span><strong>{task.assignee}</strong><span>{task.manager}</span><time>{task.due}</time><i className={`priority-${task.priority}`}>{task.priority}</i><button type="button" onClick={() => { const close = () => { setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "مكتملة" } : item)); onNotice(`تم إغلاق المهمة ${task.id} وتحديث تقييم ${task.assignee}.`); }; if (persistent) void commercialApi.updateTask(task.id, { status: "COMPLETED" }).then(close).catch(() => onNotice("تعذر إغلاق المهمة المحفوظة.")); else close(); }}>{task.status}</button></article>)}</div></div>
  </section>;
}

const salesPerformance = [
  { name: "ريم الحربي", team: "فريق سارة الدوسري", leads: 48, response: "8 د", conversion: 31, bookings: 15, value: "24.8M", score: 92 },
  { name: "ناصر المطيري", team: "فريق سارة الدوسري", leads: 42, response: "11 د", conversion: 29, bookings: 12, value: "21.4M", score: 88 },
  { name: "أحمد العتيبي", team: "فريق خالد الشهري", leads: 51, response: "19 د", conversion: 24, bookings: 12, value: "19.7M", score: 81 },
  { name: "مها القحطاني", team: "فريق خالد الشهري", leads: 39, response: "34 د", conversion: 18, bookings: 7, value: "12.1M", score: 69 },
];

function SalesPerformanceDashboard() {
  return <section className="workspace-module performance-dashboard" aria-label="تقييم مسؤولي المبيعات والتنبيهات">
    <header className="module-heading"><div><p>الأداء والتنبيهات</p><h2>تقييم مسؤولي المبيعات</h2><span>قياس الاستجابة والتحويل والحجوزات والقيمة المحققة مع تنبيهات تشغيلية مباشرة.</span></div><label><span>الفترة</span><select defaultValue="هذا الشهر"><option>هذا الشهر</option><option>الربع الحالي</option><option>هذا العام</option></select></label></header>
    <section className="alert-strip"><article><Notification size={23} weight="duotone" /><div><strong>5 عملاء دون متابعة لأكثر من 48 ساعة</strong><span>تحتاج إلى إعادة توزيع أو تدخل مسؤول الفريق.</span></div><b>عاجل</b></article><article><ClockCountdown size={23} weight="duotone" /><div><strong>3 مهام تجاوزت موعد الاستحقاق</strong><span>مرتبطة بفريقي سارة الدوسري وخالد الشهري.</span></div><b>متابعة</b></article><article><Target size={23} weight="duotone" /><div><strong>ريم الحربي تجاوزت هدف التحويل</strong><span>31% مقابل هدف شهري 25%.</span></div><b className="good">إيجابي</b></article></section>
    <section className="performance-kpis"><article><UsersThree size={22} /><span>متوسط العملاء لكل مسؤول</span><strong>45</strong></article><article><ClockCountdown size={22} /><span>متوسط زمن الاستجابة</span><strong>18 دقيقة</strong></article><article><Target size={22} /><span>معدل التحويل</span><strong>25.5%</strong></article><article><Money size={22} /><span>قيمة الحجوزات</span><strong>78.0 مليون ر.س</strong></article></section>
    <div className="performance-table"><header><span>مسؤول المبيعات</span><span>العملاء</span><span>الاستجابة</span><span>التحويل</span><span>الحجوزات</span><span>القيمة</span><span>التقييم</span></header>{salesPerformance.map((rep, index) => <article key={rep.name}><span><b>{index + 1}</b><span><strong>{rep.name}</strong><small>{rep.team}</small></span></span><span>{rep.leads}</span><span>{rep.response}</span><span>{rep.conversion}%</span><span>{rep.bookings}</span><span>{rep.value.replace("M", " مليون")} ر.س</span><span className="score-cell"><i style={{ width: `${rep.score}%` }} /><strong>{rep.score}</strong></span></article>)}</div>
  </section>;
}
