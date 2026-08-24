"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { crmApi, type CrmActivity, type CrmContact, type CrmOpportunity, type CrmTask, type OpportunityStage } from "../lib/crm-api";
import { salesText } from "../lib/sales-i18n";
import { ClientApiError } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

const stages: OpportunityStage[] = ["QUALIFICATION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "RESERVED", "WON", "LOST", "DISQUALIFIED"];
const activeStages = stages.slice(0, 6);
const activityTypes = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "SITE_VISIT", "NOTE"] as const;
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
type DrawerAction = "contact" | "opportunity" | "activity" | "task" | "quotation" | null;

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value));
}
function formatMoney(value: string | number | null, currency: string | null, locale: string) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: currency || "SAR", maximumFractionDigits: 0 }).format(Number(value) / 100);
}
function personName(contact: CrmContact | null) { return contact ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}` : "—"; }
function displayStage(stage: OpportunityStage, ar: boolean) {
  const labels: Record<OpportunityStage, [string, string]> = { QUALIFICATION: ["Qualification", "تأهيل"], DISCOVERY: ["Discovery", "استكشاف"], PROPOSAL: ["Proposal", "عرض"], NEGOTIATION: ["Negotiation", "تفاوض"], RESERVED: ["Reserved", "محجوزة"], WON: ["Won", "ناجحة"], LOST: ["Lost", "خاسرة"], DISQUALIFIED: ["Disqualified", "مستبعدة"] };
  return labels[stage][ar ? 1 : 0];
}
function displayEnum(value: string, ar: boolean) {
  const labels: Record<string, [string, string]> = { CALL: ["Call", "اتصال"], EMAIL: ["Email", "بريد إلكتروني"], WHATSAPP: ["WhatsApp", "واتساب"], MEETING: ["Meeting", "اجتماع"], SITE_VISIT: ["Site visit", "زيارة موقع"], NOTE: ["Note", "ملاحظة"], LOW: ["Low", "منخفضة"], NORMAL: ["Normal", "عادية"], HIGH: ["High", "مرتفعة"], URGENT: ["Urgent", "عاجلة"], OPEN: ["Open", "مفتوحة"], IN_PROGRESS: ["In progress", "قيد التنفيذ"], COMPLETED: ["Completed", "مكتملة"], CANCELLED: ["Cancelled", "ملغاة"] };
  return labels[value]?.[ar ? 1 : 0] ?? value;
}

export function SalesCommandCenter() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [drawer, setDrawer] = useState<DrawerAction>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const drawerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  function openDrawer(action: Exclude<DrawerAction, null>) {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDrawer(action);
  }
  function closeDrawer() {
    setDrawer(null);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [contactResponse, opportunityResponse, taskResponse, activityResponse] = await Promise.all([crmApi.contacts(), crmApi.opportunities(), crmApi.tasks(), crmApi.activities()]);
      setContacts(contactResponse); setOpportunities(opportunityResponse); setTasks(taskResponse); setActivities(activityResponse);
      setSelectedOpportunityId((current) => current || opportunityResponse[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof ClientApiError && cause.status === 403 ? salesText(locale, "noPermission") : salesText(locale, "serverError"));
    } finally { setLoading(false); }
  }, [locale]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!drawer) return;
    const focusableSelector = "button, input, select, textarea, [href], [tabindex]:not([tabindex=\"-1\"])";
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const selectedOpportunity = useMemo(() => opportunities.find((item) => item.id === selectedOpportunityId) ?? null, [opportunities, selectedOpportunityId]);
  const selectedActivities = useMemo(() => selectedOpportunity ? activities.filter((item) => item.opportunityId === selectedOpportunity.id) : activities.slice(0, 8), [activities, selectedOpportunity]);
  const attentionTasks = useMemo(() => tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"), [tasks]);
  const overdueTasks = useMemo(() => attentionTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now()), [attentionTasks]);
  const stagePosition = selectedOpportunity ? Math.max(0, activeStages.indexOf(selectedOpportunity.stage)) : 0;

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(""); setError("");
    try { await action(); closeDrawer(); setNotice(success); await load(); }
    catch (cause) { setError(cause instanceof ClientApiError ? cause.message : salesText(locale, "serverError")); }
  }

  if (loading) return <main className="workspace-page sales-page"><div className="sales-skeleton" aria-busy="true"><span /><span /><span /><span /></div></main>;
  if (error && !contacts.length && !opportunities.length && !tasks.length) return <main className="workspace-page sales-page"><section className="sales-state sales-state-error"><strong>{error}</strong><button className="button button-primary" type="button" onClick={() => void load()}>{salesText(locale, "refresh")}</button></section></main>;

  return <main className="workspace-page sales-page" dir={ar ? "rtl" : "ltr"}>
    <header className="sales-command-header"><div className="sales-heading-copy"><p className="eyebrow">{salesText(locale, "eyebrow")}</p><h1>{salesText(locale, "title")}</h1><p>{salesText(locale, "subtitle")}</p></div><div className="sales-header-actions"><span className="state-pill">{salesText(locale, "synthetic")}</span><button className="button button-secondary" type="button" onClick={() => void load()}>{salesText(locale, "refresh")}</button></div></header>
    {notice ? <p className="sales-notice" role="status">{notice}</p> : null}{error ? <p className="sales-error" role="alert">{error}</p> : null}

    <section className="sales-signal-strip" aria-label={salesText(locale, "overview")}><div className="signal-intro"><span className="signal-kicker">{salesText(locale, "overview")}</span><strong>{attentionTasks.length ? salesText(locale, "attention") : salesText(locale, "emptyWork")}</strong></div><div className="signal-item signal-alert"><span>{salesText(locale, "overdue")}</span><strong>{overdueTasks.length}</strong><small>{salesText(locale, "tasks")}</small></div><div className="signal-item"><span>{salesText(locale, "openWork")}</span><strong>{attentionTasks.length}</strong><small>{salesText(locale, "tasks")}</small></div><div className="signal-item"><span>{salesText(locale, "contacts")}</span><strong>{contacts.length}</strong><small>{salesText(locale, "open")}</small></div><div className="signal-item"><span>{salesText(locale, "opportunities")}</span><strong>{opportunities.length}</strong><small>{salesText(locale, "open")}</small></div></section>

    <section className="sales-action-dock" aria-label={salesText(locale, "quickActions")}><div><p className="eyebrow">{salesText(locale, "quickActions")}</p><span>{salesText(locale, "drawerHint")}</span></div><div className="sales-action-buttons"><button className="button button-primary" type="button" onClick={() => openDrawer("activity")}>＋ {salesText(locale, "logActivity")}</button><button className="button button-secondary" type="button" onClick={() => openDrawer("task")}>＋ {salesText(locale, "createTask")}</button><button className="button button-secondary" type="button" onClick={() => openDrawer("opportunity")}>＋ {salesText(locale, "newOpportunity")}</button><button className="button button-quiet" type="button" onClick={() => openDrawer("contact")}>{salesText(locale, "newContact")}</button></div></section>

    <section className="sales-operating-grid"><div className="sales-main-column">
      <section className="sales-surface sales-work-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "myWork")}</p><h2>{salesText(locale, "attention")}</h2></div><span className="panel-count">{attentionTasks.length}</span></div>{attentionTasks.length ? <div className="work-queue">{attentionTasks.slice(0, 5).map((task) => <div className="work-item" key={task.id}><span className={`priority-mark priority-${task.priority.toLowerCase()}`} aria-hidden="true" /><div className="work-item-copy"><strong>{task.title}</strong><span>{displayEnum(task.priority, ar)} · {task.dueAt ? formatDate(task.dueAt, locale) : salesText(locale, "open")}{task.opportunityId ? ` · ${opportunities.find((item) => item.id === task.opportunityId)?.name ?? salesText(locale, "opportunities")}` : ""}</span></div><button className="button button-quiet" type="button" onClick={() => void run(() => crmApi.updateTaskStatus(task.id, "COMPLETED"), salesText(locale, "completed"))}>{salesText(locale, "complete")}</button></div>)}</div> : <div className="sales-empty-compact"><strong>{salesText(locale, "emptyWork")}</strong><span>{salesText(locale, "empty")}</span></div>}</section>
      <section className="sales-surface sales-opportunity-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "opportunities")}</p><h2>{selectedOpportunity?.name ?? salesText(locale, "noOpportunity")}</h2></div><label className="context-select"><span>{salesText(locale, "viewContext")}</span><select value={selectedOpportunityId} onChange={(event) => setSelectedOpportunityId(event.target.value)}><option value="">—</option>{opportunities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>{selectedOpportunity ? <><div className="opportunity-summary"><div className="opportunity-status"><span className={`stage stage-${selectedOpportunity.stage.toLowerCase()}`}>{displayStage(selectedOpportunity.stage, ar)}</span><strong>{formatMoney(selectedOpportunity.expectedValueMinor, selectedOpportunity.currency, locale)}</strong></div><div className="opportunity-facts"><span><small>{salesText(locale, "customer")}</small><b>{personName(selectedOpportunity.contact) || selectedOpportunity.customer?.firstName || "—"}</b></span><span><small>{salesText(locale, "owner")}</small><b>{selectedOpportunity.owner.displayName}</b></span><span><small>{salesText(locale, "projectUnit")}</small><b>{selectedOpportunity.project?.name ?? "—"} / {selectedOpportunity.unit?.code ?? "—"}</b></span></div></div><div className="stage-visual" aria-label={salesText(locale, "stage")}><div className="stage-line" style={{ "--stage-progress": `${(stagePosition / (activeStages.length - 1)) * 100}%` } as CSSProperties} />{activeStages.map((stage, index) => <div className={`stage-node ${index <= stagePosition ? "is-active" : ""}`} key={stage} aria-current={stage === selectedOpportunity.stage ? "step" : undefined}><span>{index + 1}</span><small>{displayStage(stage, ar)}</small></div>)}</div><div className="stage-actions">{nextStages(selectedOpportunity.stage).map((stage) => <button className="button button-secondary" key={stage} type="button" onClick={() => void run(() => crmApi.updateOpportunityStage(selectedOpportunity.id, stage), `${salesText(locale, "stage")}: ${displayStage(stage, ar)}`)}>{displayStage(stage, ar)}</button>)}<button className="button button-quiet" type="button" onClick={() => openDrawer("quotation")}>{salesText(locale, "createQuotation")}</button></div></> : <div className="sales-empty-compact"><strong>{salesText(locale, "noOpportunity")}</strong><span>{salesText(locale, "viewContext")}</span></div>}</section>
    </div><aside className="sales-side-column">
      <section className={`sales-surface sales-context-panel ${selectedOpportunity && (selectedOpportunity.contact || selectedOpportunity.customer || selectedOpportunity.project || selectedOpportunity.unit || selectedActivities.length) ? "has-context" : "is-sparse"}`}><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "selectedContext")}</p><h2>{selectedOpportunity?.name ?? "—"}</h2></div></div>{selectedOpportunity && (selectedOpportunity.contact || selectedOpportunity.customer || selectedOpportunity.project || selectedOpportunity.unit || selectedActivities.length) ? <div className="context-stack"><div><span>{salesText(locale, "customer")}</span><strong>{personName(selectedOpportunity.contact) || selectedOpportunity.customer?.email || "—"}</strong></div><div><span>{salesText(locale, "projectUnit")}</span><strong>{selectedOpportunity.project?.code ?? "—"} · {selectedOpportunity.unit?.number ?? "—"}</strong><small>{selectedOpportunity.unit?.status ?? salesText(locale, "status")}</small></div><div><span>{salesText(locale, "latestActivity")}</span><strong>{selectedActivities[0] ? displayEnum(selectedActivities[0].type, ar) : "—"}</strong><small>{selectedActivities[0] ? formatDate(selectedActivities[0].createdAt, locale) : "—"}</small></div></div> : <div className="sales-empty-compact"><span>{salesText(locale, "noOpportunity")}</span></div>}</section>
      <section className="sales-surface sales-timeline-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "timeline")}</p><h2>{salesText(locale, "activityHistory")}</h2></div><span className="panel-count">{selectedActivities.length}</span></div>{selectedActivities.length ? <div className="sales-timeline">{selectedActivities.slice(0, 5).map((activity) => <div className="timeline-entry" key={activity.id}><span className="timeline-mark" /><div><strong>{displayEnum(activity.type, ar)}</strong><p>{activity.notes}</p><small>{activity.actor.displayName} · {formatDate(activity.createdAt, locale)}</small></div></div>)}</div> : <div className="sales-empty-compact"><span>{salesText(locale, "empty")}</span></div>}</section>
    </aside></section>

    <section className="sales-surface sales-task-band"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "taskQueue")}</p><h2>{salesText(locale, "workload")}</h2></div><button className="button button-secondary" type="button" onClick={() => openDrawer("task")}>＋ {salesText(locale, "createTask")}</button></div><div className="task-band-list">{tasks.slice(0, 4).map((task) => <div className="task-chip" key={task.id}><span className={`task-status-dot task-${task.status.toLowerCase()}`} /><div><strong>{task.title}</strong><small>{displayEnum(task.status, ar)} · {task.dueAt ? formatDate(task.dueAt, locale) : "—"}</small></div>{task.status !== "COMPLETED" && task.status !== "CANCELLED" ? <button className="button button-quiet" type="button" onClick={() => void run(() => crmApi.updateTaskStatus(task.id, "COMPLETED"), salesText(locale, "completed"))}>{salesText(locale, "complete")}</button> : null}</div>)}{!tasks.length ? <span className="sales-empty-inline">{salesText(locale, "emptyWork")}</span> : null}</div></section><p className="sales-footnote">{salesText(locale, "availabilityNote")}</p>

    {drawer ? <div className="sales-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDrawer(); }}><aside ref={drawerRef} className="sales-drawer" role="dialog" aria-modal="true" aria-labelledby="sales-drawer-title"><div className="sales-drawer-header"><div><p className="eyebrow">{salesText(locale, "quickActions")}</p><h2 id="sales-drawer-title">{drawer === "contact" ? salesText(locale, "newContact") : drawer === "opportunity" ? salesText(locale, "newOpportunity") : drawer === "activity" ? salesText(locale, "logActivity") : drawer === "task" ? salesText(locale, "createTask") : salesText(locale, "createQuotation")}</h2></div><button className="icon-button" type="button" aria-label={salesText(locale, "close")} onClick={closeDrawer}>×</button></div><p className="sales-drawer-hint">{salesText(locale, "drawerHint")}</p>{drawer === "contact" ? <ContactForm locale={locale} onSaved={(body) => void run(() => crmApi.createContact(body), salesText(locale, "contactSaved"))} /> : null}{drawer === "opportunity" ? <OpportunityForm locale={locale} onSaved={(body) => void run(() => crmApi.createOpportunity(body), salesText(locale, "opportunityCreated"))} /> : null}{drawer === "activity" ? <ActivityForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createActivity(body), salesText(locale, "activityLogged"))} /> : null}{drawer === "task" ? <TaskForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createTask(body), salesText(locale, "taskCreated"))} /> : null}{drawer === "quotation" ? <QuotationForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createQuotation(body), salesText(locale, "quotationCreated"))} /> : null}</aside></div> : null}
  </main>;
}

function FormField({ label, children }: { label: string; children: ReactNode }) { return <label className="sales-field"><span>{label}</span>{children}</label>; }
function ContactForm({ locale, onSaved }: { locale: "en" | "ar"; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", communicationPreference: "PHONE" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, lastName: form.lastName || undefined, email: form.email || undefined, phone: form.phone || undefined }); setForm({ firstName: "", lastName: "", email: "", phone: "", communicationPreference: "PHONE" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "contactName")}><input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></FormField><FormField label={locale === "ar" ? "اسم العائلة" : "Last name"}><input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></FormField><FormField label={salesText(locale, "email")}><input dir="ltr" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField><FormField label={salesText(locale, "phone")}><input dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></FormField><FormField label={salesText(locale, "preference")}><select value={form.communicationPreference} onChange={(event) => setForm({ ...form, communicationPreference: event.target.value })}><option value="PHONE">{displayEnum("CALL", locale === "ar")}</option><option value="EMAIL">{displayEnum("EMAIL", locale === "ar")}</option><option value="WHATSAPP">{displayEnum("WHATSAPP", locale === "ar")}</option><option value="SMS">SMS</option></select></FormField><button className="button button-primary" type="submit">{salesText(locale, "saveContact")}</button></form>; }
function OpportunityForm({ locale, onSaved }: { locale: "en" | "ar"; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ name: "", projectId: "", unitId: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ name: form.name, projectId: form.projectId || undefined, unitId: form.unitId || undefined }); setForm({ name: "", projectId: "", unitId: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "opportunityName")}><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField><FormField label={salesText(locale, "project")}><input dir="ltr" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} /></FormField><FormField label={salesText(locale, "unit")}><input dir="ltr" value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} /></FormField><button className="button button-primary" type="submit">{salesText(locale, "createOpportunity")}</button></form>; }
function ActivityForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ type: "CALL", notes: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, opportunityId }); setForm({ type: "CALL", notes: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "activityType")}><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{activityTypes.map((type) => <option key={type} value={type}>{displayEnum(type, locale === "ar")}</option>)}</select></FormField><FormField label={salesText(locale, "activityNote")}><textarea required value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField><button className="button button-primary" type="submit">{salesText(locale, "logActivity")}</button></form>; }
function TaskForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ title: "", dueAt: "", priority: "NORMAL", assigneeId: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, opportunityId, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined }); setForm({ title: "", dueAt: "", priority: "NORMAL", assigneeId: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "taskTitle")}><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField><FormField label={salesText(locale, "dueDate")}><input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></FormField><FormField label={salesText(locale, "priority")}><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{priorities.map((priority) => <option key={priority} value={priority}>{displayEnum(priority, locale === "ar")}</option>)}</select></FormField><FormField label={salesText(locale, "assignee")}><input required dir="ltr" value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })} /></FormField><button className="button button-primary" type="submit">{salesText(locale, "createTask")}</button></form>; }
function QuotationForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [notes, setNotes] = useState(""); const submit = (event: FormEvent) => { event.preventDefault(); if (!opportunityId) return; onSaved({ opportunityId, snapshot: { notes, createdAt: new Date().toISOString() } }); setNotes(""); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "activityNote")}><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={locale === "ar" ? "ملاحظات العرض" : "Commercial snapshot note"} /></FormField><button className="button button-primary" type="submit" disabled={!opportunityId}>{salesText(locale, "createQuotation")}</button></form>; }
function nextStages(stage: OpportunityStage): OpportunityStage[] { if (stage === "QUALIFICATION") return ["DISCOVERY", "LOST", "DISQUALIFIED"]; if (stage === "DISCOVERY") return ["PROPOSAL", "LOST", "DISQUALIFIED"]; if (stage === "PROPOSAL") return ["NEGOTIATION", "LOST", "DISQUALIFIED"]; if (stage === "NEGOTIATION") return ["RESERVED", "LOST", "DISQUALIFIED"]; if (stage === "RESERVED") return ["WON", "LOST"]; return []; }
