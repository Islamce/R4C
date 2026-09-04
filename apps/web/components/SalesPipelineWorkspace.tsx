"use client";

import {
  AddressBook,
  Buildings,
  CalendarCheck,
  ChartBar,
  CheckCircle,
  Columns,
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
  SquaresFour,
  Sparkle,
  Target,
  UserSwitch,
  X,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { commercialApi, type ActivityType, type CommercialLead, type LeadWorkspace, type ProjectMediaAsset, type SalesActivity, type SalesAssignee, type SavedLeadView as SavedLeadViewRecord } from "../lib/commercial-api";
import { clientApi } from "../lib/client-api";

export type UnitReservationHandoff = {
  reference: string;
  customer: string;
  phone: string;
  project: string;
  unit: string;
};

type Stage = "lead" | "interest" | "hold" | "booking";
type WorkspaceView = "pipeline" | "media" | "tasks" | "performance";
type PipelineDisplay = "table" | "kanban" | "split";

type Customer = {
  id: string;
  customerId?: string;
  name: string;
  phone: string;
  project: string;
  unit: string;
  owner: string;
  source: string;
  stage: Stage;
  status?: CommercialLead["status"];
  lastContact: string;
  nextAction: string;
  value: string;
};

const text = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;
const englishValues: Record<string, string> = {
  "جميع المشروعات": "All projects", "مرتفعات الرياض": "Riyadh Heights", "مارينا جدة": "Jeddah Marina", "حدائق قرطبة": "Qurtubah Gardens", "واجهة الدمام": "Dammam Waterfront",
  "سعد محمد آل سعود": "Saad Mohammed Al Saud", "عبدالله العتيبي": "Abdullah Al Otaibi", "نورة القحطاني": "Noura Al Qahtani", "فيصل الغامدي": "Faisal Al Ghamdi", "لطيفة بنت خالد": "Latifa bint Khalid", "خالد الشهري": "Khalid Al Shehri", "مها العتيبي": "Maha Al Otaibi", "سارة بنت فيصل": "Sarah bint Faisal",
  "أحمد العتيبي": "Ahmed Al Otaibi", "ريم الحربي": "Reem Al Harbi", "ناصر المطيري": "Nasser Al Mutairi", "فريق المبيعات": "Sales team", "غير مسند": "Unassigned",
  "فريق سارة الدوسري": "Sarah Al Dosari team", "فريق خالد الشهري": "Khalid Al Shehri team", "سارة الدوسري": "Sarah Al Dosari", "مدير المبيعات": "Sales manager",
  "الموقع الإلكتروني": "Website", "إحالة عميل": "Customer referral", "معرض عقاري": "Property exhibition", "حملة رقمية": "Digital campaign", "وسيط عقاري": "Property broker", "إعلان جوجل": "Google Ads", "زيارة المكتب": "Office visit", "إدخال يدوي": "Manual entry", "حجز من مخطط الوحدات": "Unit-layout reservation",
  "اليوم، 10:12 ص": "Today, 10:12 AM", "اليوم، 09:40 ص": "Today, 9:40 AM", "أمس، 04:20 م": "Yesterday, 4:20 PM", "منذ يومين": "2 days ago", "منذ 3 أيام": "3 days ago", "منذ 4 أيام": "4 days ago", "منذ 5 أيام": "5 days ago", "منذ 6 أيام": "6 days ago", "الآن": "Now",
  "اتصال تأهيلي": "Qualification call", "إرسال عرض السعر": "Send quotation", "استكمال العربون": "Complete deposit", "زيارة الموقع": "Site visit", "إعداد العقد": "Prepare contract", "تأكيد الميزانية": "Confirm budget", "اعتماد مدير المبيعات": "Sales manager approval", "متابعة التمويل": "Financing follow-up", "متابعة الإجراء": "Follow up action", "اعتماد الحجز": "Approve reservation", "استكمال بيانات العميل": "Complete customer details",
  "غير محددة": "Not specified", "عميل جديد": "New customer",
  "الكتيب التعريفي للمشروع": "Project brochure", "صور الواجهات والمرافق": "Facade and amenity images", "مخططات الوحدات السكنية": "Residential unit plans", "عرض نمط الحياة البحري": "Waterfront lifestyle presentation", "حزمة صور المشروع": "Project image pack", "دليل المشروع والأسعار": "Project and pricing guide", "تصاميم الحملة الإعلانية": "Campaign designs",
  "كتيب PDF": "PDF brochure", "معرض صور": "Image gallery", "مخططات": "Plans", "عرض تقديمي": "Presentation", "تصاميم": "Designs", "البريد وواتساب": "Email and WhatsApp", "البريد والحملات": "Email and campaigns", "عروض العملاء": "Customer presentations", "البريد والاجتماعات": "Email and meetings", "الحملات الرقمية": "Digital campaigns", "البريد": "Email",
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
const stageForStatus = (status: CommercialLead["status"]): Stage => status === "RESERVED" || status === "WON" ? "booking" : status === "NEGOTIATION" || status === "APPOINTMENT" ? "hold" : status === "QUALIFIED" || status === "CONTACTED" ? "interest" : "lead";

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

export function SalesPipelineWorkspace({ externalReservation, ar, persistent = false, canManageMedia = false, canViewAllLeads = false }: { externalReservation?: UnitReservationHandoff | null; ar: boolean; persistent?: boolean; canManageMedia?: boolean; canViewAllLeads?: boolean }) {
  const [customers, setCustomers] = useState(seedCustomers);
  const [project, setProject] = useState("جميع المشروعات");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seedCustomers[1]!.id);
  const [notice, setNotice] = useState("");
  const [fullRecordOpen, setFullRecordOpen] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("pipeline");
  const [displayMode, setDisplayMode] = useState<PipelineDisplay>("split");
  const [savedView, setSavedView] = useState<string>("all");
  const [savedViews, setSavedViews] = useState<SavedLeadViewRecord[]>([]);
  const [viewName, setViewName] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<SalesActivity[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<LeadWorkspace | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("r4c:sales-worklist-display");
    if (stored === "table" || stored === "kanban" || stored === "split") setDisplayMode(stored);
    else if (window.matchMedia("(max-width: 720px)").matches) setDisplayMode("table");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("r4c:sales-worklist-display", displayMode);
  }, [displayMode]);

  useEffect(() => {
    if (!persistent) return;
    void commercialApi.savedLeadViews().then((views) => {
      setSavedViews(views);
      const defaultView = views.find((view) => view.isDefault);
      if (defaultView) applySavedView(defaultView);
    }).catch(() => undefined);
  // The initial fetch intentionally runs only when persistence becomes available.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistent]);

  useEffect(() => {
    if (!persistent) return;
    void commercialApi.leads(canViewAllLeads).then((page) => {
      const loaded = page.items.filter((lead) => lead.customer).map((lead) => ({
        id: lead.id,
        customerId: lead.customer!.id,
        name: `${lead.customer!.firstName}${lead.customer!.lastName ? ` ${lead.customer!.lastName}` : ""}`,
        phone: lead.customer!.phone,
        project: lead.project ? (arabicProjectNames[lead.project.name] ?? lead.project.name) : "غير محددة",
        unit: lead.unit?.code ?? "غير محددة",
        owner: lead.assignedTo.displayName,
        source: lead.source,
        stage: stageForStatus(lead.status),
        status: lead.status,
        lastContact: new Date(lead.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB"),
        nextAction: lead.status === "NEW" ? "اتصال تأهيلي" : lead.status === "QUALIFIED" ? "زيارة الموقع" : lead.status === "RESERVED" ? "إعداد العقد" : "متابعة الإجراء",
        value: "—",
      }));
      setCustomers(loaded);
      setSelectedId(loaded[0]?.id ?? "");
      setNotice("");
    }).catch((error) => onPersistentError(error));
  }, [persistent, ar, canViewAllLeads]);

  function onPersistentError(error: unknown) {
    setCustomers([]);
    setNotice(error instanceof Error ? error.message : text(ar, "Could not load the governed customer pipeline.", "تعذر تحميل مسار العملاء المحكوم."));
  }

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
    const preset = savedView.startsWith("custom:") ? "all" : savedView;
    const viewMatches = preset === "all"
      || (preset === "mine" && customer.owner !== "غير مسند")
      || (preset === "followup" && customer.stage !== "booking")
      || (preset === "expiring" && customer.stage === "hold")
      || (preset === "approval" && customer.nextAction.includes("اعتماد"));
    const needle = query.trim().toLocaleLowerCase("ar");
    const queryMatches = !needle || [customer.name, customer.phone, customer.unit, customer.id].some((value) => value.toLocaleLowerCase("ar").includes(needle));
    return projectMatches && stageMatches && viewMatches && queryMatches;
  }), [customers, project, query, savedView, stage]);

  const selected = customers.find((item) => item.id === selectedId) ?? customers[0] ?? { id: "", name: text(ar, "No customer selected", "لا يوجد عميل محدد"), phone: "—", project: "—", unit: "—", owner: "—", source: "—", stage: "lead" as Stage, lastContact: "—", nextAction: "—", value: "—" };

  useEffect(() => {
    if (!persistent || !selectedId) { setSelectedActivities([]); setSelectedWorkspace(null); return; }
    void commercialApi.leadWorkspace(selectedId).then((workspace) => { setSelectedWorkspace(workspace); setSelectedActivities(workspace.activities); }).catch(() => { setSelectedWorkspace(null); setSelectedActivities([]); });
  }, [persistent, selectedId]);

  function logQuickActivity(type: ActivityType, label: string) {
    if (!selected.id) return;
    if (!persistent) {
      setNotice(text(ar, `${label} was added to the customer timeline.`, `تمت إضافة ${label} إلى السجل الزمني للعميل.`));
      return;
    }
    void commercialApi.logActivity(selected.id, { type, notes: label }).then((activity) => {
      setSelectedActivities((current) => [...current, activity]);
      setSelectedWorkspace((current) => current ? { ...current, activities: [activity, ...current.activities] } : current);
      setNotice(text(ar, "The activity was recorded in the governed timeline.", "تم تسجيل النشاط في السجل الزمني المحكوم."));
    }).catch((error) => setNotice(error instanceof Error ? error.message : text(ar, "Could not record the activity.", "تعذر تسجيل النشاط.")));
  }

  function applySavedView(view: SavedLeadViewRecord) {
    setSavedView(`custom:${view.id}`);
    setDisplayMode(view.displayMode);
    setProject(view.filters.project ?? "جميع المشروعات");
    setStage((view.filters.stage as Stage | "all" | undefined) ?? "all");
    setQuery(view.filters.query ?? "");
  }

  function chooseSavedView(value: string) {
    setSavedView(value);
    if (!value.startsWith("custom:")) return;
    const view = savedViews.find((item) => item.id === value.slice(7));
    if (view) applySavedView(view);
  }

  function saveCurrentView() {
    const name = viewName.trim();
    if (!name) { setNotice(text(ar, "Enter a name for the view.", "أدخل اسمًا لطريقة العرض.")); return; }
    if (!persistent) { setNotice(text(ar, "Saved views are available in the signed-in workspace.", "طرق العرض المحفوظة متاحة داخل مساحة العمل المسجلة.")); return; }
    void commercialApi.createSavedLeadView({ name, displayMode, filters: { project, stage, query, preset: savedView }, columns: ["customer", "phone", "projectUnit", "owner", "status", "lastContact", "nextAction", "value"], sortBy: "updatedAt", sortDirection: "desc", isDefault: savedViews.length === 0 }).then((view) => {
      setSavedViews((current) => [...current, view]);
      setViewName("");
      applySavedView(view);
      setNotice(text(ar, `View “${view.name}” was saved.`, `تم حفظ طريقة العرض «${view.name}».`));
    }).catch((error) => setNotice(error instanceof Error ? error.message : text(ar, "Could not save the view.", "تعذر حفظ طريقة العرض.")));
  }

  function addLead() {
    if (persistent) {
      window.dispatchEvent(new CustomEvent("r4c:commercial-tab", { detail: "operations" }));
      setNotice(text(ar, "Opened governed sales operations to create the customer and lead.", "تم فتح عمليات المبيعات المحكومة لإنشاء العميل والفرصة."));
      return;
    }
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
    if (!selected) return;
    const currentStatus = selected.status ?? ({ lead: "NEW", interest: "QUALIFIED", hold: "NEGOTIATION", booking: "RESERVED" } as const)[selected.stage];
    const nextStatus = ({ NEW: "CONTACTED", CONTACTED: "QUALIFIED", QUALIFIED: "APPOINTMENT", APPOINTMENT: "NEGOTIATION" } as Partial<Record<CommercialLead["status"], CommercialLead["status"]>>)[currentStatus];
    if (!nextStatus) {
      setNotice("الحجز مؤكد بالفعل ولا توجد مرحلة لاحقة.");
      return;
    }
    const apply = (updatedStatus: CommercialLead["status"] = nextStatus) => {
      const nextStage = stageForStatus(updatedStatus);
      setCustomers((current) => current.map((customer) => customer.id === selected.id ? { ...customer, stage: nextStage, status: updatedStatus, lastContact: "الآن", nextAction: nextStage === "hold" ? "استكمال العربون" : "متابعة الإجراء" } : customer));
      setNotice(text(ar, `${selected.name} advanced and the latest status was updated.`, `تم تقدم ${selected.name} وتحديث آخر حالة.`));
    };
    if (persistent) {
      void commercialApi.advanceLead(selected.id, nextStatus).then((lead) => apply(lead.status)).catch((error) => setNotice(error instanceof Error ? error.message : text(ar, "Could not update the lead stage.", "تعذر تحديث مرحلة العميل.")));
    } else apply();
  }

  function moveCustomerToStage(customer: Customer, nextStage: Stage) {
    if (customer.stage === nextStage) return;
    if (stageOrder.indexOf(nextStage) < stageOrder.indexOf(customer.stage)) {
      setNotice(text(ar, "A lead cannot be moved backwards; use the governed correction or disqualification action.", "لا يمكن إعادة العميل إلى مرحلة سابقة؛ استخدم إجراء التصحيح أو الاستبعاد المحكوم."));
      return;
    }
    if (nextStage === "booking") {
      setSelectedId(customer.id);
      setNotice(text(ar, "A confirmed booking must be created through the governed hold and manager approval workflow.", "يجب إنشاء الحجز المؤكد من خلال الحجز المؤقت المحكوم واعتماد مدير المبيعات."));
      return;
    }
    const status = nextStage === "lead" ? "NEW" : nextStage === "interest"
      ? (customer.status === "NEW" ? "CONTACTED" : "QUALIFIED")
      : (customer.status === "QUALIFIED" ? "APPOINTMENT" : "NEGOTIATION");
    const apply = (updatedStatus: CommercialLead["status"] = status) => {
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, stage: stageForStatus(updatedStatus), status: updatedStatus, lastContact: "الآن", nextAction: nextStage === "interest" ? "زيارة الموقع" : nextStage === "hold" ? "استكمال العربون" : "اتصال تأهيلي" } : item));
      setSelectedId(customer.id);
      setNotice(text(ar, `${customer.name} moved to ${stageMeta(ar)[nextStage].label}.`, `تم نقل ${customer.name} إلى ${stageMeta(ar)[nextStage].label}.`));
    };
    if (persistent) void commercialApi.advanceLead(customer.id, status).then((lead) => apply(lead.status)).catch((error) => setNotice(error instanceof Error ? error.message : text(ar, "Could not update the stage.", "تعذر تحديث المرحلة.")));
    else apply();
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
        <div><UsersThree size={22} /><span>{text(ar, "Customers in pipeline", "عملاء في المسار")}</span><strong>{customers.length}</strong></div>
        <div><HandHeart size={22} /><span>{text(ar, "Active interests", "اهتمامات نشطة")}</span><strong>{customers.filter((item) => item.stage === "interest").length}</strong></div>
        <div><CalendarCheck size={22} /><span>{text(ar, "Temporary reservations", "حجوزات مؤقتة")}</span><strong>{customers.filter((item) => item.stage === "hold").length}</strong></div>
        <div><CheckCircle size={22} /><span>{text(ar, "Confirmed bookings", "حجوزات مؤكدة")}</span><strong>{customers.filter((item) => item.stage === "booking").length}</strong></div>
        <div><ClockCountdown size={22} /><span>{text(ar, "Overdue actions", "إجراءات متأخرة")}</span><strong className="warn">{persistent ? 0 : 12}</strong></div>
      </section>

      <section className="worklist-toolbar" aria-label={text(ar, "Sales worklist controls", "أدوات قائمة عمل المبيعات")}>
        <label>
          <span>{text(ar, "Saved view", "طريقة العرض المحفوظة")}</span>
          <select value={savedView} onChange={(event) => chooseSavedView(event.target.value)}>
            <option value="all">{text(ar, "All customers", "جميع العملاء")}</option>
            <option value="mine">{text(ar, "My customers", "عملائي")}</option>
            <option value="followup">{text(ar, "Needs follow-up", "بحاجة إلى متابعة")}</option>
            <option value="expiring">{text(ar, "Expiring reservations", "حجوزات تنتهي قريبًا")}</option>
            <option value="approval">{text(ar, "Awaiting approval", "بانتظار الموافقة")}</option>
            {savedViews.map((view) => <option key={view.id} value={`custom:${view.id}`}>{view.name}</option>)}
          </select>
        </label>
        <div className="display-mode-switcher" role="group" aria-label={text(ar, "Display mode", "نمط العرض")}>
          <button type="button" aria-pressed={displayMode === "table"} onClick={() => setDisplayMode("table")}><SelectionAll size={18} />{text(ar, "Table", "جدول")}</button>
          <button type="button" aria-pressed={displayMode === "kanban"} onClick={() => setDisplayMode("kanban")}><SquaresFour size={18} />{text(ar, "Kanban", "كانبان")}</button>
          <button type="button" aria-pressed={displayMode === "split"} onClick={() => setDisplayMode("split")}><Columns size={18} />{text(ar, "Split view", "عرض مقسّم")}</button>
        </div>
        <div className="save-view-control"><input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={text(ar, "Name this view", "اسم طريقة العرض")} /><button type="button" onClick={saveCurrentView}>{text(ar, "Save view", "حفظ العرض")}</button></div>
        <p><strong>{filtered.length}</strong> {text(ar, "records ready for action", "سجلًا جاهزًا للإجراء")}</p>
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

      {displayMode === "kanban" ? <section className="pipeline-stage-grid pipeline-kanban" aria-label={text(ar, "Sales pipeline stages", "مراحل مسار المبيعات")}>
        {stageOrder.map((item) => {
          const Icon = stageIcons[item];
          const records = filtered.filter((customer) => customer.stage === item);
          return (
            <article className={`pipeline-stage stage-${item}`} key={item} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const customer = customers.find((entry) => entry.id === event.dataTransfer.getData("text/r4c-customer")); if (customer) moveCustomerToStage(customer, item); }}>
              <header><Icon size={24} weight="duotone" /><div><h2>{stageMeta(ar)[item].label}</h2><span>{records.length} {text(ar, "records in view", "سجلات في العرض")}</span></div><strong>{customers.filter((customer) => customer.stage === item).length}</strong></header>
              <div className="stage-records">
                {records.map((customer) => <button draggable type="button" key={customer.id} className={selected.id === customer.id ? "selected" : ""} onDragStart={(event) => event.dataTransfer.setData("text/r4c-customer", customer.id)} onClick={() => setSelectedId(customer.id)}><span className="customer-initial">{displayValue(ar, customer.name).charAt(0)}</span><span><b>{displayValue(ar, customer.name)}</b><small>{customer.unit} · {displayValue(ar, customer.owner)}</small></span><time>{displayValue(ar, customer.lastContact)}</time></button>)}
                {!records.length ? <p className="stage-empty">{text(ar, "No records in this scope.", "لا توجد سجلات ضمن هذا النطاق.")}</p> : null}
              </div>
              <button className="stage-view-all" type="button" onClick={() => setStage(item)}>{text(ar, "View full list", "عرض القائمة كاملة")}</button>
            </article>
          );
        })}
      </section> : null}

      {displayMode !== "kanban" ? <section className={`customer-ledger-layout ${displayMode === "table" ? "table-only" : "split-view"}`}>
        <div className="customer-ledger">
          <header className="ledger-heading"><div><p>{text(ar, "All projects", "جميع المشروعات")}</p><h2>{text(ar, "Consolidated customer register", "السجل التراكمي للعملاء")}</h2></div><span><Funnel size={18} />{filtered.length} {text(ar, "results", "نتيجة")}</span></header>
          <div className="ledger-table" role="table" aria-label={text(ar, "Consolidated customer register", "السجل التراكمي للعملاء")}>
            <div className="ledger-row ledger-head" role="row"><span>{text(ar, "Customer", "العميل")}</span><span>{text(ar, "Mobile", "الجوال")}</span><span>{text(ar, "Project / unit", "المشروع / الوحدة")}</span><span>{text(ar, "Sales owner", "مسؤول المبيعات")}</span><span>{text(ar, "Latest status", "آخر حالة")}</span><span>{text(ar, "Last contact", "آخر تواصل")}</span><span>{text(ar, "Next action", "الإجراء التالي")}</span><span>{text(ar, "Expected value", "القيمة المتوقعة")}</span></div>
            {filtered.map((customer) => <button type="button" role="row" key={customer.id} className={`ledger-row ${selected.id === customer.id ? "selected" : ""}`} onClick={() => setSelectedId(customer.id)}><span><b>{displayValue(ar, customer.name)}</b><small>{customer.id} · {displayValue(ar, customer.source)}</small></span><span dir="ltr">{customer.phone}</span><span><b>{displayValue(ar, customer.project)}</b><small>{customer.unit}</small></span><span>{displayValue(ar, customer.owner)}</span><span><i className={`stage-pill stage-pill-${customer.stage}`}>{stageMeta(ar)[customer.stage].shortLabel}</i></span><span>{displayValue(ar, customer.lastContact)}</span><span>{displayValue(ar, customer.nextAction)}</span><span><b>{displayValue(ar, customer.value)}</b></span></button>)}
          </div>
        </div>

        {displayMode === "split" ? <aside className="customer-intelligence" aria-label={text(ar, "Selected customer details", "تفاصيل العميل المحدد")}>
          <header><span className="customer-avatar">{displayValue(ar, selected.name).charAt(0)}</span><div><small>{selected.id}</small><h2>{displayValue(ar, selected.name)}</h2><p dir="ltr">{selected.phone}</p></div></header>
          <div className="customer-status"><span>{text(ar, "Latest status", "آخر حالة")}</span><strong className={`stage-pill stage-pill-${selected.stage}`}>{stageMeta(ar)[selected.stage].shortLabel}</strong></div>
          <dl>
            <div><dt>{text(ar, "Project", "المشروع")}</dt><dd>{displayValue(ar, selected.project)}</dd></div><div><dt>{text(ar, "Unit", "الوحدة")}</dt><dd>{selected.unit}</dd></div><div><dt>{text(ar, "Source", "المصدر")}</dt><dd>{displayValue(ar, selected.source)}</dd></div><div><dt>{text(ar, "Sales owner", "مسؤول المبيعات")}</dt><dd>{displayValue(ar, selected.owner)}</dd></div><div><dt>{text(ar, "Next action", "الإجراء التالي")}</dt><dd>{displayValue(ar, selected.nextAction)}</dd></div><div><dt>{text(ar, "Expected value", "القيمة المتوقعة")}</dt><dd>{displayValue(ar, selected.value)}</dd></div>
          </dl>
          {selectedWorkspace ? <div className="related-record-strip" aria-label={text(ar, "Related records", "السجلات المرتبطة")}><span><b>{selectedWorkspace.tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED").length}</b>{text(ar, "Open tasks", "مهام مفتوحة")}</span><span><b>{selectedWorkspace.holds.filter((hold) => hold.status === "ACTIVE").length}</b>{text(ar, "Active holds", "حجوزات مؤقتة")}</span><span><b>{selectedWorkspace.reservations.length}</b>{text(ar, "Reservations", "حجوزات مؤكدة")}</span><span><b>{selectedWorkspace.transferCases.length}</b>{text(ar, "Transfer files", "ملفات إفراغ")}</span></div> : null}
          <div className="customer-quick-actions" aria-label={text(ar, "Customer quick actions", "إجراءات العميل السريعة")}>
            <button type="button" onClick={() => logQuickActivity("CALL", text(ar, "Follow-up call", "مكالمة متابعة"))}><Phone size={17} />{text(ar, "Call", "اتصال")}</button>
            <button type="button" onClick={() => logQuickActivity("WHATSAPP", text(ar, "WhatsApp follow-up", "متابعة واتساب"))}><PaperPlaneTilt size={17} />{text(ar, "WhatsApp", "واتساب")}</button>
            <button type="button" onClick={() => logQuickActivity("EMAIL", text(ar, "Customer email", "بريد للعميل"))}><EnvelopeSimple size={17} />{text(ar, "Email", "بريد")}</button>
            <button type="button" onClick={() => { setWorkspaceView("tasks"); setNotice(text(ar, "Create and assign the follow-up task.", "أنشئ مهمة المتابعة وقم بإسنادها.")); }}><CalendarCheck size={17} />{text(ar, "Task", "مهمة")}</button>
          </div>
          <section className="customer-timeline"><h3>{text(ar, "Recent interactions", "آخر التفاعلات")}</h3><ol>{selectedActivities.length ? selectedActivities.slice(-4).reverse().map((activity) => <li key={activity.id}><Phone size={16} /><span><b>{activity.notes}</b><small>{new Date(activity.createdAt).toLocaleString(ar ? "ar-SA" : "en-GB")}</small></span></li>) : <><li><Phone size={16} /><span><b>{text(ar, "Follow-up call", "مكالمة متابعة")}</b><small>{displayValue(ar, selected.lastContact)}</small></span></li><li><HandHeart size={16} /><span><b>{text(ar, "Unit interest recorded", "تسجيل اهتمام بالوحدة")}</b><small>{selected.unit}</small></span></li></>}</ol></section>
          <div className="customer-actions"><button className="button button-primary" type="button" onClick={advanceSelected}>{text(ar, "Move to next stage", "نقل إلى المرحلة التالية")}</button><button className="button button-secondary" type="button" onClick={() => setFullRecordOpen(true)}>{text(ar, "Open full record", "فتح الملف الكامل")}</button></div>
        </aside> : null}
      </section> : null}
      </> : null}
      {workspaceView === "media" ? <ProjectMediaRepository project={project} setProject={setProject} onNotice={setNotice} notice={notice} persistent={persistent} canManage={canManageMedia} ar={ar} /> : null}
      {workspaceView === "tasks" ? <SalesTeamTasks onNotice={setNotice} notice={notice} persistent={persistent} ar={ar} /> : null}
      {workspaceView === "performance" ? <SalesPerformanceDashboard ar={ar} /> : null}
      {fullRecordOpen ? (
        <div className="customer-file-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setFullRecordOpen(false);
        }}>
          <section className="customer-file-modal" role="dialog" aria-modal="true" aria-labelledby="customer-file-title">
            <header>
              <div className="customer-file-heading">
                <span><IdentificationCard size={26} weight="duotone" /></span>
                <div><small>{selected.id} · {text(ar, "Customer record", "ملف العميل")}</small><h2 id="customer-file-title">{displayValue(ar, selected.name)}</h2></div>
              </div>
              <button className="customer-file-close" type="button" aria-label={text(ar, "Close customer record", "إغلاق ملف العميل")} onClick={() => setFullRecordOpen(false)}><X size={22} /></button>
            </header>
            <div className="customer-file-grid">
              <article><Phone size={21} /><span>{text(ar, "Contact number", "رقم التواصل")}</span><strong dir="ltr">{selected.phone}</strong></article>
              <article><MapPin size={21} /><span>{text(ar, "Project and unit", "المشروع والوحدة")}</span><strong>{displayValue(ar, selected.project)} · {selected.unit}</strong></article>
              <article><UsersThree size={21} /><span>{text(ar, "Sales owner", "مسؤول المبيعات")}</span><strong>{displayValue(ar, selected.owner)}</strong></article>
              <article><Money size={21} /><span>{text(ar, "Expected value", "القيمة المتوقعة")}</span><strong>{displayValue(ar, selected.value)}</strong></article>
            </div>
            <div className="customer-file-body">
              <section>
                <h3>{text(ar, "Opportunity summary", "ملخص الفرصة")}</h3>
                <dl>
                  <div><dt>{text(ar, "Current status", "الحالة الحالية")}</dt><dd><i className={`stage-pill stage-pill-${selected.stage}`}>{stageMeta(ar)[selected.stage].shortLabel}</i></dd></div>
                  <div><dt>{text(ar, "Lead source", "مصدر العميل")}</dt><dd>{displayValue(ar, selected.source)}</dd></div>
                  <div><dt>{text(ar, "Last contact", "آخر تواصل")}</dt><dd>{displayValue(ar, selected.lastContact)}</dd></div>
                  <div><dt>{text(ar, "Next action", "الإجراء التالي")}</dt><dd>{displayValue(ar, selected.nextAction)}</dd></div>
                </dl>
              </section>
              <section className="customer-file-timeline">
                <h3>{text(ar, "Interaction timeline", "سجل التفاعلات")}</h3>
                <ol>{selectedActivities.length ? selectedActivities.map((activity) => <li key={activity.id}><Phone size={17} /><div><b>{activity.notes}</b><small>{activity.actor.displayName} · {new Date(activity.createdAt).toLocaleString(ar ? "ar-SA" : "en-GB")}</small></div></li>) : <><li><Phone size={17} /><div><b>{text(ar, "Follow-up call", "مكالمة متابعة")}</b><small>{displayValue(ar, selected.lastContact)}</small></div></li><li><HandHeart size={17} /><div><b>{text(ar, `Interest recorded for unit ${selected.unit}`, `تسجيل اهتمام بالوحدة ${selected.unit}`)}</b><small>{text(ar, "Interest linked to inventory", "تم ربط الاهتمام بالمخزون")}</small></div></li></>}</ol>
              </section>
            </div>
            <footer><button className="button button-secondary" type="button" onClick={() => setFullRecordOpen(false)}>{text(ar, "Close", "إغلاق")}</button><button className="button button-primary" type="button" onClick={() => { setFullRecordOpen(false); setWorkspaceView("tasks"); setNotice(text(ar, `Create and assign a follow-up for ${displayValue(ar, selected.name)}.`, `أنشئ متابعة لملف ${selected.name} وقم بإسنادها.`)); }}>{text(ar, "Create follow-up task", "إنشاء مهمة متابعة")}</button></footer>
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

function WorkspaceNotice({ notice, onClose, ar }: { notice: string; onClose: () => void; ar: boolean }) {
  return notice ? <div className="pipeline-notice" role="status"><CheckCircle size={20} weight="fill" />{notice}<button type="button" onClick={onClose}>{text(ar, "Close", "إغلاق")}</button></div> : null;
}

type MediaProject = { id: string; code: string; name: string };

function ProjectMediaRepository({ project, setProject, onNotice, notice, persistent, canManage, ar }: { project: string; setProject: (project: string) => void; onNotice: (notice: string) => void; notice: string; persistent: boolean; canManage: boolean; ar: boolean }) {
  const [selectedAsset, setSelectedAsset] = useState(mediaAssets[0]!.id);
  const [emailOpen, setEmailOpen] = useState(false);
  const [storedAssets, setStoredAssets] = useState<ProjectMediaAsset[]>([]);
  const [mediaProjects, setMediaProjects] = useState<MediaProject[]>([]);
  const [dispatchCustomers, setDispatchCustomers] = useState<CommercialLead[]>([]);
  const [uploading, setUploading] = useState(false);
  const activeProject = project === "جميع المشروعات" ? "مرتفعات الرياض" : project;
  const activeProjectRecord = mediaProjects.find((item) => item.name === activeProject || arabicProjectNames[item.name] === activeProject);
  const visibleAssets = persistent ? storedAssets.map((asset) => ({ id: asset.id, project: activeProject, name: asset.title, type: asset.mimeType.includes("pdf") ? "كتيب PDF" : asset.mimeType.includes("presentation") ? "عرض تقديمي" : "معرض صور", channel: "البريد والحملات", updated: new Date(asset.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB"), downloadUrl: asset.downloadUrl })) : mediaAssets.filter((asset) => asset.project === activeProject);
  const selected = visibleAssets.find((asset) => asset.id === selectedAsset) ?? visibleAssets[0];

  async function loadMedia(projectId: string) {
    try { const assets = await commercialApi.projectMedia(projectId); setStoredAssets(assets); setSelectedAsset(assets[0]?.id ?? ""); }
    catch (error) { onNotice(error instanceof Error ? error.message : text(ar, "Could not load project media.", "تعذر تحميل مواد المشروع.")); }
  }

  useEffect(() => {
    if (!persistent) return;
    void Promise.all([clientApi<MediaProject[]>("/api/projects"), commercialApi.leads(true)]).then(([projectRows, leads]) => {
      setMediaProjects(projectRows);
      setDispatchCustomers(leads.items.filter((lead) => lead.customer));
      const chosen = projectRows.find((item) => item.name === activeProject || arabicProjectNames[item.name] === activeProject) ?? projectRows[0];
      if (chosen) { setProject(arabicProjectNames[chosen.name] ?? chosen.name); void loadMedia(chosen.id); }
    }).catch(() => onNotice(text(ar, "Could not initialize the governed project library.", "تعذر تهيئة مكتبة المشروع المحكومة.")));
  }, [persistent]);

  useEffect(() => { if (persistent && activeProjectRecord) void loadMedia(activeProjectRecord.id); }, [activeProjectRecord?.id]);

  async function uploadMedia(file: File, title: string) {
    if (!activeProjectRecord) return;
    setUploading(true);
    try {
      const request = await commercialApi.requestProjectMediaUpload(activeProjectRecord.id, { title, fileName: file.name, mimeType: file.type, sizeBytes: file.size });
      const result = await fetch(request.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!result.ok) throw new Error(text(ar, "Storage rejected the upload.", "رفض مستودع الملفات عملية الرفع."));
      await commercialApi.confirmProjectMediaUpload(request.mediaId);
      await loadMedia(activeProjectRecord.id);
      onNotice(text(ar, "Project material uploaded and published to the governed library.", "تم رفع مادة المشروع ونشرها في المكتبة المحكومة."));
    } catch (error) { onNotice(error instanceof Error ? error.message : text(ar, "Upload failed.", "فشل الرفع.")); }
    finally { setUploading(false); }
  }
  return <section className="workspace-module media-repository" aria-label={text(ar, "Project promotional material library", "مكتبة المواد الدعائية للمشروع")}>
    <WorkspaceNotice notice={notice} onClose={() => onNotice("")} ar={ar} />
    <header className="module-heading"><div><p>{text(ar, "Project content center", "مركز محتوى المشروع")}</p><h2>{text(ar, "Promotional materials library", "مكتبة المواد الدعائية")}</h2><span>{text(ar, "A central repository for each project's images, brochures, plans, and designs.", "مستودع مركزي للصور والكتيبات والمخططات والتصاميم المرتبطة بكل مشروع.")}</span></div><label><span>{text(ar, "Project", "المشروع")}</span><select value={activeProject} onChange={(event) => setProject(event.target.value)}>{(persistent ? mediaProjects.map((item) => arabicProjectNames[item.name] ?? item.name) : projects.slice(1)).map((item) => <option key={item}>{item}</option>)}</select></label></header>
    {persistent && canManage ? <form className="media-upload-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = (form.elements.namedItem("mediaFile") as HTMLInputElement).files?.[0]; if (file) void uploadMedia(file, String(data.get("mediaTitle"))); }}><input name="mediaTitle" placeholder={text(ar, "Material title", "عنوان المادة")} required /><input name="mediaFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.pptx" required /><button className="button button-primary" disabled={uploading}>{uploading ? text(ar, "Uploading…", "جاري الرفع…") : text(ar, "Upload material", "رفع المادة")}</button></form> : null}
    <div className="media-layout">
      <div className="media-grid">{visibleAssets.map((asset) => <button type="button" className={selected?.id === asset.id ? "media-card selected" : "media-card"} key={asset.id} onClick={() => setSelectedAsset(asset.id)}><span className="media-card-icon">{asset.type === "معرض صور" ? <FileImage size={27} weight="duotone" /> : asset.type === "عرض تقديمي" ? <PresentationChart size={27} weight="duotone" /> : <SelectionAll size={27} weight="duotone" />}</span><small>{asset.id} · {displayValue(ar, asset.type)}</small><strong>{displayValue(ar, asset.name)}</strong><span>{displayValue(ar, asset.channel)}</span><time>{text(ar, `Updated ${asset.updated}`, `تحديث ${asset.updated}`)}</time></button>)}</div>
      <aside className="media-detail"><span className="media-preview"><Sparkle size={38} weight="duotone" /></span><small>{selected?.type}</small><h3>{selected?.name ?? text(ar, "No published materials", "لا توجد مواد منشورة")}</h3><p>{selected?.project}</p><dl><div><dt>{text(ar, "Usage channels", "قنوات الاستخدام")}</dt><dd>{selected?.channel}</dd></div><div><dt>{text(ar, "Last update", "آخر تحديث")}</dt><dd>{selected?.updated}</dd></div><div><dt>{text(ar, "Approval status", "حالة الاعتماد")}</dt><dd className="good">{text(ar, "Published", "معتمد للنشر")}</dd></div></dl><button disabled={!selected} className="button button-primary" type="button" onClick={() => setEmailOpen(true)}><EnvelopeSimple size={18} />{text(ar, "Send to customer", "إرسال للعميل")}</button><a className="button button-secondary" href={(selected as typeof selected & { downloadUrl?: string })?.downloadUrl ?? "#"} target="_blank" rel="noreferrer">{text(ar, "Preview / download", "معاينة / تنزيل")}</a></aside>
    </div>
    {emailOpen ? <form className="media-email-composer" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const customer = dispatchCustomers.find((lead) => lead.customerId === String(data.get("customerId"))); if (persistent && selected && activeProjectRecord && customer?.customer) { void commercialApi.createDispatch({ projectId: activeProjectRecord.id, customerId: customer.customer.id, recipientEmail: customer.customer.email, subject: String(data.get("subject")), message: String(data.get("message")), assetIds: [selected.id] }).then(() => { onNotice(text(ar, "The governed customer dispatch was queued.", "تمت إضافة الإرسال المحكوم للعميل إلى قائمة التنفيذ.")); setEmailOpen(false); }).catch((error) => onNotice(error instanceof Error ? error.message : text(ar, "Dispatch failed.", "فشل الإرسال."))); } else { onNotice(`تمت إضافة «${selected?.name}» إلى قائمة الإرسال.`); setEmailOpen(false); } }}><header><div><PaperPlaneTilt size={22} weight="duotone" /><h3>{text(ar, "Send promotional material", "إرسال مادة دعائية")}</h3></div><button type="button" aria-label={text(ar, "Close", "إغلاق")} onClick={() => setEmailOpen(false)}><X size={20} /></button></header>{persistent ? <label><span>{text(ar, "Customer", "العميل")}</span><select name="customerId" required>{dispatchCustomers.map((lead) => <option key={lead.id} value={lead.customerId ?? ""}>{lead.customer?.firstName} {lead.customer?.lastName} — {lead.customer?.email}</option>)}</select></label> : <label><span>{text(ar, "Customer email", "بريد العميل")}</span><input name="recipient" type="email" defaultValue="client@example.com" required /></label>}<label><span>{text(ar, "Subject", "عنوان الرسالة")}</span><input name="subject" defaultValue={`${text(ar, "Project materials", "مواد مشروع")} ${selected?.project}`} required /></label><label><span>{text(ar, "Message", "الرسالة")}</span><textarea name="message" defaultValue={text(ar, `Hello, please find ${selected?.name} attached for your review.`, `مرحباً، نرفق لكم ${selected?.name} للاطلاع. يسعدنا الإجابة عن استفساراتكم.`)} required /></label><div><span className="email-attachment"><FileImage size={17} />{selected?.name}</span><button className="button button-primary" type="submit">{text(ar, "Queue dispatch", "إضافة إلى قائمة الإرسال")}</button></div></form> : null}
  </section>;
}

type TeamTask = { id: string; title: string; assignee: string; manager: string; due: string; priority: string; status: string };
const initialTasks: TeamTask[] = [
  { id: "T-221", title: "متابعة تمويل نورة القحطاني", assignee: "ناصر المطيري", manager: "سارة الدوسري", due: "25 أغسطس", priority: "عالية", status: "قيد التنفيذ" },
  { id: "T-220", title: "إرسال عرض سعر A-1212", assignee: "ريم الحربي", manager: "سارة الدوسري", due: "اليوم", priority: "عاجلة", status: "متأخرة" },
  { id: "T-219", title: "تأكيد زيارة موقع مرتفعات الرياض", assignee: "أحمد العتيبي", manager: "خالد الشهري", due: "26 أغسطس", priority: "متوسطة", status: "جديدة" },
];

function SalesTeamTasks({ onNotice, notice, persistent, ar }: { onNotice: (notice: string) => void; notice: string; persistent: boolean; ar: boolean }) {
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
  return <section className="workspace-module team-tasks" aria-label={text(ar, "Sales team task assignment", "توزيع مهام فريق المبيعات")}>
    <WorkspaceNotice notice={notice} onClose={() => onNotice("")} ar={ar} />
    <header className="module-heading"><div><p>{text(ar, "Sales team control", "إدارة فريق المبيعات")}</p><h2>{text(ar, "Tasks and roles", "المهام والأدوار")}</h2><span>{text(ar, "Assign governed work to each sales manager's team.", "توزيع العمل وإسناده لأعضاء الفريق التابعين لكل مسؤول مبيعات.")}</span></div><div className="module-kpis"><span><b>3</b> {text(ar, "teams", "فرق")}</span><span><b>{tasks.length}</b> {text(ar, "active tasks", "مهام نشطة")}</span><span className="warn"><b>{tasks.filter((task) => task.status === "متأخرة").length}</b> {text(ar, "overdue", "متأخرة")}</span></div></header>
    <div className="task-layout"><form className="task-assignment" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const assigneeValue = String(data.get("assignee")); const assignee = persistent ? assignees.find((item) => item.id === assigneeValue)?.displayName ?? assigneeValue : assigneeValue; const priorityCode = String(data.get("priority")); const newTask = { id: `T-${222 + tasks.length}`, title: String(data.get("title")), assignee, manager: "مدير المبيعات", due: String(data.get("due")), priority: ({ URGENT: "عاجلة", HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" } as Record<string,string>)[priorityCode] ?? priorityCode, status: "جديدة" }; if (persistent) { void commercialApi.createTask({ title: newTask.title, assigneeId: assigneeValue, dueAt: new Date(`${newTask.due}T12:00:00+03:00`).toISOString(), priority: priorityCode }).then((saved) => { setTasks((current) => [{ ...newTask, id: saved.id, assignee: saved.assignee.displayName, manager: saved.createdBy.displayName }, ...current]); onNotice(text(ar, `Task assigned to ${saved.assignee.displayName}.`, `تم حفظ المهمة وإسنادها إلى ${saved.assignee.displayName}.`)); form.reset(); }).catch(() => onNotice(text(ar, "Could not save the task. Check permissions and data.", "تعذر حفظ المهمة. تحقق من الصلاحيات والبيانات."))); } else { setTasks((current) => [newTask, ...current]); onNotice(text(ar, `Task assigned to ${displayValue(ar, assignee)}.`, `تم إسناد المهمة إلى ${assignee} وإرسال تنبيه له.`)); form.reset(); } }}><h3><UserSwitch size={21} weight="duotone" />{text(ar, "Assign new task", "إسناد مهمة جديدة")}</h3><label><span>{text(ar, "Task title", "عنوان المهمة")}</span><input name="title" placeholder={text(ar, "Example: follow up quotation", "مثال: متابعة عرض السعر")} required /></label><label><span>{text(ar, "Team member", "عضو الفريق")}</span><select name="assignee">{persistent ? assignees.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>) : <><option value="reem">{text(ar, "Reem Al Harbi", "ريم الحربي")}</option><option value="nasser">{text(ar, "Nasser Al Mutairi", "ناصر المطيري")}</option><option value="ahmed">{text(ar, "Ahmed Al Otaibi", "أحمد العتيبي")}</option></>}</select></label><div><label><span>{text(ar, "Due date", "موعد الاستحقاق")}</span><input name="due" type="date" required /></label><label><span>{text(ar, "Priority", "الأولوية")}</span><select name="priority"><option value="URGENT">{text(ar, "Urgent", "عاجلة")}</option><option value="HIGH">{text(ar, "High", "عالية")}</option><option value="MEDIUM">{text(ar, "Medium", "متوسطة")}</option><option value="LOW">{text(ar, "Low", "منخفضة")}</option></select></label></div><button className="button button-primary" type="submit" disabled={persistent && assignees.length === 0}><Plus size={18} />{text(ar, "Assign and save", "إسناد وحفظ المهمة")}</button></form>
      <div className="task-board"><header><span>{text(ar, "Task", "المهمة")}</span><span>{text(ar, "Assignee", "المسند إليه")}</span><span>{text(ar, "Manager", "المسؤول")}</span><span>{text(ar, "Due", "الاستحقاق")}</span><span>{text(ar, "Priority", "الأولوية")}</span><span>{text(ar, "Status", "الحالة")}</span></header>{tasks.map((task) => <article key={task.id}><span><b>{displayValue(ar, task.title)}</b><small>{task.id}</small></span><strong>{displayValue(ar, task.assignee)}</strong><span>{displayValue(ar, task.manager)}</span><time>{displayValue(ar, task.due)}</time><i className={`priority-${task.priority}`}>{ar ? task.priority : ({ "عاجلة": "Urgent", "عالية": "High", "متوسطة": "Medium", "منخفضة": "Low" } as Record<string,string>)[task.priority] ?? task.priority}</i><button type="button" onClick={() => { const close = () => { setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "مكتملة" } : item)); onNotice(text(ar, `Task ${task.id} was completed.`, `تم إغلاق المهمة ${task.id} وتحديث تقييم ${task.assignee}.`)); }; if (persistent) void commercialApi.updateTask(task.id, { status: "COMPLETED" }).then(close).catch(() => onNotice(text(ar, "Could not complete the saved task.", "تعذر إغلاق المهمة المحفوظة."))); else close(); }}>{ar ? task.status : ({ "جديدة": "Open", "قيد التنفيذ": "In progress", "مكتملة": "Completed", "ملغاة": "Cancelled", "متأخرة": "Overdue" } as Record<string,string>)[task.status] ?? task.status}</button></article>)}</div></div>
  </section>;
}

const salesPerformance = [
  { name: "ريم الحربي", team: "فريق سارة الدوسري", leads: 48, response: "8 د", conversion: 31, bookings: 15, value: "24.8M", score: 92 },
  { name: "ناصر المطيري", team: "فريق سارة الدوسري", leads: 42, response: "11 د", conversion: 29, bookings: 12, value: "21.4M", score: 88 },
  { name: "أحمد العتيبي", team: "فريق خالد الشهري", leads: 51, response: "19 د", conversion: 24, bookings: 12, value: "19.7M", score: 81 },
  { name: "مها القحطاني", team: "فريق خالد الشهري", leads: 39, response: "34 د", conversion: 18, bookings: 7, value: "12.1M", score: 69 },
];

function SalesPerformanceDashboard({ ar }: { ar: boolean }) {
  return <section className="workspace-module performance-dashboard" aria-label={text(ar, "Sales performance and alerts", "تقييم مسؤولي المبيعات والتنبيهات")}>
    <header className="module-heading"><div><p>{text(ar, "Performance and alerts", "الأداء والتنبيهات")}</p><h2>{text(ar, "Sales representative scorecard", "تقييم مسؤولي المبيعات")}</h2><span>{text(ar, "Response, conversion, reservations, achieved value, and operational alerts.", "قياس الاستجابة والتحويل والحجوزات والقيمة المحققة مع تنبيهات تشغيلية مباشرة.")}</span></div><label><span>{text(ar, "Period", "الفترة")}</span><select defaultValue="month"><option value="month">{text(ar, "This month", "هذا الشهر")}</option><option value="quarter">{text(ar, "Current quarter", "الربع الحالي")}</option><option value="year">{text(ar, "This year", "هذا العام")}</option></select></label></header>
    <section className="alert-strip"><article><Notification size={23} weight="duotone" /><div><strong>{text(ar, "5 customers have had no follow-up for more than 48 hours", "5 عملاء دون متابعة لأكثر من 48 ساعة")}</strong><span>{text(ar, "Reassignment or manager intervention is required.", "تحتاج إلى إعادة توزيع أو تدخل مسؤول الفريق.")}</span></div><b>{text(ar, "Urgent", "عاجل")}</b></article><article><ClockCountdown size={23} weight="duotone" /><div><strong>{text(ar, "3 tasks are past due", "3 مهام تجاوزت موعد الاستحقاق")}</strong><span>{text(ar, "Linked to two sales teams.", "مرتبطة بفريقين من فرق المبيعات.")}</span></div><b>{text(ar, "Follow up", "متابعة")}</b></article><article><Target size={23} weight="duotone" /><div><strong>{text(ar, "Reem Al Harbi exceeded the conversion target", "ريم الحربي تجاوزت هدف التحويل")}</strong><span>{text(ar, "31% against a monthly target of 25%.", "31% مقابل هدف شهري 25%.")}</span></div><b className="good">{text(ar, "Positive", "إيجابي")}</b></article></section>
    <section className="performance-kpis"><article><UsersThree size={22} /><span>{text(ar, "Average customers per owner", "متوسط العملاء لكل مسؤول")}</span><strong>45</strong></article><article><ClockCountdown size={22} /><span>{text(ar, "Average response time", "متوسط زمن الاستجابة")}</span><strong>{text(ar, "18 minutes", "18 دقيقة")}</strong></article><article><Target size={22} /><span>{text(ar, "Conversion rate", "معدل التحويل")}</span><strong>25.5%</strong></article><article><Money size={22} /><span>{text(ar, "Reservation value", "قيمة الحجوزات")}</span><strong>{text(ar, "SAR 78.0M", "78.0 مليون ر.س")}</strong></article></section>
    <div className="performance-table"><header><span>{text(ar, "Sales owner", "مسؤول المبيعات")}</span><span>{text(ar, "Customers", "العملاء")}</span><span>{text(ar, "Response", "الاستجابة")}</span><span>{text(ar, "Conversion", "التحويل")}</span><span>{text(ar, "Reservations", "الحجوزات")}</span><span>{text(ar, "Value", "القيمة")}</span><span>{text(ar, "Score", "التقييم")}</span></header>{salesPerformance.map((rep, index) => <article key={rep.name}><span><b>{index + 1}</b><span><strong>{displayValue(ar, rep.name)}</strong><small>{displayValue(ar, rep.team)}</small></span></span><span>{rep.leads}</span><span>{ar ? rep.response : rep.response.replace(" د", " min")}</span><span>{rep.conversion}%</span><span>{rep.bookings}</span><span>{text(ar, `SAR ${rep.value}`, `${rep.value.replace("M", " مليون")} ر.س`)}</span><span className="score-cell"><i style={{ width: `${rep.score}%` }} /><strong>{rep.score}</strong></span></article>)}</div>
  </section>;
}
