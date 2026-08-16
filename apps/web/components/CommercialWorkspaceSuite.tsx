"use client";

import { useEffect, useMemo, useState } from "react";
import { CommercialOperatorWorkspace } from "./CommercialOperatorWorkspace";
import { useI18n } from "./I18nProvider";
import { CommercialHero3D } from "./CommercialHero3D";

const localize = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;

type Tab = "portfolio" | "units" | "transfer" | "operations";
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
  { left: "23%", top: "29%" },
  { left: "44%", top: "30%" },
  { left: "77%", top: "30%" },
  { left: "23%", top: "70%" },
  { left: "47%", top: "72%" },
  { left: "77%", top: "70%" },
];

const transfers: UnitDashboardRow[] = [
  [
    "RH-A-1204",
    "Riyadh Heights",
    "Ahmed Al Harbi",
    "2,310,000",
    "78%",
    "Mortgagee approval",
    "Not submitted",
  ],
  [
    "JM-B-0911",
    "Jeddah Marina",
    "Noura Al Qahtani",
    "1,850,000",
    "100%",
    "—",
    "Approved",
  ],
  [
    "KR-C-0703",
    "Al Khobar Residences",
    "Faisal Al Dosari",
    "2,975,000",
    "65%",
    "RETT tax reference",
    "In review",
  ],
  [
    "QG-D-0308",
    "Qurtubah Gardens",
    "Maha Al Otaibi",
    "1,620,000",
    "90%",
    "—",
    "Ready",
  ],
  [
    "DV-A-0506",
    "Dammam View",
    "Sara Al Mutairi",
    "1,740,000",
    "82%",
    "Buyer IBAN",
    "Not submitted",
  ],
];

export function CommercialWorkspaceSuite({ preview = false }: { preview?: boolean }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [tab, setTab] = useState<Tab>("portfolio");
  const [project, setProject] = useState("Riyadh Heights");
  const [selectedUnit, setSelectedUnit] = useState("A-1204");
  const [interestOpen, setInterestOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const selected = useMemo(
    () => projects.find((item) => item.name === project) ?? projects[0]!,
    [project],
  );

  function exportReport() {
    const rows = [
      ["Section", "Project", "Record", "Status", "Value"],
      ["Project", selected.name, "Construction progress", "Current snapshot", `${selected.progress}%`],
      ["Project", selected.name, "Units", "Current snapshot", String(selected.units)],
      ["Project", selected.name, "Available units", "Current snapshot", String(selected.available)],
      ["Project", selected.name, "Pending units", "Current snapshot", String(selected.pending)],
      ["Project", selected.name, "Sold units", "Current snapshot", String(selected.sold)],
      ["Project", selected.name, "Lead count", "Current snapshot", String(selected.leads)],
      ...unitsFor("A", 12).map((unit) => ["Unit", selected.name, unit[0], unit[6], unit[5]]),
      ...transfers.filter((row) => row[1] === selected.name).map((row) => ["Title transfer", selected.name, row[0], row[6], row[4]]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.name.toLowerCase().replaceAll(/\\s+/g, "-")}-commercial-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="commercial-suite" dir={ar ? "rtl" : "ltr"}>
      <header className="suite-header">
        <div>
          <p className="eyebrow">{localize(ar, "Commercial intelligence", "الذكاء التجاري")}</p>
          <h1>{localize(ar, "Sales & Development Command Center", "مركز قيادة المبيعات والتطوير")}</h1>
          <p>
            {localize(ar, "Projects, unit inventory, buyer evidence, reservations and closing readiness in one governed workspace.", "المشروعات ومخزون الوحدات وأدلة المشترين والحجوزات وجاهزية الإفراغ في مساحة عمل محكومة واحدة.")}
          </p>
          <p className="data-provenance" role="note">
            {preview
              ? localize(ar, "Development-only preview data. Do not use for operational decisions.", "بيانات معاينة مخصصة للتطوير فقط. لا تستخدم لاتخاذ قرارات تشغيلية.")
              : localize(ar, "Dashboard snapshot data; sales operations below use governed live records.", "بيانات لقطة لوحة المعلومات؛ عمليات المبيعات أدناه تستخدم سجلات حية محكومة.")}
          </p>
        </div>
        <div className="suite-header-actions">
          <label>
            <span>{localize(ar, "Project", "المشروع")}</span>
            <select
              value={project}
              onChange={(event) => setProject(event.target.value)}
            >
              {projects.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <button className="button button-secondary" type="button" onClick={exportReport}>
            {localize(ar, "Export report", "تصدير التقرير")}
          </button>
        </div>
      </header>
      <nav className="suite-tabs" aria-label={localize(ar, "Commercial dashboards", "لوحات المعلومات التجارية")}>
        {(
          [
            ["portfolio", localize(ar, "Executive overview", "النظرة التنفيذية")],
            ["units", localize(ar, "Project & unit control", "إدارة المشروع والوحدات")],
            ["transfer", localize(ar, "Title transfer file", "ملف الإفراغ العقاري")],
            ["operations", localize(ar, "Sales operations", "عمليات المبيعات")],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            id={`commercial-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`commercial-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="suite-context-bar" role="status">
        <div>
          <span className="context-label">{localize(ar, "Working context", "سياق العمل")}</span>
          <strong>{project}</strong>
          <small>{selected.phase} · {selected.progress}% {localize(ar, "construction", "إنشاء")}</small>
        </div>
        <div>
          <span className="context-label">{localize(ar, "Data freshness", "حداثة البيانات")}</span>
          <strong>{localize(ar, "Snapshot", "لقطة")}</strong>
          <small>{localize(ar, "Executive and inventory surfaces", "واجهات التنفيذ والمخزون")}</small>
        </div>
        <div>
          <span className="context-label">{localize(ar, "Next best action", "أفضل إجراء تالٍ")}</span>
          <strong>{localize(ar, "Review 3 exceptions", "مراجعة 3 استثناءات")}</strong>
          <small>{localize(ar, "Missing evidence, aging leads, blocked transfers", "أدلة ناقصة، عملاء متقدمون في العمر، إفراغات متعثرة")}</small>
        </div>
      </div>
      {tab === "portfolio" ? (
        <div id="commercial-panel-portfolio" role="tabpanel" aria-labelledby="commercial-tab-portfolio">
        <PortfolioDashboard
          selectedProject={project}
          onSelectProject={setProject}
          onOpenProject={() => setTab("units")}
          onOpenTransfers={() => setTab("transfer")}
          ar={ar}
        />
        </div>
      ) : null}
      {tab === "units" ? (
        <div id="commercial-panel-units" role="tabpanel" aria-labelledby="commercial-tab-units">
        <UnitDashboard
          project={selected}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          interestOpen={interestOpen}
          setInterestOpen={setInterestOpen}
          saved={saved}
          setSaved={setSaved}
          ar={ar}
        />
        </div>
      ) : null}
      {tab === "transfer" ? (
        <div id="commercial-panel-transfer" role="tabpanel" aria-labelledby="commercial-tab-transfer">
          <TransferDashboard project={project} onProjectChange={setProject} ar={ar} />
        </div>
      ) : null}
      {tab === "operations" ? (
        <div id="commercial-panel-operations" role="tabpanel" aria-labelledby="commercial-tab-operations">
        {preview ? <PreviewSalesOperations project={project} ar={ar} /> : <CommercialOperatorWorkspace />}
        </div>
      ) : null}
    </div>
  );
}

function PreviewSalesOperations({ project, ar }: { project: string; ar: boolean }) {
  const [leadStatus, setLeadStatus] = useState("Qualified");
  const [activity, setActivity] = useState("Site visit scheduled for 18 August, 16:00");
  const [notice, setNotice] = useState("");

  return (
    <main className="workspace-page commercial-operator preview-operations">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{localize(ar, "Sales workflow", "مسار عمل المبيعات")}</p>
          <h1>{localize(ar, "Lead, interest & reservation control", "إدارة العملاء والاهتمامات والحجوزات")}</h1>
          <p>{localize(ar, `Operate the full buyer journey for ${project} with evidence, ownership and approval gates.`, `إدارة رحلة المشتري الكاملة لمشروع ${project} مع الأدلة والملكية وبوابات الاعتماد.`)}</p>
        </div>
        <span className="status-badge">{localize(ar, "Interactive preview", "معاينة تفاعلية")}</span>
      </header>

      {notice ? <p className="success-message" aria-live="polite">{notice}</p> : null}

      <section className="commercial-journey-grid">
        <form className="create-panel commercial-capture" onSubmit={(event) => {
          event.preventDefault();
          setNotice("Lead captured and assigned to the project sales queue.");
          event.currentTarget.reset();
        }}>
          <p className="eyebrow">{localize(ar, "New enquiry", "استفسار جديد")}</p>
          <h2>{localize(ar, "Capture buyer evidence", "تسجيل بيانات وأدلة المشتري")}</h2>
          <label><span>{localize(ar, "Customer name", "اسم العميل")}</span><input name="name" defaultValue="Lina Al Rashid" required /></label>
          <label><span>{localize(ar, "Contact number", "رقم التواصل")}</span><input name="phone" defaultValue="+966 55 240 8812" required /></label>
          <label><span>{localize(ar, "Email", "البريد الإلكتروني")}</span><input name="email" type="email" defaultValue="lina@example.com" required /></label>
          <label><span>{localize(ar, "Evidence / source", "الدليل / المصدر")}</span><input name="source" defaultValue="Website enquiry — floor plan downloaded" required /></label>
          <button className="button button-primary">{localize(ar, "Record interest", "تسجيل اهتمام")}</button>
        </form>

        <section className="create-panel commercial-pipeline">
          <div className="section-heading"><div><p className="eyebrow">{localize(ar, "Active opportunity", "فرصة نشطة")}</p><h2>Ahmed Al Harbi</h2></div><span className="status-badge">{leadStatus}</span></div>
          <dl>
            <div><dt>Project</dt><dd>{project}</dd></div>
            <div><dt>Preferred unit</dt><dd>A-1204 · 3BR · Floor 12</dd></div>
            <div><dt>Contact</dt><dd>+966 50 318 4472<br />ahmed@example.com</dd></div>
            <div><dt>Evidence</dt><dd>Site visit · ID received</dd></div>
          </dl>
          <div className="lead-actions">
            <button className="button button-primary" type="button" onClick={() => { setLeadStatus(localize(ar, "Reservation pending", "الحجز قيد الاعتماد")); setNotice(localize(ar, "Unit A-1204 placed in the reservation approval queue.", "تمت إضافة الوحدة A-1204 إلى قائمة اعتماد الحجوزات.")); }}>{localize(ar, "Create reservation", "إنشاء حجز")}</button>
            <button className="button button-secondary" type="button" onClick={() => { setLeadStatus(localize(ar, "Follow-up", "متابعة")); setNotice(localize(ar, "Follow-up task assigned to the sales owner.", "تم إسناد مهمة المتابعة لمسؤول المبيعات.")); }}>{localize(ar, "Schedule follow-up", "جدولة متابعة")}</button>
          </div>
        </section>
      </section>

      <section className="commercial-work-grid">
        <form className="create-panel" onSubmit={(event) => { event.preventDefault(); setNotice("Activity added to the auditable customer timeline."); }}>
          <p className="eyebrow">{localize(ar, "Evidence timeline", "سجل الأدلة")}</p>
          <h2>{localize(ar, "Log sales activity", "تسجيل نشاط المبيعات")}</h2>
          <label><span>{localize(ar, "Activity note", "ملاحظة النشاط")}</span><textarea value={activity} onChange={(event) => setActivity(event.target.value)} required /></label>
          <button className="button button-primary">{localize(ar, "Save activity", "حفظ النشاط")}</button>
        </form>
        <section className="create-panel unit-review">
          <p className="eyebrow">Selected inventory</p>
          <h2>A-1204 · 3 Bedroom</h2>
          <dl>
            <div><dt>Floor / area</dt><dd>12 · 162.3 m²</dd></div>
            <div>              <dt>{localize(ar, "List price", "السعر المعلن")}</dt><dd>SAR 1,980,000</dd></div>
            <div><dt>Availability</dt><dd>Interest recorded</dd></div>
            <div>              <dt>{localize(ar, "Construction", "الإنشاء")}</dt><dd>{localize(ar, "Structure", "الهيكل")} · 62%</dd></div>
          </dl>
          <button className="button button-secondary" type="button" onClick={() => setNotice("Unit A-1204 opened in Project & unit control.")}>Open linked unit</button>
        </section>
      </section>
    </main>
  );
}

function Metric({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: string;
}) {
  const arabic = /[\u0600-\u06FF]/.test(label);
  return (
    <article className="suite-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{localize(arabic, "Portfolio snapshot", "لقطة المحفظة")}</small>
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
  ar,
}: {
  selectedProject: string;
  onSelectProject: (project: string) => void;
  onOpenProject: () => void;
  onOpenTransfers: () => void;
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
        />
        <div className="executive-hero-copy">
          <p className="eyebrow">{localize(ar, "Development snapshot", "لقطة المشروع")}</p>
          <h2>{focusedProject.name}</h2>
          <p>
            {focusedProject.city} · {focusedProject.phase} · {localize(ar, "construction", "الإنشاء")} {" "}
            {focusedProject.progress}%
          </p>
          <div>
            <span>{localize(ar, "Drag across the model", "حرّك المؤشر فوق النموذج")}</span>
            <strong>{focusedProject.sold} {localize(ar, "units sold", "وحدة مباعة")}</strong>
          </div>
        </div>
      </section>
      <section className="suite-metrics">
        <Metric value="8" label={localize(ar, "Active projects", "المشروعات النشطة")} />
        <Metric value="1,248" label={localize(ar, "Total units", "إجمالي الوحدات")} />
        <Metric value="684" label={localize(ar, "Sold", "المباع")} tone="good" />
        <Metric value="92" label={localize(ar, "Pending / reserved", "قيد الانتظار / محجوز")} />
        <Metric value="147" label={localize(ar, "Active leads", "العملاء المحتملون النشطون")} />
        <Metric value="SAR 1.84B" label={localize(ar, "Contracted value", "القيمة التعاقدية")} tone="good" />
      </section>
      <section className="portfolio-layout">
        <div className="suite-panel">
          <div className="suite-panel-heading">
            <div>
              <h2>{localize(ar, "Project portfolio", "محفظة المشروعات")}</h2>
              <p>{localize(ar, "Construction delivery, inventory and commercial performance", "التنفيذ الإنشائي والمخزون والأداء التجاري")}</p>
            </div>
            <div className="suite-filter-row">
              <select aria-label="City">
                <option>{localize(ar, "All cities", "كل المدن")}</option>
                <option>Riyadh</option>
                <option>Jeddah</option>
              </select>
              <select aria-label="Phase">
                <option>{localize(ar, "All phases", "كل المراحل")}</option>
                <option>Structure</option>
                <option>Finishing</option>
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
                  {p.name}
                  <small>{p.city}</small>
                </strong>
                <span>{p.phase}</span>
                <span>
                  {p.progress}%<Bar value={p.progress} />
                </span>
                <span>{p.units}</span>
                <span>{p.available}</span>
                <span>{p.pending}</span>
                <span className="good">{p.sold}</span>
                <span>{p.leads}</span>
                <strong>SAR {p.value}</strong>
              </button>
            ))}
          </div>
        </div>
        <aside className="suite-panel project-summary-drawer">
          <img
            className="project-visual"
            src="/assets/commercial/riyadh-heights.png"
            alt={`${focusedProject.name} residential development`}
          />
          <div className="project-summary-title">
            <strong>{focusedProject.name}</strong>
            <span>{focusedProject.city}</span>
          </div>
          <dl>
            <div>
              <dt>{localize(ar, "Current phase", "المرحلة الحالية")}</dt>
              <dd>{focusedProject.phase}</dd>
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
              <dd>SAR {focusedProject.value}</dd>
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
      <section className="suite-attention-grid">
        <div className="suite-attention-intro">
          <p className="eyebrow">{localize(ar, "Decision queue", "قائمة القرارات")}</p>
          <h2>{localize(ar, "Attention before analytics", "الانتباه قبل التحليلات")}</h2>
          <p>{localize(ar, "A focused queue for the few issues most likely to change this week’s commercial outcome.", "قائمة مركزة بأهم الاستثناءات التي قد تغير النتيجة التجارية لهذا الأسبوع.")}</p>
        </div>
        <button type="button" className="attention-card attention-card-warning" onClick={onOpenProject}>
          <span>{localize(ar, "Inventory", "المخزون")}</span>
          <strong>{localize(ar, "12 units need a pricing review", "12 وحدة تحتاج مراجعة سعر")}</strong>
          <small>{localize(ar, "Open unit control →", "فتح إدارة الوحدات ←")}</small>
        </button>
        <button type="button" className="attention-card attention-card-danger" onClick={onOpenTransfers}>
          <span>{localize(ar, "Closing readiness", "جاهزية الإغلاق")}</span>
          <strong>{localize(ar, "5 transfers are in government review", "5 إفراغات قيد المراجعة الحكومية")}</strong>
          <small>{localize(ar, "Open title-transfer file →", "فتح ملف الإفراغ ←")}</small>
        </button>
        <button type="button" className="attention-card attention-card-teal" onClick={onOpenProject}>
          <span>{localize(ar, "Buyer momentum", "زخم المشترين")}</span>
          <strong>{localize(ar, "16 reservations need a next action", "16 حجزاً تحتاج إجراءً تالياً")}</strong>
          <small>{localize(ar, "Open the commercial workspace →", "فتح مساحة المبيعات ←")}</small>
        </button>
      </section>
      <section className="suite-analytics">
        <Chart
          title={localize(ar, "Sales vs construction progress", "تقدم المبيعات مقابل الإنشاء")}
          values={[38, 46, 52, 59, 66, 71]}
          second={[24, 31, 39, 47, 54, 62]}
        />
        <Chart
          title={localize(ar, "Quarterly reservation value (SAR M)", "قيمة الحجوزات الفصلية (مليون ر.س)")}
          values={[31, 46, 52, 48, 67, 82]}
        />
        <article className="suite-panel suite-funnel">
          <h2>{localize(ar, "Lead conversion", "تحويل العملاء المحتملين")}</h2>
          {[
            [localize(ar, "New leads", "عملاء محتملون جدد"), 147, 100],
            [localize(ar, "Contacted", "تم التواصل"), 98, 67],
            [localize(ar, "Qualified", "مؤهل"), 62, 42],
            [localize(ar, "Site visit", "زيارة موقع"), 34, 23],
            [localize(ar, "Reserved", "محجوز"), 16, 11],
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
              <dd>SAR 1.84B</dd>
            </div>
            <div>
              <dt>{localize(ar, "Weighted forecast", "التوقع المرجح")}</dt>
              <dd>SAR 2.63B</dd>
            </div>
            <div>
              <dt>{localize(ar, "Average price / m²", "متوسط السعر / م²")}</dt>
              <dd>SAR 7,512</dd>
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
              {localize(ar, "Portfolio-level ownership-transfer readiness; detailed files remain in their dedicated tab.", "جاهزية نقل الملكية على مستوى المحفظة؛ توجد الملفات التفصيلية في علامة التبويب المخصصة.")}
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
            <strong>SAR 84.6M</strong>
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
}: {
  title: string;
  values: number[];
  second?: number[];
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
        <span>Dec</span>
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
      </div>
    </article>
  );
}

function localizedUnitType(ar: boolean, value: string) {
  return ar ? ({ "All unit types": "كل أنواع الوحدات", Studio: "استوديو", "2BR": "غرفتان", "3BR": "3 غرف" }[value] ?? value) : value;
}

function localizedUnitStatus(ar: boolean, value: string) {
  return ar ? ({ "All statuses": "كل الحالات", Available: "متاح", Reserved: "محجوز", Sold: "مباع", Interest: "اهتمام", Held: "موقوف" }[value] ?? value) : value;
}

function localizedView(ar: boolean, value: string) {
  return ar ? ({ "All views": "كل الإطلالات", Park: "حديقة", City: "مدينة" }[value] ?? value) : value;
}

function UnitDashboard({
  project,
  selectedUnit,
  setSelectedUnit,
  interestOpen,
  setInterestOpen,
  saved,
  setSaved,
  ar,
}: {
  project: ProjectDashboardRecord;
  selectedUnit: string;
  setSelectedUnit: (s: string) => void;
  interestOpen: boolean;
  setInterestOpen: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
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

  useEffect(() => {
    if (!interestOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setInterestOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [interestOpen, setInterestOpen]);

  function chooseLocation(nextBuilding: string, nextFloor: number) {
    setBuilding(nextBuilding);
    setFloor(nextFloor);
    setSelectedUnit(unitsFor(nextBuilding, nextFloor)[0]![0]);
  }
  return (
    <main className="suite-dashboard">
      <section className="suite-metrics">
        <Metric value={`${project.progress}%`} label={localize(ar, "Construction", "الإنشاء")} />
        <Metric value={project.phase} label={localize(ar, "Current phase", "المرحلة الحالية")} />
        <Metric value={String(project.units)} label={localize(ar, "Total units", "إجمالي الوحدات")} />
        <Metric
          value={String(project.available)}
          label={localize(ar, "Available", "المتاح")}
          tone="good"
        />
        <Metric value={String(project.pending)} label={localize(ar, "Held / reserved", "موقوف / محجوز")} />
        <Metric value="18" label={localize(ar, "Number of floors", "عدد الأدوار")} />
      </section>
      <section className="unit-layout">
        <aside className="suite-panel floor-navigator">
          <div>
            <p className="eyebrow">{localize(ar, "Building navigator", "مستعرض المباني")}</p>
            <h2>{localize(ar, "18 floors", "18 دوراً")}</h2>
            <small>{localize(ar, "320 units across 2 buildings", "320 وحدة ضمن مبنيين")}</small>
          </div>
          <div className="building-switcher">
            {["Building A", "Building B"].map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={building === item}
                onClick={() => chooseLocation(item, floor)}
              >
                {localize(ar, item, item === "Building A" ? "المبنى أ" : "المبنى ب")}
              </button>
            ))}
          </div>
          <div className="floor-list" aria-label="Select floor">
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
                    6 units ·{" "}
                    {
                      unitsFor(building, item).filter(
                        (row) => row[6] === "Available",
                      ).length
                    }{" "}
                    {localize(ar, "available", "متاح")}
                  </small>
                </button>
              ),
            )}
          </div>
        </aside>
        <div className="suite-panel unit-main">
          <div className="suite-panel-heading">
            <div>
              <h2>{localize(ar, `${project.name} unit inventory`, `مخزون وحدات ${project.name}`)}</h2>
              <p>
                {localize(ar, building, building === "Building A" ? "المبنى أ" : "المبنى ب")} · {localize(ar, "Floor", "الدور")} {floor} {localize(ar, "of 18 · commercial snapshot", "من 18 · لقطة الحالة التجارية")}
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
              <option value="All unit types">{localizedUnitType(ar, "All unit types")}</option>
              <option value="Studio">{localizedUnitType(ar, "Studio")}</option>
              <option value="2BR">{localizedUnitType(ar, "2BR")}</option>
              <option value="3BR">{localizedUnitType(ar, "3BR")}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All statuses">{localizedUnitStatus(ar, "All statuses")}</option>
              <option value="Available">{localizedUnitStatus(ar, "Available")}</option>
              <option value="Reserved">{localizedUnitStatus(ar, "Reserved")}</option>
              <option value="Sold">{localizedUnitStatus(ar, "Sold")}</option>
            </select>
            <select>
              <option value="All views">{localizedView(ar, "All views")}</option>
              <option value="Park">{localizedView(ar, "Park")}</option>
              <option value="City">{localizedView(ar, "City")}</option>
            </select>
          </div>
          <div className="unit-status-legend" aria-label={localize(ar, "Unit status legend", "دليل حالات الوحدات")}>
            {(["Available", "Interest", "Held", "Reserved", "Sold"] as const).map((status) => (
              <span key={status} className={`legend-item status-${status.toLowerCase()}`}>
                <i aria-hidden="true" />
                {localizedUnitStatus(ar, status)}
              </span>
            ))}
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
                    {i === 1 ? localizedUnitType(ar, x) : i === 6 ? localizedUnitStatus(ar, status) : x}
                  </span>
                ))}
              </button>
            ))}
          </div>
          <div className="floor-map-heading">
            <div>
              <strong>
                {localize(ar, building, building === "Building A" ? "المبنى أ" : "المبنى ب")} · {localize(ar, "Floor", "الدور")} {floor} {localize(ar, "layout", "مخطط")}
              </strong>
              <span>{localize(ar, "6 units · 1,004.9 m² gross floor area", "6 وحدات · 1,004.9 م² مساحة إجمالية للدور")}</span>
            </div>
            <span>{localize(ar, "North ↑", "الشمال ↑")}</span>
          </div>
          <div className="floor-plan-wrap">
            <img
              className="floor-plan-image"
              src="/assets/commercial/floor-12-layout.png"
              alt={`${building} floor ${floor} architectural unit layout`}
            />
            {floorUnits.map(({ row, status }, index) => (
              <button
                type="button"
                key={row[0]}
                className={`floor-hotspot status-${status.toLowerCase()} ${selectedUnit === row[0] ? "selected" : ""}`}
                style={floorHotspots[index]}
                onClick={() => setSelectedUnit(row[0])}
                aria-label={localize(ar, `Select unit ${row[0]}, ${status}`, `اختيار الوحدة ${row[0]}، ${localizedUnitStatus(true, status)}`)}
              >
                {row[0]}
              </button>
            ))}
          </div>
          <div
            className="floor-map"
            aria-label={localize(ar, `${building} floor ${floor} unit status controls`, `${building === "Building A" ? "المبنى أ" : "المبنى ب"} أدوات حالة وحدات الدور ${floor}`)}
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
              {localizedUnitStatus(ar, selectedRow.status)}
            </span>
          </div>
          <dl>
            <div>
              <dt>{localize(ar, "Type", "النوع")}</dt>
              <dd>{selectedRow.row[1]} Apartment</dd>
            </div>
            <div>
              <dt>{localize(ar, "Gross / net", "الإجمالي / الصافي")}</dt>
              <dd>
                {selectedRow.row[3]} / {selectedRow.row[4]} m²
              </dd>
            </div>
            <div>
              <dt>{localize(ar, "Orientation / view", "الاتجاه / الإطلالة")}</dt>
              <dd>NW / Park</dd>
            </div>
            <div>
              <dt>{localize(ar, "List price", "السعر المعلن")}</dt>
              <dd>SAR {selectedRow.row[5]}</dd>
            </div>
            <div>
              <dt>{localize(ar, "Price / m²", "السعر / م²")}</dt>
              <dd>SAR 12,205</dd>
            </div>
            <div>
              <dt>{localize(ar, "Construction", "الإنشاء")}</dt>
              <dd>Structure · 62%</dd>
            </div>
          </dl>
          <details className="unit-detail-section" open>
            <summary>{localize(ar, "Measurements", "القياسات")}</summary>
          <dl>
            <div>
              <dt>Living & dining</dt>
              <dd>38.40 m²</dd>
            </div>
            <div>
              <dt>Kitchen</dt>
              <dd>12.30 m²</dd>
            </div>
            <div>
              <dt>Master bedroom</dt>
              <dd>20.10 m²</dd>
            </div>
            <div>
              <dt>Bedrooms 2 & 3</dt>
              <dd>29.70 m²</dd>
            </div>
            <div>
              <dt>Balcony</dt>
              <dd>11.80 m²</dd>
            </div>
          </dl>
          </details>
          <details className="unit-detail-section">
            <summary>{localize(ar, "Price history", "سجل الأسعار")}</summary>
          <dl>
            <div>
              <dt>18 May 2025</dt>
              <dd>SAR 1,980,000</dd>
            </div>
            <div>
              <dt>05 May 2025</dt>
              <dd>SAR 2,050,000</dd>
            </div>
            <div>
              <dt>20 Apr 2025</dt>
              <dd>SAR 2,100,000</dd>
            </div>
          </dl>
          </details>
          <details className="unit-detail-section" open>
            <summary>{localize(ar, "Buyer activity evidence", "أدلة نشاط المشتري")}</summary>
          <ol className="transfer-timeline">
            <li>Website enquiry received</li>
            <li>Call logged · no answer</li>
            <li>WhatsApp message delivered</li>
            <li>Brochure.pdf uploaded</li>
          </ol>
          </details>
          <div className="unit-action-stack">
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
            onClick={() =>
              setStatusOverrides((current) => ({
                ...current,
                [selectedRow.row[0]]: "Reserved",
              }))
            }
          >
            {localize(ar, "Create reservation", "إنشاء حجز")}
          </button>
          </div>
        </aside>
      </section>
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
            aria-labelledby="commercial-interest-title"

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
                <p className="eyebrow">Buyer evidence</p>
                <h2 id="commercial-interest-title">{localize(ar, `Record interest for ${selectedUnit}`, `تسجيل اهتمام للوحدة ${selectedUnit}`)}</h2>
              </div>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setInterestOpen(false)}
                autoFocus
              >
                {localize(ar, "Close", "إغلاق")}
              </button>
            </div>
            <label>
              Full name
              <input required defaultValue="Mohammed Abdullah" />
            </label>
            <label>
              Mobile number
              <input required inputMode="tel" defaultValue="+966 50 123 4567" />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                defaultValue="m.abdullah@example.com"
              />
            </label>
            <label>
              Source
              <select>
                <option>Website</option>
                <option>Sales agent</option>
                <option>Referral</option>
              </select>
            </label>
            <label>
              Notes
              <textarea defaultValue="Interested in park-view units on high floors." />
            </label>
            <label>
              Evidence attachment
              <input type="file" />
            </label>
            <label className="check-row">
              <input type="checkbox" required defaultChecked />
              <span>Buyer consent to contact is recorded</span>
            </label>
            {saved ? (
              <p className="success-message">
                Interest and buyer evidence saved.
              </p>
            ) : null}
            <button className="button button-primary">Save interest</button>
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
}: {
  project: string;
  onProjectChange: (project: string) => void;
  ar: boolean;
}) {
  const [rows, setRows] = useState<UnitDashboardRow[]>(transfers);
  const [selectedId, setSelectedId] = useState(
    transfers.find((row) => row[1] === project)?.[0] ?? transfers[0]![0],
  );
  const [documentsRequested, setDocumentsRequested] = useState(false);
  const projectRows = rows.filter((row) => row[1] === project);
  const selectedTransfer =
    rows.find((row) => row[0] === selectedId) ?? projectRows[0] ?? rows[0]!;
  const approved = selectedTransfer[4] === "100%";

  useEffect(() => {
    const next = rows.find((row) => row[1] === project);
    if (next) setSelectedId(next[0]);
  }, [project, rows]);

  const checks: [string, string][] = [
    ["Seller identity / representative", "Verified"],
    ["Buyer identity", "Verified"],
    ["Electronic title deed / property sheet", "Verified"],
    ["Active beneficiary IBAN", "Verified"],
    [
      "Real estate transaction tax reference",
      approved
        ? "Verified"
        : documentsRequested
          ? "Awaiting approval"
          : "Missing",
    ],
    ["Unit subdivision document", "Not applicable"],
    ["Mortgagee approval", approved ? "Verified" : "Awaiting approval"],
    ["Signed sales contract", "Verified"],
    ["Evidence attachments", "Verified"],
  ];
  function approveReadiness() {
    setRows((current) =>
      current.map((row) =>
        row[0] === selectedTransfer[0]
          ? [row[0], row[1], row[2], row[3], "100%", "—", "Ready"]
          : row,
      ),
    );
  }
  function submitTransfer() {
    setRows((current) =>
      current.map((row) =>
        row[0] === selectedTransfer[0]
          ? [row[0], row[1], row[2], row[3], row[4], row[5], "Approved"]
          : row,
      ),
    );
  }
  return (
    <main className="suite-dashboard">
      <section className="suite-metrics transfer-metrics">
        <Metric value="34" label={localize(ar, "Transfers in progress", "عمليات الإفراغ الجارية")} />
        <Metric
          value={String(18 + rows.filter((row) => row[6] === "Ready").length)}
          label={localize(ar, "Ready for handoff", "جاهز للتسليم")}
          tone="good"
        />
        <Metric
          value={String(rows.filter((row) => row[5] !== "—").length)}
          label={localize(ar, "Awaiting documents", "بانتظار المستندات")}
        />
        <Metric value="5" label={localize(ar, "Government review", "المراجعة الحكومية")} />
        <Metric value="2" label={localize(ar, "Blocked", "متعثر")} />
        <Metric value="SAR 84.6M" label={localize(ar, "Value in closing", "القيمة قيد الإغلاق")} />
      </section>
      <section className="suite-panel">
        <div className="suite-panel-heading">
          <div>
            <h2>{localize(ar, "Title transfer readiness queue", "قائمة جاهزية الإفراغ العقاري")}</h2>
            <p>
              {localize(ar, "Sold-unit closing, compliance and authorized government handoff", "إغلاق الوحدات المباعة والامتثال والتسليم عبر القنوات الحكومية المعتمدة")}
            </p>
          </div>
          <div className="suite-filter-row">
            <select
              value={project}
              onChange={(event) => onProjectChange(event.target.value)}
            >
              {projects.map((item) => (
                <option key={item.name}>{item.name}</option>
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
              {r.map((x, i) => (
                <span key={i}>{i === 3 ? `SAR ${x}` : x}</span>
              ))}
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
                {selectedTransfer[1]} · {selectedTransfer[2]} · SAR{" "}
                {selectedTransfer[3]}
              </p>
            </div>
            <strong>{selectedTransfer[4]} {localize(ar, "ready", "جاهز")}</strong>
          </div>
          <div className="checklist">
            {checks.map(([label, status]) => (
              <div key={label}>
                <span>{label}</span>
                <strong
                  className={`check-${status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {status}
                </strong>
              </div>
            ))}
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
            onClick={approveReadiness}
            disabled={approved}
          >
            {localize(ar, "Approve readiness", "اعتماد الجاهزية")}
          </button>
          <button
            className="button button-primary"
            disabled={!approved || selectedTransfer[6] === "Approved"}
            onClick={submitTransfer}
          >
            {localize(ar, "Submit to authorized government channel", "الإرسال إلى القناة الحكومية المعتمدة")}
          </button>
          <p>
            {localize(ar, "Final ownership transfer is completed through the authorized government service and requires approved integration access. R4C prepares and governs the transfer file; it does not issue title deeds.", "يُستكمل نقل الملكية النهائي عبر الخدمة الحكومية المعتمدة ويتطلب صلاحية تكامل معتمدة. تقوم R4C بإعداد ملف الإفراغ وحوكمته ولا تُصدر صكوك الملكية.")}
          </p>
        </aside>
      </section>
    </main>
  );
}
