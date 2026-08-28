"use client";

import { useEffect, useMemo, useState } from "react";
import { Cube, Eye, FileArrowUp, ImageSquare, PlugsConnected, ShieldCheck, UploadSimple, X } from "@phosphor-icons/react";
import { CommercialOperatorWorkspace } from "./CommercialOperatorWorkspace";
import { CommercialHero3D } from "./CommercialHero3D";
import { useI18n } from "./I18nProvider";
import { SalesPipelineWorkspace, type UnitReservationHandoff } from "./SalesPipelineWorkspace";
import { clientApi } from "../lib/client-api";
import { commercialApi, type TransferCase, type TransferDocument } from "../lib/commercial-api";
import type { BrowserSessionUser } from "../lib/types";

const localize = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;
const projectDisplayName = (ar: boolean, name: string) => ({
  "Riyadh Heights": localize(ar, "Riyadh Heights", "مرتفعات الرياض"),
  "Jeddah Marina": localize(ar, "Jeddah Marina", "مارينا جدة"),
  "Al Khobar Residences": localize(ar, "Al Khobar Residences", "مساكن الخبر"),
  "Qurtubah Gardens": localize(ar, "Qurtubah Gardens", "حدائق قرطبة"),
  "Dammam View": localize(ar, "Dammam View", "واجهة الدمام"),
}[name] ?? name);
const cityDisplayName = (ar: boolean, city: string) => ({
  Riyadh: localize(ar, "Riyadh", "الرياض"),
  Jeddah: localize(ar, "Jeddah", "جدة"),
  "Al Khobar": localize(ar, "Al Khobar", "الخبر"),
  Dammam: localize(ar, "Dammam", "الدمام"),
}[city] ?? city);
const unitStatusLabel = (ar: boolean, status: string) => ({
  Available: localize(ar, "Available", "متاحة"),
  Reserved: localize(ar, "Reserved", "محجوزة"),
  Sold: localize(ar, "Sold", "مباعة"),
  Interest: localize(ar, "Interest", "مسجل عليها اهتمام"),
  Held: localize(ar, "Held", "حجز مؤقت"),
}[status] ?? status);
const unitTypeLabel = (ar: boolean, type: string) => ({
  Studio: localize(ar, "Studio", "استوديو"),
  "1BR": localize(ar, "1 bedroom", "غرفة واحدة"),
  "2BR": localize(ar, "2 bedrooms", "غرفتان"),
  "3BR": localize(ar, "3 bedrooms", "ثلاث غرف"),
}[type] ?? type);
const buyerDisplayName = (ar: boolean, name: string) => ({
  "Ahmed Al Harbi": localize(ar, "Ahmed Al Harbi", "أحمد الحربي"),
  "Noura Al Qahtani": localize(ar, "Noura Al Qahtani", "نورة القحطاني"),
  "Faisal Al Dosari": localize(ar, "Faisal Al Dosari", "فيصل الدوسري"),
  "Maha Al Otaibi": localize(ar, "Maha Al Otaibi", "مها العتيبي"),
  "Sara Al Mutairi": localize(ar, "Sara Al Mutairi", "سارة المطيري"),
}[name] ?? name);
const transferStatusLabel = (ar: boolean, status: string) => ({
  "Not submitted": localize(ar, "Not submitted", "لم يُرسل"),
  Approved: localize(ar, "Approved", "معتمد"),
  "In review": localize(ar, "In review", "قيد المراجعة"),
  Ready: localize(ar, "Ready", "جاهز"),
  DOCUMENTS_PENDING: localize(ar, "Documents pending", "بانتظار المستندات"),
  UNDER_REVIEW: localize(ar, "Under review", "قيد المراجعة"),
  APPROVED: localize(ar, "Approved", "معتمد"),
  READY_FOR_AUTHORITY: localize(ar, "Ready for authority", "جاهز للجهة المعتمدة"),
  COMPLETED: localize(ar, "Completed", "مكتمل"),
  RETURNED: localize(ar, "Returned for correction", "معاد للتصحيح"),
}[status] ?? status);
const transferBlockerLabel = (ar: boolean, blocker: string) => ({
  "Mortgagee approval": localize(ar, "Mortgagee approval", "موافقة الجهة المرتهنة"),
  "RETT tax reference": localize(ar, "RETT tax reference", "مرجع ضريبة التصرفات العقارية"),
  "Buyer IBAN": localize(ar, "Buyer IBAN", "رقم آيبان المشتري"),
  SELLER_ID: localize(ar, "Seller identity", "هوية البائع"),
  BUYER_ID: localize(ar, "Buyer identity", "هوية المشتري"),
  TITLE_DEED: localize(ar, "Title deed", "الصك العقاري"),
  BENEFICIARY_IBAN: localize(ar, "Beneficiary IBAN", "آيبان المستفيد"),
  RETT_REFERENCE: localize(ar, "RETT reference", "مرجع ضريبة التصرفات العقارية"),
  MORTGAGEE_APPROVAL: localize(ar, "Mortgagee approval", "موافقة الجهة المرتهنة"),
  SIGNED_CONTRACT: localize(ar, "Signed contract", "عقد البيع الموقّع"),
  EVIDENCE: localize(ar, "Evidence attachments", "مرفقات الإثبات"),
  "—": "—",
}[blocker] ?? blocker);
const inventoryValueLabel = (ar: boolean, value: string) => localize(ar, `SAR ${value}`, `${value.replace(/M$/, " مليون")} ر.س`);

type Tab = "pipeline" | "portfolio" | "units" | "transfer" | "operations";
type ProjectAssets = {
  modelUrl?: string;
  modelName?: string;
  galleryUrl?: string;
  galleryName?: string;
};
type ProjectDashboardRecord = {
  name: string;
  city: string;
  phase: string;
  progress: number;
  units: number;
  available: number;
  pending: number;
  sold: number;
  leads: number;
  value: string;
};
type UnitDashboardRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const projects: ProjectDashboardRecord[] = [
  {
    name: "Riyadh Heights",
    city: "Riyadh",
    phase: "Structure",
    progress: 62,
    units: 320,
    available: 78,
    pending: 46,
    sold: 196,
    leads: 52,
    value: "412.6M",
  },
  {
    name: "Jeddah Marina",
    city: "Jeddah",
    phase: "Finishing",
    progress: 48,
    units: 240,
    available: 64,
    pending: 28,
    sold: 148,
    leads: 34,
    value: "365.2M",
  },
  {
    name: "Al Khobar Residences",
    city: "Al Khobar",
    phase: "Structure",
    progress: 35,
    units: 200,
    available: 80,
    pending: 24,
    sold: 96,
    leads: 27,
    value: "198.4M",
  },
  {
    name: "Qurtubah Gardens",
    city: "Riyadh",
    phase: "Excavation",
    progress: 18,
    units: 160,
    available: 120,
    pending: 14,
    sold: 26,
    leads: 18,
    value: "104.3M",
  },
  {
    name: "Dammam View",
    city: "Dammam",
    phase: "Finishing",
    progress: 55,
    units: 128,
    available: 38,
    pending: 14,
    sold: 76,
    leads: 16,
    value: "156.7M",
  },
];

const units: UnitDashboardRow[] = [
  ["A-1201", "2BR", "12", "135.5", "119.3", "1,620,000", "Available"],
  ["A-1202", "1BR", "12", "89.2", "78.4", "1,045,000", "Reserved"],
  ["A-1203", "2BR", "12", "129.8", "114.6", "1,540,000", "Sold"],
  ["A-1204", "3BR", "12", "162.3", "142.1", "1,980,000", "Interest"],
  ["A-1205", "Studio", "12", "45.6", "40.1", "620,000", "Available"],
  ["A-1206", "2BR", "12", "123.1", "108.7", "1,470,000", "Held"],
  ["A-1207", "1BR", "12", "92.4", "81.2", "1,090,000", "Available"],
  ["A-1208", "3BR", "12", "171.2", "149.8", "2,120,000", "Reserved"],
];

function unitsFor(building: string, floor: number): UnitDashboardRow[] {
  const buildingCode = building.endsWith("B") ? "B" : "A";
  const statuses = [
    "Available",
    "Reserved",
    "Sold",
    "Interest",
    "Available",
    "Held",
    "Available",
    "Reserved",
  ];
  return units.map((unit, index) => {
    const price =
      Number(unit[5].replaceAll(",", "")) +
      (floor - 12) * 8500 +
      (buildingCode === "B" ? 45000 : 0);
    return [
      `${buildingCode}-${floor}${String(index + 1).padStart(2, "0")}`,
      unit[1],
      String(floor),
      unit[3],
      unit[4],
      price.toLocaleString("en-US"),
      statuses[(index + floor) % statuses.length]!,
    ] as UnitDashboardRow;
  });
}

const floorHotspots = [
  { left: "19%", top: "31%" },
  { left: "39%", top: "32%" },
  { left: "60%", top: "31%" },
  { left: "80%", top: "31%" },
  { left: "20%", top: "70%" },
  { left: "39%", top: "70%" },
  { left: "60%", top: "70%" },
  { left: "80%", top: "70%" },
];

const transferTemplates = [
  ["RH", "Riyadh Heights", "Ahmed Al Harbi"],
  ["JM", "Jeddah Marina", "Noura Al Qahtani"],
  ["KR", "Al Khobar Residences", "Faisal Al Dosari"],
  ["QG", "Qurtubah Gardens", "Maha Al Otaibi"],
  ["DV", "Dammam View", "Sara Al Mutairi"],
] as const;
const transfers: UnitDashboardRow[] = Array.from({ length: 34 }, (_, index) => {
  const template = transferTemplates[index % transferTemplates.length]!;
  const sequence = String(1204 + index).padStart(4, "0");
  const readiness = ["78%", "100%", "65%", "90%", "82%"][index % 5]!;
  const blocker = ["Mortgagee approval", "—", "RETT tax reference", "—", "Buyer IBAN"][index % 5]!;
  const status = ["Not submitted", "Approved", "In review", "Ready", "Not submitted"][index % 5]!;
  return [`${template[0]}-${String.fromCharCode(65 + (index % 4))}-${sequence}`, template[1], template[2], (1620000 + index * 37000).toLocaleString("en-US"), readiness, blocker, status];
});

export function CommercialWorkspaceSuite({ preview = false }: { preview?: boolean }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [tab, setTab] = useState<Tab>("pipeline");
  const [project, setProject] = useState("Riyadh Heights");
  const [selectedUnit, setSelectedUnit] = useState("A-1204");
  const [interestOpen, setInterestOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unitReservation, setUnitReservation] = useState<UnitReservationHandoff | null>(null);
  const [isAdmin, setIsAdmin] = useState(preview);
  const [canViewAllLeads, setCanViewAllLeads] = useState(preview);
  const [projectAssets, setProjectAssets] = useState<Record<string, ProjectAssets>>({});
  const selected = useMemo(
    () => projects.find((item) => item.name === project) ?? projects[0]!,
    [project],
  );

  useEffect(() => {
    if (preview) return;
    clientApi<{ user: BrowserSessionUser }>("/api/session")
      .then(({ user }) => {
        setIsAdmin(user.role === "ADMIN" || user.permissions.includes("commercial:manage"));
        setCanViewAllLeads(user.permissions.includes("commercial:lead:view-all"));
      })
      .catch(() => { setIsAdmin(false); setCanViewAllLeads(false); });
  }, [preview]);

  useEffect(() => {
    const onCommercialTab = (event: Event) => {
      const nextTab = (event as CustomEvent<Tab>).detail;
      if (["pipeline", "portfolio", "units", "transfer", "operations"].includes(nextTab)) setTab(nextTab);
    };
    window.addEventListener("r4c:commercial-tab", onCommercialTab);
    return () => window.removeEventListener("r4c:commercial-tab", onCommercialTab);
  }, []);

  function uploadProjectAsset(kind: "model" | "gallery", file: File) {
    const url = URL.createObjectURL(file);
    setProjectAssets((current) => {
      const previous = current[project] ?? {};
      const previousUrl = kind === "model" ? previous.modelUrl : previous.galleryUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return {
        ...current,
        [project]: kind === "model"
          ? { ...previous, modelUrl: url, modelName: file.name }
          : { ...previous, galleryUrl: url, galleryName: file.name },
      };
    });
  }

  return (
    <div className="commercial-suite" dir={ar ? "rtl" : "ltr"}>
      <header className="suite-header suite-header-compact">
        <div>
          <p className="eyebrow">{localize(ar, "Kynox portfolio · commercial", "محفظة KYNOX · القطاع التجاري")}</p>
          <h1>{localize(ar, "Commercial workspace", "مساحة العمل التجارية")}</h1>
          <p>
            {localize(ar, "Leads, interests, temporary reservations and confirmed bookings in one governed workspace.", "العملاء المحتملون والاهتمامات والحجوزات المؤقتة والحجوزات المؤكدة في مساحة عمل محكومة واحدة.")}
          </p>
        </div>
        <div className="suite-header-actions">
          <button className="button button-secondary" type="button">
            {localize(ar, "Export report", "تصدير التقرير")}
          </button>
        </div>
      </header>
      <nav className="suite-tabs" aria-label={localize(ar, "Commercial dashboards", "لوحات المعلومات التجارية")}>
        {(
          [
            ["pipeline", localize(ar, "Sales pipeline", "مسار المبيعات")],
            ["portfolio", localize(ar, "Executive overview", "النظرة التنفيذية")],
            ["units", localize(ar, "Project & unit control", "إدارة المشروع والوحدات")],
            ["transfer", localize(ar, "Title transfer file", "ملف الإفراغ العقاري")],
            ["operations", localize(ar, "Sales operations", "عمليات المبيعات")],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab !== "pipeline" ? (
        <section className="commercial-project-switcher" aria-label={localize(ar, "Project selection", "اختيار المشروع")}>
          <div>
            <span>{localize(ar, "Active project", "المشروع النشط")}</span>
            <strong>{projectDisplayName(ar, project)}</strong>
          </div>
          <label>
            <span>{localize(ar, "Switch project", "تغيير المشروع")}</span>
            <select value={project} onChange={(event) => setProject(event.target.value)}>
              {projects.map((item) => <option value={item.name} key={item.name}>{projectDisplayName(ar, item.name)}</option>)}
            </select>
          </label>
          <div className="project-switcher-links" role="list" aria-label={localize(ar, "Available projects", "المشروعات المتاحة")}>
            {projects.map((item) => (
              <button type="button" role="listitem" key={item.name} className={project === item.name ? "active" : ""} onClick={() => setProject(item.name)}>
                <span>{projectDisplayName(ar, item.name)}</span>
                <small>{cityDisplayName(ar, item.city)} · {item.units} {localize(ar, "units", "وحدة")}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {tab === "pipeline" ? <SalesPipelineWorkspace externalReservation={unitReservation} ar={ar} persistent={!preview} canManageMedia={isAdmin} canViewAllLeads={canViewAllLeads} /> : null}
      {tab === "portfolio" ? (
        <PortfolioDashboard
          selectedProject={project}
          onSelectProject={setProject}
          onOpenProject={() => setTab("units")}
          onOpenTransfers={() => setTab("transfer")}
          isAdmin={isAdmin}
          assets={projectAssets[project]}
          onUploadAsset={uploadProjectAsset}
          ar={ar}
        />
      ) : null}
      {tab === "units" ? (
        <UnitDashboard
          project={selected}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          interestOpen={interestOpen}
          setInterestOpen={setInterestOpen}
          saved={saved}
          setSaved={setSaved}
          onReservation={setUnitReservation}
          ar={ar}
        />
      ) : null}
      {tab === "transfer" ? (
        <TransferDashboard project={project} onProjectChange={setProject} ar={ar} persistent={!preview} />
      ) : null}
      {tab === "operations" ? (
        preview ? <PreviewSalesOperations project={project} ar={ar} /> : <CommercialOperatorWorkspace />
      ) : null}
    </div>
  );
}

function PreviewSalesOperations({ project, ar }: { project: string; ar: boolean }) {
  const [leadStatus, setLeadStatus] = useState(localize(ar, "Qualified", "مؤهل"));
  const [activity, setActivity] = useState(localize(ar, "Site visit scheduled for 18 August, 16:00", "زيارة الموقع مجدولة في 18 أغسطس، الساعة 16:00"));
  const [notice, setNotice] = useState("");

  return (
    <main className="workspace-page commercial-operator preview-operations">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{localize(ar, "Sales workflow", "مسار عمل المبيعات")}</p>
          <h1>{localize(ar, "Lead, interest & reservation control", "إدارة العملاء والاهتمامات والحجوزات")}</h1>
          <p>{localize(ar, `Operate the full buyer journey for ${projectDisplayName(ar, project)} with evidence, ownership and approval gates.`, `إدارة رحلة المشتري الكاملة لمشروع ${projectDisplayName(ar, project)} مع الأدلة والملكية وبوابات الاعتماد.`)}</p>
        </div>
        <span className="status-badge">{localize(ar, "Interactive preview", "معاينة تفاعلية")}</span>
      </header>

      {notice ? <p className="success-message" aria-live="polite">{notice}</p> : null}

      <section className="commercial-journey-grid">
        <form className="create-panel commercial-capture" onSubmit={(event) => {
          event.preventDefault();
          setNotice(localize(ar, "Lead captured and assigned to the project sales queue.", "تم تسجيل العميل المحتمل وإسناده إلى قائمة مبيعات المشروع."));
          event.currentTarget.reset();
        }}>
          <p className="eyebrow">{localize(ar, "New enquiry", "استفسار جديد")}</p>
          <h2>{localize(ar, "Capture buyer evidence", "تسجيل بيانات وأدلة المشتري")}</h2>
          <label><span>{localize(ar, "Customer name", "اسم العميل")}</span><input name="name" defaultValue={localize(ar, "Lina Al Rashid", "لينا الراشد")} required /></label>
          <label><span>{localize(ar, "Contact number", "رقم التواصل")}</span><input name="phone" defaultValue="+966 55 240 8812" required /></label>
          <label><span>{localize(ar, "Email", "البريد الإلكتروني")}</span><input name="email" type="email" defaultValue="lina@example.com" required /></label>
          <label><span>{localize(ar, "Evidence / source", "الدليل / المصدر")}</span><input name="source" defaultValue={localize(ar, "Website enquiry — floor plan downloaded", "استفسار من الموقع — تم تنزيل مخطط الدور")} required /></label>
          <button className="button button-primary">{localize(ar, "Record interest", "تسجيل اهتمام")}</button>
        </form>

        <section className="create-panel commercial-pipeline">
          <div className="section-heading"><div><p className="eyebrow">{localize(ar, "Active opportunity", "فرصة نشطة")}</p><h2>{buyerDisplayName(ar, "Ahmed Al Harbi")}</h2></div><span className="status-badge">{leadStatus}</span></div>
          <dl>
            <div><dt>{localize(ar, "Project", "المشروع")}</dt><dd>{projectDisplayName(ar, project)}</dd></div>
            <div><dt>{localize(ar, "Preferred unit", "الوحدة المفضلة")}</dt><dd>{localize(ar, "A-1204 · 3BR · Floor 12", "A-1204 · ثلاث غرف · الدور 12")}</dd></div>
            <div><dt>{localize(ar, "Contact", "التواصل")}</dt><dd>+966 50 318 4472<br />ahmed@example.com</dd></div>
            <div><dt>{localize(ar, "Evidence", "الأدلة")}</dt><dd>{localize(ar, "Site visit · ID received", "زيارة الموقع · تم استلام الهوية")}</dd></div>
          </dl>
          <div className="lead-actions">
            <button className="button button-primary" type="button" onClick={() => { setLeadStatus(localize(ar, "Reservation pending", "الحجز قيد الاعتماد")); setNotice(localize(ar, "Unit A-1204 placed in the reservation approval queue.", "تمت إضافة الوحدة A-1204 إلى قائمة اعتماد الحجوزات.")); }}>{localize(ar, "Create reservation", "إنشاء حجز")}</button>
            <button className="button button-secondary" type="button" onClick={() => { setLeadStatus(localize(ar, "Follow-up", "متابعة")); setNotice(localize(ar, "Follow-up task assigned to the sales owner.", "تم إسناد مهمة المتابعة لمسؤول المبيعات.")); }}>{localize(ar, "Schedule follow-up", "جدولة متابعة")}</button>
          </div>
        </section>
      </section>

      <section className="commercial-work-grid">
        <form className="create-panel" onSubmit={(event) => { event.preventDefault(); setNotice(localize(ar, "Activity added to the auditable customer timeline.", "تمت إضافة النشاط إلى السجل الزمني القابل للتدقيق للعميل.")); }}>
          <p className="eyebrow">{localize(ar, "Evidence timeline", "سجل الأدلة")}</p>
          <h2>{localize(ar, "Log sales activity", "تسجيل نشاط المبيعات")}</h2>
          <label><span>{localize(ar, "Activity note", "ملاحظة النشاط")}</span><textarea value={activity} onChange={(event) => setActivity(event.target.value)} required /></label>
          <button className="button button-primary">{localize(ar, "Save activity", "حفظ النشاط")}</button>
        </form>
        <section className="create-panel unit-review">
          <p className="eyebrow">{localize(ar, "Selected inventory", "المخزون المحدد")}</p>
          <h2>{localize(ar, "A-1204 · 3 Bedroom", "A-1204 · ثلاث غرف")}</h2>
          <dl>
            <div><dt>{localize(ar, "Floor / area", "الدور / المساحة")}</dt><dd>12 · 162.3 م²</dd></div>
            <div><dt>{localize(ar, "List price", "سعر القائمة")}</dt><dd>{localize(ar, "SAR 1,980,000", "1,980,000 ر.س")}</dd></div>
            <div><dt>{localize(ar, "Availability", "الحالة")}</dt><dd>{localize(ar, "Interest recorded", "تم تسجيل اهتمام")}</dd></div>
            <div><dt>{localize(ar, "Construction", "الإنشاء")}</dt><dd>{localize(ar, "Structure · 62%", "الهيكل الإنشائي · 62%")}</dd></div>
          </dl>
          <button className="button button-secondary" type="button" onClick={() => setNotice(localize(ar, "Unit A-1204 opened in Project & unit control.", "تم فتح الوحدة A-1204 في إدارة المشروع والوحدات."))}>{localize(ar, "Open linked unit", "فتح الوحدة المرتبطة")}</button>
        </section>
      </section>
    </main>
  );
}

function Metric({
  value,
  label,
  tone,
  caption,
}: {
  value: string;
  label: string;
  tone?: string;
  caption: string;
}) {
  return (
    <article className="suite-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}
function Bar({ value }: { value: number }) {
  return (
    <span className="suite-progress">
      <i style={{ width: `${value}%` }} />
    </span>
  );
}

function PortfolioDashboard({
  selectedProject,
  onSelectProject,
  onOpenProject,
  onOpenTransfers,
  isAdmin,
  assets,
  onUploadAsset,
  ar,
}: {
  selectedProject: string;
  onSelectProject: (project: string) => void;
  onOpenProject: () => void;
  onOpenTransfers: () => void;
  isAdmin: boolean;
  assets?: ProjectAssets;
  onUploadAsset: (kind: "model" | "gallery", file: File) => void;
  ar: boolean;
}) {
  const focusedProject =
    projects.find((item) => item.name === selectedProject) ?? projects[0]!;
  return (
    <main className="suite-dashboard">
      <section className="executive-hero">
        <CommercialHero3D
          project={focusedProject.name}
          progress={focusedProject.progress}
          modelUrl={assets?.modelUrl}
          label={localize(ar, `Interactive 3D construction model for ${focusedProject.name}`, `نموذج إنشائي ثلاثي الأبعاد تفاعلي لمشروع ${projectDisplayName(ar, focusedProject.name)}`)}
        />
        <div className="executive-hero-copy">
          <p className="eyebrow">{localize(ar, "Live development digital twin", "التوأم الرقمي المباشر للمشروع")}</p>
          <h2>{projectDisplayName(ar, focusedProject.name)}</h2>
          <p>
            {cityDisplayName(ar, focusedProject.city)} · {localize(ar, focusedProject.phase, focusedProject.phase === "Structure" ? "الهيكل الإنشائي" : focusedProject.phase === "Finishing" ? "التشطيبات" : "الأعمال الأولية")} · {localize(ar, "construction", "الإنشاء")} {" "}
            {focusedProject.progress}%
          </p>
          <div>
            <span>{localize(ar, "Drag across the model", "حرّك المؤشر فوق النموذج")}</span>
            <strong>{focusedProject.sold} {localize(ar, "units sold", "وحدة مباعة")}</strong>
          </div>
          {isAdmin ? (
            <label className="admin-asset-upload admin-model-upload">
              <Cube size={20} weight="duotone" aria-hidden="true" />
              <span>{assets?.modelName ?? localize(ar, "Upload project model (GLB)", "رفع نموذج المشروع (GLB)")}</span>
              <UploadSimple size={18} weight="bold" aria-hidden="true" />
              <input type="file" accept=".glb,model/gltf-binary" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadAsset("model", file);
              }} />
            </label>
          ) : null}
        </div>
      </section>
      <section className="suite-metrics">
        <Metric value="8" label={localize(ar, "Active projects", "المشروعات النشطة")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value="1,248" label={localize(ar, "Total units", "إجمالي الوحدات")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value="684" label={localize(ar, "Sold", "المباع")} tone="good" caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value="92" label={localize(ar, "Pending / reserved", "قيد الانتظار / محجوز")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value="147" label={localize(ar, "Active leads", "العملاء المحتملون النشطون")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value={localize(ar, "SAR 1.84B", "1.84 مليار ر.س")} label={localize(ar, "Contracted value", "القيمة التعاقدية")} tone="good" caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
      </section>
      <section className="portfolio-layout">
        <div className="suite-panel">
          <div className="suite-panel-heading">
            <div>
              <h2>{localize(ar, "Project portfolio", "محفظة المشروعات")}</h2>
              <p>{localize(ar, "Construction delivery, inventory and commercial performance", "التنفيذ الإنشائي والمخزون والأداء التجاري")}</p>
            </div>
            <div className="suite-filter-row">
              <select aria-label={localize(ar, "City", "المدينة")}>
                <option>{localize(ar, "All cities", "كل المدن")}</option>
                <option>{localize(ar, "Riyadh", "الرياض")}</option>
                <option>{localize(ar, "Jeddah", "جدة")}</option>
              </select>
              <select aria-label={localize(ar, "Phase", "المرحلة")}>
                <option>{localize(ar, "All phases", "كل المراحل")}</option>
                <option>{localize(ar, "Structure", "الهيكل الإنشائي")}</option>
                <option>{localize(ar, "Finishing", "التشطيبات")}</option>
              </select>
            </div>
          </div>
          <div className="suite-table">
            <div className="suite-table-row suite-table-head">
              <span>{localize(ar, "Project", "المشروع")}</span>
              <span>{localize(ar, "Phase", "المرحلة")}</span>
              <span>{localize(ar, "Construction", "الإنشاء")}</span>
              <span>{localize(ar, "Units", "الوحدات")}</span>
              <span>{localize(ar, "Available", "المتاح")}</span>
              <span>{localize(ar, "Pending", "قيد الانتظار")}</span>
              <span>{localize(ar, "Sold", "المباع")}</span>
              <span>{localize(ar, "Leads", "العملاء المحتملون")}</span>
              <span>{localize(ar, "Inventory value", "قيمة المخزون")}</span>
            </div>
            {projects.map((p) => (
              <button
                type="button"
                className={
                  focusedProject.name === p.name
                    ? "suite-table-row project-row selected"
                    : "suite-table-row project-row"
                }
                key={p.name}
                onClick={() => onSelectProject(p.name)}
              >
                <strong>
                  {projectDisplayName(ar, p.name)}
                  <small>{cityDisplayName(ar, p.city)}</small>
                </strong>
                <span>{localize(ar, p.phase, p.phase === "Structure" ? "الهيكل الإنشائي" : p.phase === "Finishing" ? "التشطيبات" : "الأعمال الأولية")}</span>
                <span>
                  {p.progress}%<Bar value={p.progress} />
                </span>
                <span>{p.units}</span>
                <span>{p.available}</span>
                <span>{p.pending}</span>
                <span className="good">{p.sold}</span>
                <span>{p.leads}</span>
                <strong>{inventoryValueLabel(ar, p.value)}</strong>
              </button>
            ))}
          </div>
        </div>
        <aside className="suite-panel project-summary-drawer">
          <div className="project-visual-wrap">
            <img
              className="project-visual"
              src={assets?.galleryUrl ?? "/assets/commercial/riyadh-heights.png"}
              alt={localize(ar, `${focusedProject.name} residential development`, `مشروع ${projectDisplayName(ar, focusedProject.name)} السكني`)}
            />
            {isAdmin ? (
              <label className="admin-asset-upload admin-gallery-upload">
                <ImageSquare size={20} weight="duotone" aria-hidden="true" />
                <span>{assets?.galleryName ?? localize(ar, "Upload project gallery", "رفع معرض صور المشروع")}</span>
                <UploadSimple size={18} weight="bold" aria-hidden="true" />
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadAsset("gallery", file);
                }} />
              </label>
            ) : null}
          </div>
          <div className="project-summary-title">
            <strong>{projectDisplayName(ar, focusedProject.name)}</strong>
            <span>{cityDisplayName(ar, focusedProject.city)}</span>
          </div>
          <dl>
            <div>
              <dt>{localize(ar, "Current phase", "المرحلة الحالية")}</dt>
              <dd>{localize(ar, focusedProject.phase, focusedProject.phase === "Structure" ? "الهيكل الإنشائي" : focusedProject.phase === "Finishing" ? "التشطيبات" : "الأعمال الأولية")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Total units", "إجمالي الوحدات")}</dt>
              <dd>{focusedProject.units}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Construction", "الإنشاء")}</dt>
              <dd>{focusedProject.progress}%</dd>
            </div>
            <div>
              <dt>{localize(ar, "Sales progress", "تقدم المبيعات")}</dt>
              <dd>
                {Math.round((focusedProject.sold / focusedProject.units) * 100)}
                %
              </dd>
            </div>
            <div>
              <dt>{localize(ar, "Sold / pending", "مباع / قيد الانتظار")}</dt>
              <dd>
                {focusedProject.sold} / {focusedProject.pending}
              </dd>
            </div>
            <div>
              <dt>{localize(ar, "Available", "المتاح")}</dt>
              <dd>{focusedProject.available}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Active leads", "العملاء المحتملون النشطون")}</dt>
              <dd>{focusedProject.leads}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Inventory value", "قيمة المخزون")}</dt>
              <dd>{inventoryValueLabel(ar, focusedProject.value)}</dd>
            </div>
          </dl>
          <button
            className="button button-primary"
            type="button"
            onClick={onOpenProject}
          >
            {localize(ar, "View project details", "عرض تفاصيل المشروع")}
          </button>
        </aside>
      </section>
      <section className="suite-analytics">
        <Chart
          title={localize(ar, "Sales vs construction progress", "تقدم المبيعات مقابل الإنشاء")}
          values={[38, 46, 52, 59, 66, 71]}
          second={[24, 31, 39, 47, 54, 62]}
          ar={ar}
        />
        <Chart
          title={localize(ar, "Quarterly reservation value (SAR M)", "قيمة الحجوزات الفصلية (مليون ر.س)")}
          values={[31, 46, 52, 48, 67, 82]}
          ar={ar}
        />
        <article className="suite-panel suite-funnel">
          <h2>{localize(ar, "Lead conversion", "تحويل العملاء المحتملين")}</h2>
          {[
            [localize(ar, "New leads", "عملاء جدد"), 147, 100],
            [localize(ar, "Contacted", "تم التواصل"), 98, 67],
            [localize(ar, "Qualified", "مؤهلون"), 62, 42],
            [localize(ar, "Site visit", "زيارة الموقع"), 34, 23],
            [localize(ar, "Reserved", "حجوزات"), 16, 11],
          ].map(([n, v, w]) => (
            <div key={String(n)}>
              <span>{n}</span>
              <i style={{ width: `${w}%` }} />
              <strong>{v}</strong>
            </div>
          ))}
        </article>
        <article className="suite-panel financial-card">
          <h2>{localize(ar, "Executive financial analysis", "التحليل المالي التنفيذي")}</h2>
          <dl>
            <div>
              <dt>{localize(ar, "Gross sales value", "إجمالي قيمة المبيعات")}</dt>
              <dd>{localize(ar, "SAR 1.84B", "1.84 مليار ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Weighted forecast", "التوقع المرجّح")}</dt>
              <dd>{localize(ar, "SAR 2.63B", "2.63 مليار ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Average price / m²", "متوسط السعر / م²")}</dt>
              <dd>{localize(ar, "SAR 7,512", "7,512 ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Variance to target", "الانحراف عن المستهدف")}</dt>
              <dd className="good">+8.9%</dd>
            </div>
          </dl>
        </article>
      </section>
      <button
        type="button"
        className="suite-panel executive-transfer-summary"
        onClick={onOpenTransfers}
      >
        <div className="suite-panel-heading">
          <div>
            <h2>{localize(ar, "Executive closing summary", "ملخص الإغلاق التنفيذي")}</h2>
            <p>
              {localize(ar, "Portfolio-level ownership-transfer readiness; detailed files remain in their dedicated tab.", "جاهزية الإفراغ العقاري على مستوى المحفظة؛ وتبقى الملفات التفصيلية في التبويب المخصص.")}
            </p>
          </div>
          <strong>{localize(ar, "34 transfers in progress", "34 عملية إفراغ جارية")}</strong>
        </div>
        <div className="closing-summary-grid">
          <div>
            <strong>18</strong>
            <span>{localize(ar, "Ready for handoff", "جاهز للتسليم")}</span>
          </div>
          <div>
            <strong>9</strong>
            <span>{localize(ar, "Awaiting documents", "بانتظار المستندات")}</span>
          </div>
          <div>
            <strong>5</strong>
            <span>{localize(ar, "Government review", "المراجعة الحكومية")}</span>
          </div>
          <div>
            <strong>2</strong>
            <span>{localize(ar, "Blocked", "متعثر")}</span>
          </div>
          <div>
            <strong>{localize(ar, "SAR 84.6M", "84.6 مليون ر.س")}</strong>
            <span>{localize(ar, "Value in closing", "القيمة قيد الإغلاق")}</span>
          </div>
        </div>
      </button>
    </main>
  );
}

function Chart({
  title,
  values,
  second,
  ar,
}: {
  title: string;
  values: number[];
  second?: number[];
  ar: boolean;
}) {
  return (
    <article className="suite-panel chart-card">
      <h2>{title}</h2>
      <div className="mini-chart">
        {values.map((v, i) => (
          <span key={i} style={{ height: `${v}%` }}>
            {second ? <i style={{ height: `${second[i]}%` }} /> : null}
          </span>
        ))}
      </div>
      <div className="chart-labels">
        <span>{localize(ar, "Dec", "ديسمبر")}</span>
        <span>{localize(ar, "Jan", "يناير")}</span>
        <span>{localize(ar, "Feb", "فبراير")}</span>
        <span>{localize(ar, "Mar", "مارس")}</span>
        <span>{localize(ar, "Apr", "أبريل")}</span>
        <span>{localize(ar, "May", "مايو")}</span>
      </div>
    </article>
  );
}

function UnitDashboard({
  project,
  selectedUnit,
  setSelectedUnit,
  interestOpen,
  setInterestOpen,
  saved,
  setSaved,
  onReservation,
  ar,
}: {
  project: ProjectDashboardRecord;
  selectedUnit: string;
  setSelectedUnit: (s: string) => void;
  interestOpen: boolean;
  setInterestOpen: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
  onReservation: (reservation: UnitReservationHandoff) => void;
  ar: boolean;
}) {
  const [building, setBuilding] = useState("Building A");
  const [floor, setFloor] = useState(12);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All unit types");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, string>
  >({});
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationReference, setReservationReference] = useState("");
  const floorUnits = useMemo(
    () =>
      unitsFor(building, floor).map((row) => ({
        row,
        status: statusOverrides[row[0]] ?? row[6],
      })),
    [building, floor, statusOverrides],
  );
  const filteredUnits = useMemo(
    () =>
      floorUnits.filter(
        ({ row, status }) =>
          (!query || row[0].toLowerCase().includes(query.toLowerCase())) &&
          (typeFilter === "All unit types" || row[1] === typeFilter) &&
          (statusFilter === "All statuses" || status === statusFilter),
      ),
    [floorUnits, query, typeFilter, statusFilter],
  );
  const selectedRow =
    floorUnits.find(({ row }) => row[0] === selectedUnit) ?? floorUnits[0]!;

  function chooseLocation(nextBuilding: string, nextFloor: number) {
    setBuilding(nextBuilding);
    setFloor(nextFloor);
    setSelectedUnit(unitsFor(nextBuilding, nextFloor)[0]![0]);
  }
  return (
    <main className="suite-dashboard">
      <section className="suite-metrics">
        <Metric value={`${project.progress}%`} label={localize(ar, "Construction", "الإنشاء")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value={localize(ar, project.phase, project.phase === "Structure" ? "الهيكل الإنشائي" : project.phase === "Finishing" ? "التشطيبات" : "الأعمال الأولية")} label={localize(ar, "Current phase", "المرحلة الحالية")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value={String(project.units)} label={localize(ar, "Total units", "إجمالي الوحدات")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric
          value={String(project.available)}
          label={localize(ar, "Available", "المتاح")}
          tone="good"
          caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")}
        />
        <Metric value={String(project.pending)} label={localize(ar, "Held / reserved", "موقوف / محجوز")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value="18" label={localize(ar, "Number of floors", "عدد الأدوار")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
      </section>
      <section className="unit-layout">
        <aside className="suite-panel floor-navigator">
          <div>
            <p className="eyebrow">{localize(ar, "Building navigator", "مستعرض المباني")}</p>
            <h2>{localize(ar, "18 floors", "18 دوراً")}</h2>
            <small>{localize(ar, "320 units across 2 buildings", "320 وحدة ضمن مبنيين")}</small>
          </div>
          <div className="building-switcher">
            {["Building A", "Building B"].map((item, index) => (
              <button
                type="button"
                key={item}
                aria-pressed={building === item}
                onClick={() => chooseLocation(item, floor)}
              >
                {localize(ar, item, `المبنى ${index === 0 ? "أ" : "ب"}`)}
              </button>
            ))}
          </div>
          <div className="floor-list" aria-label={localize(ar, "Select floor", "اختيار الدور")}>
            {Array.from({ length: 18 }, (_, index) => 18 - index).map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={floor === item}
                  onClick={() => chooseLocation(building, item)}
                >
                  <span>{localize(ar, "Floor", "الدور")} {item}</span>
                  <small>
                    8 {localize(ar, "units", "وحدات")} ·{" "}
                    {
                      unitsFor(building, item).filter(
                        (row) => row[6] === "Available",
                      ).length
                    }{" "}
                    {localize(ar, "available", "متاحة")}
                  </small>
                </button>
              ),
            )}
          </div>
        </aside>
        <div className="suite-panel unit-main">
          <div className="suite-panel-heading">
            <div>
              <h2>{localize(ar, `${project.name} unit inventory`, `مخزون وحدات ${projectDisplayName(ar, project.name)}`)}</h2>
              <p>
                {localize(ar, building, building === "Building A" ? "المبنى أ" : "المبنى ب")} · {localize(ar, "Floor", "الدور")} {floor} {localize(ar, "of 18 · live commercial status", "من 18 · الحالة التجارية المباشرة")}
              </p>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setInterestOpen(true);
                setSaved(false);
              }}
            >
              {localize(ar, "Record interest", "تسجيل اهتمام")}
            </button>
          </div>
          <div className="suite-filter-row wide">
            <input
              placeholder={localize(ar, "Search unit", "البحث عن وحدة")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All unit types">{localize(ar, "All unit types", "كل أنواع الوحدات")}</option>
              <option value="Studio">{localize(ar, "Studio", "استوديو")}</option>
              <option value="2BR">{localize(ar, "2BR", "غرفتان")}</option>
              <option value="3BR">{localize(ar, "3BR", "ثلاث غرف")}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All statuses">{localize(ar, "All statuses", "كل الحالات")}</option>
              <option value="Available">{unitStatusLabel(ar, "Available")}</option>
              <option value="Reserved">{unitStatusLabel(ar, "Reserved")}</option>
              <option value="Sold">{unitStatusLabel(ar, "Sold")}</option>
            </select>
            <select>
              <option>{localize(ar, "All views", "كل الإطلالات")}</option>
              <option>{localize(ar, "Park", "الحديقة")}</option>
              <option>{localize(ar, "City", "المدينة")}</option>
            </select>
          </div>
          <div className="unit-table">
            <div className="unit-row unit-head">
              <span>{localize(ar, "Unit", "الوحدة")}</span>
              <span>{localize(ar, "Type", "النوع")}</span>
              <span>{localize(ar, "Floor", "الدور")}</span>
              <span>{localize(ar, "Gross m²", "المساحة الإجمالية م²")}</span>
              <span>{localize(ar, "Net m²", "المساحة الصافية م²")}</span>
              <span>{localize(ar, "List price SAR", "السعر المعلن ر.س")}</span>
              <span>{localize(ar, "Status", "الحالة")}</span>
            </div>
            {filteredUnits.map(({ row: u, status }) => (
              <button
                type="button"
                className={
                  selectedUnit === u[0] ? "unit-row selected" : "unit-row"
                }
                key={u[0]}
                onClick={() => setSelectedUnit(u[0])}
              >
                {u.map((x, i) => (
                  <span
                    key={i}
                    className={
                      i === 6
                        ? `unit-status status-${status.toLowerCase()}`
                        : ""
                    }
                  >
                    {i === 6 ? unitStatusLabel(ar, status) : i === 1 ? unitTypeLabel(ar, x) : x}
                  </span>
                ))}
              </button>
            ))}
          </div>
          <div className="floor-map-heading">
            <div>
              <strong>
                {localize(ar, `${building} · Floor ${floor} layout`, `${building === "Building A" ? "المبنى أ" : "المبنى ب"} · مخطط الدور ${floor}`)}
              </strong>
              <span>{localize(ar, "8 units · 949.1 m² gross floor area", "8 وحدات · 949.1 م² إجمالي مساحة الدور")}</span>
            </div>
            <span>{localize(ar, "North ↑", "الشمال ↑")}</span>
          </div>
          <div className="floor-plan-wrap">
            <img
              className="floor-plan-image"
              src="/assets/commercial/floor-12-layout-8-units.png"
              alt={localize(ar, `${building} floor ${floor} architectural unit layout`, `المخطط المعماري للدور ${floor} في ${building === "Building A" ? "المبنى أ" : "المبنى ب"}`)}
            />
            {floorUnits.map(({ row, status }, index) => (
              <button
                type="button"
                key={row[0]}
                className={`floor-hotspot status-${status.toLowerCase()} ${selectedUnit === row[0] ? "selected" : ""}`}
                style={floorHotspots[index]}
                onClick={() => setSelectedUnit(row[0])}
                aria-label={localize(ar, `Select unit ${row[0]}, ${status}`, `اختيار الوحدة ${row[0]}، ${unitStatusLabel(ar, status)}`)}
              >
                {row[0]}
              </button>
            ))}
          </div>
          <div
            className="floor-map"
            aria-label={localize(ar, `${building} floor ${floor} unit status controls`, `حالات وحدات ${building === "Building A" ? "المبنى أ" : "المبنى ب"} في الدور ${floor}`)}
          >
            {floorUnits.map(({ row: u, status }) => (
              <button
                type="button"
                key={u[0]}
                className={`map-unit status-${status.toLowerCase()} ${selectedUnit === u[0] ? "selected" : ""}`}
                onClick={() => setSelectedUnit(u[0])}
              >
                {u[0].slice(2)}
              </button>
            ))}
          </div>
        </div>
        <aside className="suite-panel unit-drawer">
          <div className="suite-panel-heading">
            <div>
              <p className="eyebrow">{localize(ar, "Selected unit", "الوحدة المحددة")}</p>
              <h2>{selectedRow.row[0]}</h2>
            </div>
            <span
              className={`unit-status status-${selectedRow.status.toLowerCase()}`}
            >
              {unitStatusLabel(ar, selectedRow.status)}
            </span>
          </div>
          <dl>
            <div>
              <dt>{localize(ar, "Type", "النوع")}</dt>
              <dd>{localize(ar, `${selectedRow.row[1]} Apartment`, selectedRow.row[1] === "2BR" ? "شقة غرفتين" : selectedRow.row[1] === "3BR" ? "شقة ثلاث غرف" : selectedRow.row[1] === "Studio" ? "استوديو" : "شقة غرفة واحدة")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Gross / net", "الإجمالي / الصافي")}</dt>
              <dd>
                {selectedRow.row[3]} / {selectedRow.row[4]} {localize(ar, "m²", "م²")}
              </dd>
            </div>
            <div>
              <dt>{localize(ar, "Orientation / view", "الاتجاه / الإطلالة")}</dt>
              <dd>{localize(ar, "NW / Park", "شمال غربي / الحديقة")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "List price", "السعر المعلن")}</dt>
              <dd>{selectedRow.row[5]} {localize(ar, "SAR", "ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Price / m²", "السعر / م²")}</dt>
              <dd>12,205 {localize(ar, "SAR", "ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Construction", "الإنشاء")}</dt>
              <dd>{localize(ar, "Structure · 62%", "الهيكل الإنشائي · 62%")}</dd>
            </div>
          </dl>
          <h3>{localize(ar, "Measurements", "المساحات التفصيلية")}</h3>
          <dl>
            <div>
              <dt>{localize(ar, "Living & dining", "المعيشة والطعام")}</dt>
              <dd>38.40 {localize(ar, "m²", "م²")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Kitchen", "المطبخ")}</dt>
              <dd>12.30 {localize(ar, "m²", "م²")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Master bedroom", "غرفة النوم الرئيسية")}</dt>
              <dd>20.10 {localize(ar, "m²", "م²")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Bedrooms 2 & 3", "غرفتا النوم 2 و3")}</dt>
              <dd>29.70 {localize(ar, "m²", "م²")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Balcony", "الشرفة")}</dt>
              <dd>11.80 {localize(ar, "m²", "م²")}</dd>
            </div>
          </dl>
          <h3>{localize(ar, "Price history", "سجل الأسعار")}</h3>
          <dl>
            <div>
              <dt>{localize(ar, "18 May 2025", "18 مايو 2025")}</dt>
              <dd>1,980,000 {localize(ar, "SAR", "ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "05 May 2025", "05 مايو 2025")}</dt>
              <dd>2,050,000 {localize(ar, "SAR", "ر.س")}</dd>
            </div>
            <div>
              <dt>{localize(ar, "20 Apr 2025", "20 أبريل 2025")}</dt>
              <dd>2,100,000 {localize(ar, "SAR", "ر.س")}</dd>
            </div>
          </dl>
          <h3>{localize(ar, "Buyer activity evidence", "سجل تفاعل المشتري")}</h3>
          <ol className="transfer-timeline">
            <li>{localize(ar, "Website enquiry received", "تم استلام استفسار من الموقع")}</li>
            <li>{localize(ar, "Call logged · no answer", "تم تسجيل مكالمة · لا توجد إجابة")}</li>
            <li>{localize(ar, "WhatsApp message delivered", "تم تسليم رسالة واتساب")}</li>
            <li>{localize(ar, "Brochure uploaded", "تم رفع كتيب المشروع")}</li>
          </ol>
          {reservationReference ? <p className="success-message" role="status">{localize(ar, `Reservation ${reservationReference} is linked to unit ${selectedRow.row[0]}.`, `تم إنشاء الحجز ${reservationReference} وربطه بالوحدة ${selectedRow.row[0]} والعميل.`)}</p> : null}
          <button
            className="button button-primary"
            type="button"
            onClick={() => setInterestOpen(true)}
          >
            {localize(ar, "Record interest", "تسجيل اهتمام")}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setReservationOpen(true)}
          >
            {localize(ar, "Create reservation", "إنشاء حجز")}
          </button>
        </aside>
      </section>
      {reservationOpen ? (
        <div className="suite-modal-backdrop" role="presentation" onMouseDown={() => setReservationOpen(false)}>
          <form className="suite-modal reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => {
            event.preventDefault();
            const reference = `RSV-${selectedRow.row[0]}-${String(Date.now()).slice(-4)}`;
            const form = new FormData(event.currentTarget);
            setStatusOverrides((current) => ({ ...current, [selectedRow.row[0]]: "Reserved" }));
            setReservationReference(reference);
            onReservation({ reference, customer: String(form.get("customer")), phone: String(form.get("mobile")), project: project.name, unit: selectedRow.row[0] });
            setReservationOpen(false);
          }}>
            <div className="suite-panel-heading">
              <div><p className="eyebrow">{localize(ar, "Reservation", "الحجز")}</p><h2 id="reservation-dialog-title">{localize(ar, `Create reservation for ${selectedRow.row[0]}`, `إنشاء حجز للوحدة ${selectedRow.row[0]}`)}</h2></div>
              <button type="button" className="button button-quiet" onClick={() => setReservationOpen(false)}>{localize(ar, "Close", "إغلاق")}</button>
            </div>
            <label>{localize(ar, "Customer name", "اسم العميل")}<input name="customer" required defaultValue={localize(ar, "Mohammed Abdullah", "محمد عبدالله")} /></label>
            <label>{localize(ar, "Saudi mobile", "رقم الجوال السعودي")}<input name="mobile" required inputMode="tel" defaultValue="+966 50 123 4567" /></label>
            <label>{localize(ar, "Reservation amount", "مبلغ الحجز")}<input name="amount" required inputMode="decimal" defaultValue="50,000" /></label>
            <label>{localize(ar, "Expiry", "تاريخ انتهاء الحجز")}<input name="expiry" required type="date" defaultValue="2026-08-27" /></label>
            <label className="check-row"><input type="checkbox" required defaultChecked /><span>{localize(ar, "Customer identity and consent were verified", "تم التحقق من هوية العميل وموافقته")}</span></label>
            <button className="button button-primary">{localize(ar, "Confirm and link reservation", "تأكيد الحجز وربطه بالوحدة")}</button>
          </form>
        </div>
      ) : null}
      {interestOpen ? (
        <div
          className="suite-modal-backdrop"
          role="presentation"
          onMouseDown={() => setInterestOpen(false)}
        >
          <form
            className="suite-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interest-dialog-title"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
              setStatusOverrides((current) => ({
                ...current,
                [selectedRow.row[0]]: "Interest",
              }));
            }}
          >
            <div className="suite-panel-heading">
              <div>
                <p className="eyebrow">{localize(ar, "Buyer evidence", "بيانات المشتري")}</p>
                <h2 id="interest-dialog-title">{localize(ar, `Record interest for ${selectedUnit}`, `تسجيل اهتمام بالوحدة ${selectedUnit}`)}</h2>
              </div>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setInterestOpen(false)}
              >
                {localize(ar, "Close", "إغلاق")}
              </button>
            </div>
            <label>
              {localize(ar, "Full name", "الاسم الكامل")}
              <input required defaultValue={localize(ar, "Mohammed Abdullah", "محمد عبدالله")} />
            </label>
            <label>
              {localize(ar, "Mobile number", "رقم الجوال")}
              <input required inputMode="tel" defaultValue="+966 50 123 4567" />
            </label>
            <label>
              {localize(ar, "Email", "البريد الإلكتروني")}
              <input
                required
                type="email"
                defaultValue="m.abdullah@example.com"
              />
            </label>
            <label>
              {localize(ar, "Source", "المصدر")}
              <select>
                <option>{localize(ar, "Website", "الموقع الإلكتروني")}</option>
                <option>{localize(ar, "Sales agent", "مندوب المبيعات")}</option>
                <option>{localize(ar, "Referral", "إحالة")}</option>
              </select>
            </label>
            <label>
              {localize(ar, "Notes", "الملاحظات")}
              <textarea defaultValue={localize(ar, "Interested in park-view units on high floors.", "مهتم بوحدات الأدوار العليا المطلة على الحديقة.")} />
            </label>
            <label className="localized-file-control">
              {localize(ar, "Evidence attachment", "مرفق الإثبات")}
              <span>{localize(ar, "Choose evidence file", "اختيار ملف الإثبات")}</span>
              <input type="file" aria-label={localize(ar, "Choose evidence file", "اختيار ملف الإثبات")} />
            </label>
            <label className="check-row">
              <input type="checkbox" required defaultChecked />
              <span>{localize(ar, "Buyer consent to contact is recorded", "تم تسجيل موافقة المشتري على التواصل")}</span>
            </label>
            {saved ? (
              <p className="success-message">
                {localize(ar, "Interest and buyer evidence saved.", "تم حفظ الاهتمام وبيانات المشتري.")}
              </p>
            ) : null}
            <button className="button button-primary">{localize(ar, "Save interest", "حفظ الاهتمام")}</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function TransferDashboard({
  project,
  onProjectChange,
  ar,
  persistent,
}: {
  project: string;
  onProjectChange: (project: string) => void;
  ar: boolean;
  persistent: boolean;
}) {
  const [rows, setRows] = useState<UnitDashboardRow[]>(transfers);
  const [transferCases, setTransferCases] = useState<TransferCase[]>([]);
  const [transferNotice, setTransferNotice] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(
    transfers.find((row) => row[1] === project)?.[0] ?? transfers[0]![0],
  );
  const [documentsRequested, setDocumentsRequested] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, Record<string, string>>>({});
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, Record<string, "approved" | "changes">>>({});
  const projectRows = rows.filter((row) => row[1] === project);
  const selectedTransfer =
    rows.find((row) => row[0] === selectedId) ?? projectRows[0] ?? rows[0] ?? (["—", project, "—", "—", "0%", "—", "DOCUMENTS_PENDING"] as UnitDashboardRow);
  const approved = selectedTransfer[4] === "100%";
  const currentUploads = uploadedDocuments[selectedTransfer[0]] ?? {};
  const currentDecisions = reviewDecisions[selectedTransfer[0]] ?? {};
  const selectedCase = transferCases.find((item) => item.reservation.unit.code === selectedTransfer[0]);

  async function refreshTransferCases() {
    if (!persistent) return;
    try {
      const cases = await commercialApi.transferCases();
      setTransferCases(cases);
      setRows(cases.map((item) => {
        const customer = item.reservation.customer;
        const buyer = customer ? `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}` : "—";
        const blocker = item.documents.find((document) => !["VERIFIED", "NOT_APPLICABLE"].includes(document.status));
        return [item.reservation.unit.code, item.project.name, buyer, "—", `${item.readiness}%`, blocker?.documentType ?? "—", item.status] as UnitDashboardRow;
      }));
      if (cases.length) {
        setSelectedId((current) => cases.some((item) => item.reservation.unit.code === current) ? current : cases[0]!.reservation.unit.code);
        if (!cases.some((item) => item.project.name === project)) onProjectChange(cases[0]!.project.name);
      }
      setTransferNotice("");
    } catch (error) {
      setTransferNotice(error instanceof Error ? error.message : localize(ar, "Could not load transfer files", "تعذر تحميل ملفات الإفراغ"));
    }
  }

  useEffect(() => { void refreshTransferCases(); }, [persistent]);

  useEffect(() => {
    const next = rows.find((row) => row[1] === project);
    if (next) setSelectedId(next[0]);
  }, [project, rows]);

  const previewChecks: [string, string, string, string][] = [
    ["seller-id", localize(ar, "Seller identity / representative", "هوية البائع / الممثل النظامي"), "Verified", localize(ar, "Verified", "متحقق")],
    ["buyer-id", localize(ar, "Buyer identity", "هوية المشتري"), "Verified", localize(ar, "Verified", "متحقق")],
    ["title-deed", localize(ar, "Electronic title deed / property sheet", "الصك الإلكتروني / صحيفة العقار"), "Verified", localize(ar, "Verified", "متحقق")],
    ["beneficiary-iban", localize(ar, "Active beneficiary IBAN", "آيبان المستفيد النشط"), "Verified", localize(ar, "Verified", "متحقق")],
    [
      "rett-reference",
      localize(ar, "Real estate transaction tax reference", "مرجع ضريبة التصرفات العقارية"),
      currentUploads["rett-reference"] ? "Awaiting approval" : approved
        ? "Verified"
        : documentsRequested
          ? "Awaiting approval"
          : "Missing",
      currentUploads["rett-reference"] ? localize(ar, "Uploaded for review", "مرفوع للمراجعة") : approved ? localize(ar, "Verified", "متحقق") : documentsRequested ? localize(ar, "Awaiting approval", "بانتظار الاعتماد") : localize(ar, "Missing", "ناقص"),
    ],
    ["subdivision", localize(ar, "Unit subdivision document", "مستند فرز الوحدة"), "Not applicable", localize(ar, "Not applicable", "لا ينطبق")],
    ["mortgagee", localize(ar, "Mortgagee approval", "موافقة الجهة المرتهنة"), currentUploads.mortgagee ? "Awaiting approval" : approved ? "Verified" : "Awaiting approval", currentUploads.mortgagee ? localize(ar, "Uploaded for review", "مرفوع للمراجعة") : approved ? localize(ar, "Verified", "متحقق") : localize(ar, "Awaiting approval", "بانتظار الاعتماد")],
    ["sales-contract", localize(ar, "Signed sales contract", "عقد البيع الموقّع"), "Verified", localize(ar, "Verified", "متحقق")],
    ["evidence", localize(ar, "Evidence attachments", "مرفقات الإثبات"), "Verified", localize(ar, "Verified", "متحقق")],
  ];
  const documentLabels: Record<string, string> = {
    SELLER_ID: localize(ar, "Seller identity / representative", "هوية البائع / الممثل النظامي"),
    BUYER_ID: localize(ar, "Buyer identity", "هوية المشتري"),
    TITLE_DEED: localize(ar, "Electronic title deed / property sheet", "الصك الإلكتروني / صحيفة العقار"),
    BENEFICIARY_IBAN: localize(ar, "Active beneficiary IBAN", "آيبان المستفيد النشط"),
    RETT_REFERENCE: localize(ar, "Real estate transaction tax reference", "مرجع ضريبة التصرفات العقارية"),
    UNIT_SUBDIVISION: localize(ar, "Unit subdivision document", "مستند فرز الوحدة"),
    MORTGAGEE_APPROVAL: localize(ar, "Mortgagee approval", "موافقة الجهة المرتهنة"),
    SIGNED_CONTRACT: localize(ar, "Signed sales contract", "عقد البيع الموقّع"),
    EVIDENCE: localize(ar, "Evidence attachments", "مرفقات الإثبات"),
  };
  const statusLabels: Record<string, string> = {
    MISSING: localize(ar, "Missing", "ناقص"), UPLOADED: localize(ar, "Uploaded for review", "مرفوع للمراجعة"),
    VERIFIED: localize(ar, "Verified", "متحقق"), REJECTED: localize(ar, "Correction required", "مطلوب تصحيح"),
    NOT_APPLICABLE: localize(ar, "Not applicable", "لا ينطبق"),
  };
  const checks: [string, string, string, string][] = selectedCase
    ? selectedCase.documents.map((document) => [document.id, documentLabels[document.documentType] ?? document.documentType, document.status, statusLabels[document.status] ?? document.status])
    : previewChecks;

  async function uploadTransferDocument(document: TransferDocument, file: File) {
    setTransferBusy(true);
    setTransferNotice(localize(ar, "Uploading document…", "جاري رفع المستند…"));
    try {
      const request = await commercialApi.requestTransferDocumentUpload(document.id, { fileName: file.name, mimeType: file.type, sizeBytes: file.size });
      const uploaded = await fetch(request.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!uploaded.ok) throw new Error(localize(ar, "Object storage rejected the upload", "رفض مستودع الملفات عملية الرفع"));
      await commercialApi.confirmTransferDocumentUpload(document.id);
      await refreshTransferCases();
      setTransferNotice(localize(ar, "Document uploaded and queued for manager review.", "تم رفع المستند وإرساله لمراجعة المدير."));
    } catch (error) {
      setTransferNotice(error instanceof Error ? error.message : localize(ar, "Upload failed", "فشل رفع المستند"));
    } finally { setTransferBusy(false); }
  }

  async function reviewDocument(id: string, status: "VERIFIED" | "REJECTED") {
    if (!persistent) {
      setReviewDecisions((current) => ({ ...current, [selectedTransfer[0]]: { ...(current[selectedTransfer[0]] ?? {}), [id]: status === "VERIFIED" ? "approved" : "changes" } }));
      return;
    }
    setTransferBusy(true);
    try {
      await commercialApi.reviewTransferDocument(id, { status, ...(reviewNote.trim() ? { notes: reviewNote.trim() } : {}) });
      await refreshTransferCases();
    } catch (error) { setTransferNotice(error instanceof Error ? error.message : localize(ar, "Review failed", "فشلت المراجعة")); }
    finally { setTransferBusy(false); }
  }
  function approveReadiness() {
    setRows((current) =>
      current.map((row) =>
        row[0] === selectedTransfer[0]
          ? [row[0], row[1], row[2], row[3], "100%", "—", "Ready"]
          : row,
      ),
    );
  }
  return (
    <main className="suite-dashboard">
      <section className="suite-metrics transfer-metrics">
        <Metric value={String(rows.length)} label={localize(ar, "Transfers in progress", "عمليات الإفراغ الجارية")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric
          value={String(rows.filter((row) => row[6] === "Ready" || row[6] === "Approved").length)}
          label={localize(ar, "Ready for handoff", "جاهز للتسليم")}
          tone="good"
          caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")}
        />
        <Metric
          value={String(rows.filter((row) => row[5] !== "—").length)}
          label={localize(ar, "Awaiting documents", "بانتظار المستندات")}
          caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")}
        />
        <Metric value={String(rows.filter((row) => row[6] === "In review").length)} label={localize(ar, "Government review", "المراجعة الحكومية")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value={String(rows.filter((row) => Number(row[4].replace("%", "")) < 70).length)} label={localize(ar, "Blocked", "متعثر")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
        <Metric value={localize(ar, "SAR 84.6M", "84.6 مليون ر.س")} label={localize(ar, "Value in closing", "القيمة قيد الإغلاق")} caption={localize(ar, "Portfolio current view", "عرض المحفظة الحالي")} />
      </section>
      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div>
            <h2>{localize(ar, "Title transfer readiness queue", "قائمة جاهزية الإفراغ العقاري")}</h2>
            <p>
              {localize(ar, "Sold-unit closing, compliance and authorized government handoff", "إغلاق الوحدات المباعة والامتثال والتسليم عبر القنوات الحكومية المعتمدة")}
            </p>
            <small>{localize(ar, `${projectRows.length} of ${rows.length} files in the current project view`, `${projectRows.length} من أصل ${rows.length} ملفاً ضمن عرض المشروع الحالي`)}</small>
          </div>
          <div className="suite-filter-row">
            <select
              value={project}
              onChange={(event) => onProjectChange(event.target.value)}
            >
              {(persistent ? Array.from(new Set(transferCases.map((item) => item.project.name))).map((name) => ({ name })) : projects).map((item) => (
                <option key={item.name} value={item.name}>{projectDisplayName(ar, item.name)}</option>
              ))}
            </select>
            <button className="button button-secondary">{localize(ar, "Export queue", "تصدير القائمة")}</button>
          </div>
        </div>
        <div className="transfer-table">
          <div className="transfer-row transfer-head">
            <span>{localize(ar, "Unit", "الوحدة")}</span>
            <span>{localize(ar, "Project", "المشروع")}</span>
            <span>{localize(ar, "Buyer", "المشتري")}</span>
            <span>{localize(ar, "Sale value", "قيمة البيع")}</span>
            <span>{localize(ar, "Readiness", "الجاهزية")}</span>
            <span>{localize(ar, "Blocking item", "العنصر المعيق")}</span>
            <span>{localize(ar, "Handoff status", "حالة التسليم")}</span>
          </div>
          {transferNotice ? <div className="transfer-notice" role="status">{transferNotice}</div> : null}
          {projectRows.map((r) => (
            <button
              type="button"
              className={
                selectedTransfer[0] === r[0]
                  ? "transfer-row transfer-select-row selected"
                  : "transfer-row transfer-select-row"
              }
              key={r[0]}
              onClick={() => {
                setSelectedId(r[0]);
                setDocumentsRequested(false);
              }}
            >
              {r.map((x, i) => <span key={i}>{i === 1 ? projectDisplayName(ar, x) : i === 2 ? buyerDisplayName(ar, x) : i === 3 ? localize(ar, `SAR ${x}`, `${x} ر.س`) : i === 5 ? transferBlockerLabel(ar, x) : i === 6 ? transferStatusLabel(ar, x) : x}</span>)}
            </button>
          ))}
          {projectRows.length === 0 ? (
            <div className="transfer-empty">
              {localize(ar, "No transfer files for this project.", "لا توجد ملفات إفراغ لهذا المشروع.")}
            </div>
          ) : null}
        </div>
      </section>
      <section className="transfer-file">
        <article className="suite-panel">
          <div className="suite-panel-heading">
            <div>
              <p className="eyebrow">ملف الإفراغ</p>
              <h2>{localize(ar, "Title Transfer File", "ملف الإفراغ العقاري")} · {selectedTransfer[0]}</h2>
              <p>
                {projectDisplayName(ar, selectedTransfer[1])} · {buyerDisplayName(ar, selectedTransfer[2])} · {localize(ar, `SAR ${selectedTransfer[3]}`, `${selectedTransfer[3]} ر.س`)}
              </p>
            </div>
            <strong>{selectedTransfer[4]} {localize(ar, "ready", "جاهز")}</strong>
          </div>
          <div className="checklist">
            {checks.map(([id, label, status, statusLabel]) => {
              const persistentDocument = selectedCase?.documents.find((document) => document.id === id);
              return (
              <div key={id} className="transfer-document-row">
                <span><b>{label}</b>{persistentDocument?.fileName || currentUploads[id] ? <small>{persistentDocument?.fileName ?? currentUploads[id]}</small> : null}</span>
                <strong
                  className={`check-${status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {statusLabel}
                </strong>
                <label className="transfer-upload-control" aria-disabled={transferBusy}><FileArrowUp size={16} /><span>{localize(ar, "Upload / replace", "رفع / استبدال")}</span><input disabled={transferBusy || status === "NOT_APPLICABLE"} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (persistentDocument) void uploadTransferDocument(persistentDocument, file); else setUploadedDocuments((current) => ({ ...current, [selectedTransfer[0]]: { ...(current[selectedTransfer[0]] ?? {}), [id]: file.name } })); event.currentTarget.value = ""; }} /></label>
              </div>
            );})}
          </div>
        </article>
        <aside className="suite-panel transfer-actions">
          <h2>{localize(ar, "Controlled actions", "الإجراءات المحكومة")}</h2>
          <button
            className="button button-secondary"
            onClick={() => setDocumentsRequested(true)}
          >
            {documentsRequested
              ? localize(ar, "Document request sent", "تم إرسال طلب المستندات")
              : localize(ar, "Request missing documents", "طلب المستندات الناقصة")}
          </button>
          <button
            className="button button-primary"
            onClick={() => setReviewOpen(true)}
          >
            <ShieldCheck size={18} />{approved ? localize(ar, "Open approved review", "فتح المراجعة المعتمدة") : localize(ar, "Manager review & approval", "مراجعة واعتماد المدير")}
          </button>
          <button
            className="button button-secondary"
            onClick={() => setIntegrationOpen(true)}
          >
            <PlugsConnected size={18} />{localize(ar, "Government integration setup (deferred)", "إعداد الربط الحكومي (مؤجل)")}
          </button>
          <p>
            {localize(ar, "Final ownership transfer is completed through the authorized government service and requires approved integration access. R4C prepares and governs the transfer file; it does not issue title deeds.", "يُستكمل نقل الملكية النهائي عبر الخدمة الحكومية المعتمدة ويتطلب صلاحية تكامل معتمدة. تقوم R4C بإعداد ملف الإفراغ وحوكمته ولا تُصدر صكوك الملكية.")}
          </p>
        </aside>
      </section>
      {reviewOpen ? <div className="suite-modal-backdrop" role="presentation" onMouseDown={() => setReviewOpen(false)}><section className="suite-modal transfer-review-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-review-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{localize(ar, "Supervisor gate", "بوابة اعتماد المشرف")}</p><h2 id="transfer-review-title">{localize(ar, "Review every customer document", "مراجعة جميع ملفات العميل")}</h2><span>{selectedTransfer[0]} · {buyerDisplayName(ar, selectedTransfer[2])}</span></div><button type="button" aria-label={localize(ar, "Close", "إغلاق")} onClick={() => setReviewOpen(false)}><X size={21} /></button></header><div className="review-role-banner"><ShieldCheck size={22} weight="duotone" /><div><strong>{localize(ar, "Sales manager / supervisor approval", "اعتماد مدير / مشرف المبيعات")}</strong><span>{localize(ar, "Final readiness cannot be approved by the sales agent who prepared the file.", "لا يمكن لمندوب المبيعات مُعدّ الملف اعتماد الجاهزية النهائية.")}</span></div><b>{localize(ar, "Authorized reviewer", "مراجع مخوّل")}</b></div><div className="review-document-list">{checks.map(([id, label, status, statusLabel]) => <article key={id}><div><strong>{label}</strong><span>{selectedCase?.documents.find((document) => document.id === id)?.fileName ?? currentUploads[id] ?? localize(ar, "No uploaded file", "لا يوجد ملف مرفوع")}</span></div><i className={`check-${status.toLowerCase().replaceAll(" ", "-")}`}>{statusLabel}</i><button disabled={transferBusy || status === "MISSING" || status === "NOT_APPLICABLE"} type="button" onClick={() => void reviewDocument(id, "VERIFIED")}><Eye size={16} />{status === "VERIFIED" || currentDecisions[id] === "approved" ? localize(ar, "Reviewed", "تمت المراجعة") : localize(ar, "Review & approve", "مراجعة واعتماد")}</button><button disabled={transferBusy || status === "MISSING" || status === "NOT_APPLICABLE"} type="button" className="review-change" onClick={() => void reviewDocument(id, "REJECTED")}>{localize(ar, "Request correction", "طلب تصحيح")}</button></article>)}</div><label className="review-note"><span>{localize(ar, "Supervisor review note", "ملاحظة المراجع")}</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={localize(ar, "Record the approval basis or required action", "سجّل أساس الاعتماد أو الإجراء المطلوب")} /></label><footer><button className="button button-secondary" type="button" onClick={() => setReviewOpen(false)}>{localize(ar, "Save review draft", "حفظ مسودة المراجعة")}</button><button className="button button-primary" type="button" disabled={transferBusy || (persistent ? selectedCase?.readiness !== 100 : Object.values(currentDecisions).includes("changes"))} onClick={() => { if (persistent && selectedCase) { setTransferBusy(true); void commercialApi.reviewTransferCase(selectedCase.id, "APPROVED").then(refreshTransferCases).then(() => setReviewOpen(false)).catch((error) => setTransferNotice(error instanceof Error ? error.message : localize(ar, "Approval failed", "فشل الاعتماد"))).finally(() => setTransferBusy(false)); } else { approveReadiness(); setReviewOpen(false); } }}>{localize(ar, "Approve file readiness", "اعتماد جاهزية الملف")}</button></footer></section></div> : null}
      {integrationOpen ? <div className="suite-modal-backdrop" role="presentation" onMouseDown={() => setIntegrationOpen(false)}><section className="suite-modal government-integration-modal" role="dialog" aria-modal="true" aria-labelledby="integration-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{localize(ar, "Integration blueprint", "مخطط الربط")}</p><h2 id="integration-title">{localize(ar, "Authorized government channel", "القناة الحكومية المعتمدة")}</h2></div><button type="button" aria-label={localize(ar, "Close", "إغلاق")} onClick={() => setIntegrationOpen(false)}><X size={21} /></button></header><div className="integration-status"><PlugsConnected size={26} weight="duotone" /><div><strong>{localize(ar, "Integration deferred pending authority agreement", "الربط مؤجل لحين الاتفاق مع الجهة")}</strong><span>{localize(ar, "The operational contract is prepared without activating external transmission.", "تم إعداد عقد التشغيل دون تفعيل الإرسال الخارجي.")}</span></div><b>{localize(ar, "Not connected", "غير متصل")}</b></div><div className="integration-contract"><label><span>{localize(ar, "Authority / service", "الجهة / الخدمة")}</span><input value={localize(ar, "To be agreed", "تحدد بعد الاتفاق")} readOnly /></label><label><span>{localize(ar, "Exchange method", "طريقة التبادل")}</span><select defaultValue="api"><option value="api">API</option><option value="file">{localize(ar, "Secure file exchange", "تبادل ملفات آمن")}</option></select></label><label><span>{localize(ar, "Authentication", "المصادقة")}</span><input value={localize(ar, "Authority-issued credentials — pending", "بيانات اعتماد تصدرها الجهة — معلقة")} readOnly /></label><label><span>{localize(ar, "Endpoint", "نقطة الربط")}</span><input value="https://authority.example/api/transfer" readOnly dir="ltr" /></label></div><section><h3>{localize(ar, "Prepared payload", "البيانات المجهزة للإرسال")}</h3><ul><li>{localize(ar, "Transfer reference and unit", "مرجع الإفراغ والوحدة")}</li><li>{localize(ar, "Buyer and seller verified identities", "هويتا البائع والمشتري المتحقق منهما")}</li><li>{localize(ar, "Approved document manifest and hashes", "بيان المستندات المعتمدة وبصماتها")}</li><li>{localize(ar, "Manager approval and audit trail", "اعتماد المدير وسجل التدقيق")}</li></ul></section><footer><button className="button button-secondary" type="button" disabled>{localize(ar, "Test connection after agreement", "اختبار الاتصال بعد الاتفاق")}</button><button className="button button-primary" type="button" onClick={() => setIntegrationOpen(false)}>{localize(ar, "Save deferred integration draft", "حفظ مسودة الربط المؤجل")}</button></footer></section></div> : null}
    </main>
  );
}
