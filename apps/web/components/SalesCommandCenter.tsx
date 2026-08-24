"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { crmApi, type CrmActivity, type CrmContact, type CrmOpportunity, type CrmTask, type CrmTaskStatus, type OpportunityStage } from "../lib/crm-api";
import { salesText } from "../lib/sales-i18n";
import { ClientApiError } from "../lib/client-api";
import { useI18n } from "./I18nProvider";

const stages: OpportunityStage[] = ["QUALIFICATION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "RESERVED", "WON", "LOST", "DISQUALIFIED"];
const activeStages = stages.slice(0, 6);
const activityTypes = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "SITE_VISIT", "NOTE"] as const;
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value));
}
function personName(contact: CrmContact | null) {
  return contact ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}` : "Unassigned contact";
}
function displayStage(stage: OpportunityStage, ar: boolean) {
  const labels: Record<OpportunityStage, [string, string]> = { QUALIFICATION: ["Qualification", "تأهيل"], DISCOVERY: ["Discovery", "استكشاف"], PROPOSAL: ["Proposal", "عرض"], NEGOTIATION: ["Negotiation", "تفاوض"], RESERVED: ["Reserved projection", "إسقاط محجوز"], WON: ["Won", "ناجحة"], LOST: ["Lost", "خاسرة"], DISQUALIFIED: ["Disqualified", "مستبعدة"] };
  return labels[stage][ar ? 1 : 0];
}

export function SalesCommandCenter() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [contactResponse, opportunityResponse, taskResponse, activityResponse] = await Promise.all([
        crmApi.contacts(), crmApi.opportunities(), crmApi.tasks(), crmApi.activities(),
      ]);
      setContacts(contactResponse); setOpportunities(opportunityResponse); setTasks(taskResponse); setActivities(activityResponse);
      setSelectedOpportunityId((current) => current || opportunityResponse[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof ClientApiError && cause.status === 403 ? salesText(locale, "noPermission") : salesText(locale, "serverError"));
    } finally { setLoading(false); }
  }, [locale]);
  useEffect(() => { void load(); }, [load]);

  const selectedOpportunity = useMemo(() => opportunities.find((item) => item.id === selectedOpportunityId) ?? null, [opportunities, selectedOpportunityId]);
  const selectedActivities = useMemo(() => selectedOpportunity ? activities.filter((item) => item.opportunityId === selectedOpportunity.id) : activities.slice(0, 8), [activities, selectedOpportunity]);
  const attentionTasks = useMemo(() => tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"), [tasks]);
  const overdueTasks = useMemo(() => attentionTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now()), [attentionTasks]);

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(""); setError("");
    try { await action(); setNotice(success); await load(); }
    catch (cause) { setError(cause instanceof ClientApiError ? cause.message : salesText(locale, "serverError")); }
  }

  if (loading) return <main className="workspace-page sales-page"><div className="sales-skeleton" aria-busy="true"><span /><span /><span /><span /></div></main>;
  if (error && !contacts.length && !opportunities.length && !tasks.length) return <main className="workspace-page sales-page"><section className="sales-state sales-state-error"><strong>{error}</strong><button className="button button-primary" type="button" onClick={() => void load()}>{salesText(locale, "refresh")}</button></section></main>;

  return <main className="workspace-page sales-page" dir={ar ? "rtl" : "ltr"}>
    <header className="sales-hero">
      <div><p className="eyebrow">{salesText(locale, "eyebrow")}</p><h1>{salesText(locale, "title")}</h1><p>{salesText(locale, "subtitle")}</p></div>
      <div className="sales-hero-actions"><span className="state-pill">{salesText(locale, "synthetic")}</span><button className="button button-secondary" type="button" onClick={() => void load()}>{salesText(locale, "refresh")}</button></div>
    </header>
    {notice ? <p className="sales-notice" role="status">{notice}</p> : null}
    {error ? <p className="sales-error" role="alert">{error}</p> : null}

    <section className="sales-metrics" aria-label={salesText(locale, "attention")}>
      <article><span>{salesText(locale, "overdue")}</span><strong>{overdueTasks.length}</strong><small>{salesText(locale, "tasks")}</small></article>
      <article><span>{salesText(locale, "today")}</span><strong>{attentionTasks.length - overdueTasks.length}</strong><small>{salesText(locale, "open")}</small></article>
      <article><span>{salesText(locale, "contacts")}</span><strong>{contacts.length}</strong><small>{salesText(locale, "open")}</small></article>
      <article><span>{salesText(locale, "opportunities")}</span><strong>{opportunities.length}</strong><small>{salesText(locale, "open")}</small></article>
    </section>

    <section className="sales-grid sales-grid-primary">
      <div className="sales-panel sales-panel-wide"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "myWork")}</p><h2>{salesText(locale, "attention")}</h2></div><span className="panel-count">{attentionTasks.length}</span></div>
        {attentionTasks.length ? <div className="sales-list">{attentionTasks.slice(0, 6).map((task) => <div className="sales-list-row" key={task.id}><div><strong>{task.title}</strong><span>{task.priority} · {formatDate(task.dueAt, locale)}{task.opportunityId ? ` · ${opportunities.find((item) => item.id === task.opportunityId)?.name ?? "Opportunity"}` : ""}</span></div><button className="button button-quiet" type="button" onClick={() => void run(() => crmApi.updateTaskStatus(task.id, "COMPLETED"), salesText(locale, "completed"))}>{salesText(locale, "complete")}</button></div>)}</div> : <p className="sales-empty">{salesText(locale, "empty")}</p>}
      </div>
      <div className="sales-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "contacts")}</p><h2>{salesText(locale, "newContact")}</h2></div></div><ContactForm locale={locale} onSaved={(body) => void run(() => crmApi.createContact(body), salesText(locale, "contactSaved"))} /></div>
    </section>

    <section className="sales-grid">
      <div className="sales-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "opportunities")}</p><h2>{selectedOpportunity ? selectedOpportunity.name : salesText(locale, "newOpportunity")}</h2></div></div>
        <div className="sales-select-row"><label><span>{salesText(locale, "opportunities")}</span><select value={selectedOpportunityId} onChange={(event) => setSelectedOpportunityId(event.target.value)}><option value="">—</option>{opportunities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        {selectedOpportunity ? <><div className="opportunity-context"><span className={`stage stage-${selectedOpportunity.stage.toLowerCase()}`}>{displayStage(selectedOpportunity.stage, ar)}</span><strong>{selectedOpportunity.owner.displayName}</strong><span>{selectedOpportunity.project?.name ?? "No project"} · {selectedOpportunity.unit?.code ?? "No unit"}</span></div><div className="stage-track">{activeStages.map((stage) => <span className={activeStages.indexOf(stage) <= activeStages.indexOf(selectedOpportunity.stage) ? "stage-dot stage-dot-active" : "stage-dot"} key={stage}>{displayStage(stage, ar)}</span>)}</div><div className="stage-actions">{nextStages(selectedOpportunity.stage).map((stage) => <button className="button button-secondary" key={stage} type="button" onClick={() => void run(() => crmApi.updateOpportunityStage(selectedOpportunity.id, stage), `${salesText(locale, "stage")}: ${displayStage(stage, ar)}`)}>{displayStage(stage, ar)}</button>)}</div></> : <p className="sales-empty">{salesText(locale, "empty")}</p>}
      </div>
      <div className="sales-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "opportunities")}</p><h2>{salesText(locale, "newOpportunity")}</h2></div></div><OpportunityForm locale={locale} onSaved={(body) => void run(() => crmApi.createOpportunity(body), salesText(locale, "opportunityCreated"))} /></div>
    </section>

    <section className="sales-grid">
      <div className="sales-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "activities")}</p><h2>{salesText(locale, "logActivity")}</h2></div></div><ActivityForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createActivity(body), salesText(locale, "activityLogged"))} /><div className="sales-timeline">{selectedActivities.map((activity) => <div key={activity.id}><span className="timeline-mark" /><div><strong>{activity.type}</strong><p>{activity.notes}</p><small>{activity.actor.displayName} · {formatDate(activity.createdAt, locale)}</small></div></div>)}</div></div>
      <div className="sales-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "tasks")}</p><h2>{salesText(locale, "createTask")}</h2></div></div><TaskForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createTask(body), salesText(locale, "taskCreated"))} /></div>
    </section>

    <section className="sales-panel quotation-panel"><div className="sales-panel-heading"><div><p className="eyebrow">{salesText(locale, "quotation")}</p><h2>{salesText(locale, "createQuotation")}</h2><p>{salesText(locale, "quotationHelp")}</p></div></div><QuotationForm locale={locale} opportunityId={selectedOpportunityId || undefined} onSaved={(body) => void run(() => crmApi.createQuotation(body), salesText(locale, "quotationCreated"))} /></section>
    <p className="sales-footnote">{salesText(locale, "availabilityNote")}</p>
  </main>;
}

function FormField({ label, children }: { label: string; children: ReactNode }) { return <label className="sales-field"><span>{label}</span>{children}</label>; }
function ContactForm({ locale, onSaved }: { locale: "en" | "ar"; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", communicationPreference: "PHONE" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, lastName: form.lastName || undefined, email: form.email || undefined, phone: form.phone || undefined }); setForm({ firstName: "", lastName: "", email: "", phone: "", communicationPreference: "PHONE" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "contactName")}><input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></FormField><FormField label={locale === "ar" ? "اسم العائلة" : "Last name"}><input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></FormField><FormField label={salesText(locale, "email")}><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField><FormField label={salesText(locale, "phone")}><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></FormField><FormField label={salesText(locale, "preference")}><select value={form.communicationPreference} onChange={(event) => setForm({ ...form, communicationPreference: event.target.value })}><option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="SMS">SMS</option></select></FormField><button className="button button-primary">{salesText(locale, "saveContact")}</button></form>; }
function OpportunityForm({ locale, onSaved }: { locale: "en" | "ar"; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ name: "", projectId: "", unitId: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ name: form.name, projectId: form.projectId || undefined, unitId: form.unitId || undefined }); setForm({ name: "", projectId: "", unitId: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "opportunityName")}><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField><FormField label={salesText(locale, "project")}><input value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} /></FormField><FormField label={salesText(locale, "unit")}><input value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} /></FormField><button className="button button-primary">{salesText(locale, "createOpportunity")}</button></form>; }
function ActivityForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ type: "CALL", notes: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, opportunityId }); setForm({ type: "CALL", notes: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "activityType")}><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label={salesText(locale, "activityNote")}><textarea required value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField><button className="button button-primary">{salesText(locale, "logActivity")}</button></form>; }
function TaskForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [form, setForm] = useState({ title: "", dueAt: "", priority: "NORMAL", assigneeId: "" }); const submit = (event: FormEvent) => { event.preventDefault(); onSaved({ ...form, opportunityId, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined }); setForm({ title: "", dueAt: "", priority: "NORMAL", assigneeId: "" }); }; return <form className="sales-form" onSubmit={submit}><FormField label={salesText(locale, "taskTitle")}><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField><FormField label={salesText(locale, "dueDate")}><input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></FormField><FormField label={salesText(locale, "priority")}><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></FormField><FormField label={salesText(locale, "assignee")}><input required value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })} /></FormField><button className="button button-primary" type="submit">{salesText(locale, "createTask")}</button></form>; }
function QuotationForm({ locale, opportunityId, onSaved }: { locale: "en" | "ar"; opportunityId?: string; onSaved: (body: Record<string, unknown>) => void }) { const [notes, setNotes] = useState(""); const submit = (event: FormEvent) => { event.preventDefault(); if (!opportunityId) return; onSaved({ opportunityId, snapshot: { notes, createdAt: new Date().toISOString() } }); setNotes(""); }; return <form className="sales-form sales-form-inline" onSubmit={submit}><FormField label={salesText(locale, "activityNote")}><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={locale === "ar" ? "ملاحظات العرض" : "Commercial snapshot note"} /></FormField><button className="button button-primary" type="submit" disabled={!opportunityId}>{salesText(locale, "createQuotation")}</button></form>; }
function nextStages(stage: OpportunityStage): OpportunityStage[] { if (stage === "QUALIFICATION") return ["DISCOVERY", "LOST", "DISQUALIFIED"]; if (stage === "DISCOVERY") return ["PROPOSAL", "LOST", "DISQUALIFIED"]; if (stage === "PROPOSAL") return ["NEGOTIATION", "LOST", "DISQUALIFIED"]; if (stage === "NEGOTIATION") return ["RESERVED", "LOST", "DISQUALIFIED"]; if (stage === "RESERVED") return ["WON", "LOST"]; return []; }
