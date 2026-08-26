"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialApi, type ActivityType, type CommercialLead, type LeadStatus, type PaymentPlan, type Reservation, type SalesActivity, type SalesAssignee, type UnitContext, type UnitHold, type UnitPrice } from "../lib/commercial-api";
import { clientApi } from "../lib/client-api";
import type { BrowserSessionUser, ProjectRecord, UnitPage, UnitRecord } from "../lib/types";
import { useI18n } from "./I18nProvider";
import { CommercialInventory } from "./CommercialInventory";

const activityTypes: ActivityType[] = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "SITE_VISIT", "FOLLOW_UP", "NOTE"];
type BulkMode = "contacts" | "campaign";
type BulkRow = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  projectCode: string;
  result: string;
  notes: string;
  valid: boolean;
  error: string;
};

function csvCells(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (char === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(current.trim()); current = ""; }
    else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseBulkCsv(source: string, projectCodes: Set<string>): BulkRow[] {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = csvCells(lines[0]!).map((value) => value.toLowerCase());
  const value = (cells: string[], name: string) => cells[headers.indexOf(name)]?.trim() ?? "";
  return lines.slice(1).map((line) => {
    const cells = csvCells(line);
    const row = {
      firstName: value(cells, "firstname"), lastName: value(cells, "lastname"),
      phone: value(cells, "phone"), email: value(cells, "email"),
      source: value(cells, "source"), projectCode: value(cells, "projectcode"),
      result: value(cells, "result"), notes: value(cells, "notes"),
    };
    const missing = ["firstName", "phone", "email", "source"].filter((key) => !row[key as keyof typeof row]);
    const invalidProject = row.projectCode && !projectCodes.has(row.projectCode.toLowerCase());
    const error = missing.length ? `Missing: ${missing.join(", ")}` : invalidProject ? `Unknown project: ${row.projectCode}` : "";
    return { ...row, valid: !error, error };
  });
}
const nextStatus: Partial<Record<LeadStatus, LeadStatus>> = {
  NEW: "CONTACTED",
  CONTACTED: "QUALIFIED",
  QUALIFIED: "APPOINTMENT",
  APPOINTMENT: "NEGOTIATION",
  RESERVED: "WON",
};

function has(user: BrowserSessionUser | null, permission: string) {
  return Boolean(user?.permissions.includes(permission));
}

function localDateTime(hours = 24) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function CommercialOperatorWorkspace() {
  const { t, locale } = useI18n();
  const [user, setUser] = useState<BrowserSessionUser | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [assignees, setAssignees] = useState<SalesAssignee[]>([]);
  const [allLeads, setAllLeads] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitContext | null>(null);
  const [prices, setPrices] = useState<UnitPrice[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [hold, setHold] = useState<UnitHold | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<"success" | "error" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkMode>("contacts");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkSummary, setBulkSummary] = useState("");

  const canOperate = has(user, "commercial:lead:view-own");
  const canViewAll = has(user, "commercial:lead:view-all");
  const canManage = has(user, "commercial:manage");
  const canConfirm = has(user, "commercial:reservation:confirm");
  const activePrice = prices[0] ?? null;

  const loadLeads = useCallback(async (showAll: boolean) => {
    const page = await commercialApi.leads(showAll);
    setLeads(page.items);
    setSelectedLead((current) => current ? page.items.find(({ id }) => id === current.id) ?? null : page.items[0] ?? null);
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const session = await clientApi<{ user: BrowserSessionUser }>("/api/session");
      setUser(session.user);
      const operator = session.user.permissions.includes("commercial:lead:view-own");
      if (operator) {
        const [projectRows, leadPage] = await Promise.all([
          clientApi<ProjectRecord[]>("/api/projects"),
          commercialApi.leads(false),
        ]);
        setProjects(projectRows);
        setLeads(leadPage.items);
        setSelectedLead(leadPage.items[0] ?? null);
        setProjectId(leadPage.items[0]?.projectId ?? projectRows[0]?.id ?? "");
        if (session.user.permissions.includes("commercial:lead:reassign")) {
          setAssignees(await commercialApi.assignees());
        }
      }
    } catch {
      setNotice("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void initialize(); }, [initialize]);

  useEffect(() => {
    if (!selectedLead) { setActivities([]); return; }
    setProjectId(selectedLead.projectId ?? projectId);
    void commercialApi.activities(selectedLead.id).then(setActivities).catch(() => setNotice("error"));
  // projectId is intentionally not a dependency: selecting a Lead may establish it, but must not loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLead?.id]);

  useEffect(() => {
    let active = true;
    setUnits([]);
    setPlans([]);
    setSelectedUnit(null);
    if (!projectId || !canOperate) return () => { active = false; };
    const params = new URLSearchParams({ projectId, status: "AVAILABLE", page: "1", pageSize: "100", locale });
    void clientApi<UnitPage>(`/api/backend/commercial/units?${params}`)
      .then(({ items }) => { if (active) setUnits(items); })
      .catch(() => { if (active) setNotice("error"); });
    if (canConfirm) {
      void commercialApi.paymentPlans(projectId)
        .then((items) => { if (active) setPlans(items); })
        .catch(() => { if (active) setNotice("error"); });
    }
    return () => { active = false; };
  }, [projectId, locale, canOperate, canConfirm]);

  const groupedLeads = useMemo(() => {
    const result = new Map<LeadStatus, CommercialLead[]>();
    for (const lead of leads) result.set(lead.status, [...(result.get(lead.status) ?? []), lead]);
    return [...result.entries()];
  }, [leads]);

  async function action(work: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try { await work(); setNotice("success"); }
    catch { setNotice("error"); }
    finally { setBusy(false); }
  }

  function reloadLeadList() {
    return loadLeads(allLeads);
  }

  async function captureLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      const customerResult = await commercialApi.createCustomer({
        firstName: data.get("firstName"), lastName: data.get("lastName") || undefined,
        phone: data.get("phone"), email: data.get("email"),
      });
      if (!customerResult.customer) throw new Error("Customer response is unavailable");
      const external = data.get("external") === "on";
      const enquiry = data.get("enquiryConsentGranted") === "on";
      const marketing = data.get("marketingConsentGranted") === "on";
      const consent = (prefix: string, granted: boolean) => granted ? {
        [`${prefix}Granted`]: true,
        [`${prefix}At`]: new Date(String(data.get(`${prefix}At`))).toISOString(),
        [`${prefix}Channel`]: data.get(`${prefix}Channel`),
        [`${prefix}Purpose`]: data.get(`${prefix}Purpose`),
      } : { [`${prefix}Granted`]: false };
      const lead = await commercialApi.createLead({
        customerId: customerResult.customer.id,
        projectId: data.get("projectId") || undefined,
        source: data.get("source"), isExternalEnquiry: external,
        ...consent("enquiryConsent", enquiry), ...consent("marketingConsent", marketing),
      });
      form.reset();
      setSelectedLead(lead);
      setProjectId(lead.projectId ?? projectId);
      await reloadLeadList();
    });
  }

  async function importBulkRows() {
    const validRows = bulkRows.filter((row) => row.valid);
    setBusy(true);
    setNotice(null);
    let imported = 0;
    let failed = 0;
    for (const row of validRows) {
      try {
        const customerResult = await commercialApi.createCustomer({ firstName: row.firstName, lastName: row.lastName || undefined, phone: row.phone, email: row.email });
        if (!customerResult.customer) throw new Error("Customer response is unavailable");
        const project = projects.find((item) => item.code.toLowerCase() === row.projectCode.toLowerCase());
        const now = new Date().toISOString();
        const lead = await commercialApi.createLead({
          customerId: customerResult.customer.id,
          projectId: project?.id,
          source: row.source,
          isExternalEnquiry: bulkMode === "campaign",
          ...(bulkMode === "campaign" ? {
            enquiryConsentGranted: true, enquiryConsentAt: now,
            enquiryConsentChannel: "campaign-import", enquiryConsentPurpose: "Respond to submitted campaign enquiry",
          } : {}),
        });
        if (bulkMode === "campaign" && (row.result || row.notes)) {
          await commercialApi.logActivity(lead.id, { type: "NOTE", notes: [row.result && `Campaign result: ${row.result}`, row.notes].filter(Boolean).join(" — ") });
        }
        imported += 1;
      } catch { failed += 1; }
    }
    setBusy(false);
    setBulkSummary(t("commercial.bulkSummary").replace("{imported}", String(imported)).replace("{failed}", String(failed)));
    setNotice(failed ? "error" : "success");
    await reloadLeadList();
  }

  async function chooseUnit(id: string) {
    if (!id) { setSelectedUnit(null); setPrices([]); return; }
    await action(async () => {
      const [unit, published] = await Promise.all([commercialApi.unit(id, locale), commercialApi.prices(id)]);
      setSelectedUnit(unit); setPrices(published); setHold(null); setReservation(null); setReviewed(false);
    });
  }

  if (loading) return <main className="workspace-page commercial-operator"><p>{t("commercial.loading")}</p></main>;

  return (
    <>
      <main className="workspace-page commercial-operator">
        <header className="page-heading">
          <div><p className="eyebrow">{t("commercial.eyebrow")}</p><h1>{t("commercial.title")}</h1><p>{t("commercial.subtitle")}</p></div>
          {canOperate ? <button className="button button-secondary" type="button" onClick={() => void initialize()} disabled={busy}>{t("commercial.reload")}</button> : null}
        </header>

        <div className="commercial-notice" aria-live="polite">
          {notice ? <p className={notice === "error" ? "inline-alert" : "success-message"}>{t(`commercial.${notice}`)}</p> : null}
        </div>

        {!canOperate ? <section className="create-panel"><p>{t("commercial.restricted")}</p></section> : (
          <>
            <section className="bulk-import-panel" id="commercial-operations">
              <div><h2>{t("commercial.bulkTitle")}</h2><p>{t("commercial.bulkHint")}</p></div>
              <button className="button button-secondary" type="button" onClick={() => setBulkOpen((open) => !open)}>{bulkOpen ? t("commercial.bulkClose") : t("commercial.bulkOpen")}</button>
              {bulkOpen ? <div className="bulk-import-body">
                <div className="segmented bulk-mode"><button type="button" aria-pressed={bulkMode === "contacts"} onClick={() => setBulkMode("contacts")}>{t("commercial.bulkContacts")}</button><button type="button" aria-pressed={bulkMode === "campaign"} onClick={() => setBulkMode("campaign")}>{t("commercial.bulkCampaign")}</button></div>
                <label className="bulk-file"><span>{t("commercial.bulkFile")}</span><input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then((contents) => { setBulkRows(parseBulkCsv(contents, new Set(projects.map((item) => item.code.toLowerCase())))); setBulkSummary(""); }); }} /></label>
                <p className="bulk-columns">{t("commercial.bulkColumns")}</p>
                {bulkRows.length ? <><div className="bulk-preview" role="table" aria-label={t("commercial.bulkPreview")}><div role="row"><b>{t("commercial.firstName")}</b><b>{t("commercial.phone")}</b><b>{t("commercial.source")}</b><b>{t("commercial.project")}</b><b>{t("commercial.status")}</b></div>{bulkRows.slice(0, 20).map((row, index) => <div role="row" key={`${row.email}-${index}`} className={row.valid ? "" : "invalid"}><span>{row.firstName} {row.lastName}</span><span dir="ltr">{row.phone}</span><span>{row.source}</span><span>{row.projectCode || "—"}</span><span>{row.valid ? t("commercial.bulkValid") : row.error}</span></div>)}</div><footer><span>{t("commercial.bulkReady").replace("{valid}", String(bulkRows.filter((row) => row.valid).length)).replace("{total}", String(bulkRows.length))}</span><button className="button button-primary" type="button" disabled={busy || !bulkRows.some((row) => row.valid)} onClick={() => void importBulkRows()}>{busy ? t("commercial.creating") : t("commercial.bulkImport")}</button></footer></> : null}
                {bulkSummary ? <p className="bulk-summary" role="status">{bulkSummary}</p> : null}
              </div> : null}
            </section>
            <section className="commercial-journey-grid" id="commercial-customers">
              <form className="create-panel commercial-capture" onSubmit={captureLead}>
                <h2>{t("commercial.newLead")}</h2>
                <fieldset><legend>{t("commercial.customer")}</legend>
                  <label><span>{t("commercial.firstName")}</span><input name="firstName" required maxLength={160} /></label>
                  <label><span>{t("commercial.lastName")}</span><input name="lastName" maxLength={160} /></label>
                  <label><span>{t("commercial.phone")}</span><input name="phone" required inputMode="tel" /></label>
                  <label><span>{t("commercial.email")}</span><input name="email" required type="email" /></label>
                </fieldset>
                <label><span>{t("commercial.source")}</span><input name="source" required maxLength={160} /></label>
                <label><span>{t("commercial.project")}</span><select name="projectId" defaultValue=""><option value="">{t("commercial.projectOptional")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} — {project.name}</option>)}</select></label>
                <label className="check-row"><input type="checkbox" name="external" /> <span>{t("commercial.external")}</span></label>
                <ConsentFields prefix="enquiryConsent" title={t("commercial.enquiryConsent")} t={t} />
                <ConsentFields prefix="marketingConsent" title={t("commercial.marketingConsent")} t={t} />
                <button className="button button-primary" disabled={busy}>{busy ? t("commercial.creating") : t("commercial.capture")}</button>
              </form>

              <section className="create-panel commercial-pipeline">
                <div className="section-heading"><h2>{t("commercial.pipeline")}</h2>{canViewAll ? <div className="segmented"><button type="button" aria-pressed={!allLeads} onClick={() => { setAllLeads(false); void loadLeads(false); }}>{t("commercial.own")}</button><button type="button" aria-pressed={allLeads} onClick={() => { setAllLeads(true); void loadLeads(true); }}>{t("commercial.all")}</button></div> : null}</div>
                {groupedLeads.length === 0 ? <p>{t("commercial.noLeads")}</p> : groupedLeads.map(([status, rows]) => <div className="lead-stage" key={status}><h3><span>{t(`commercial.status.${status}` as "commercial.status.NEW")}</span><small>{rows.length}</small></h3>{rows.map((lead) => <button type="button" className={selectedLead?.id === lead.id ? "lead-card lead-card-selected" : "lead-card"} key={lead.id} onClick={() => setSelectedLead(lead)}><strong>{lead.customer ? `${lead.customer.firstName} ${lead.customer.lastName ?? ""}` : lead.source}</strong><span>{lead.project?.name ?? lead.source}</span><small>{lead.assignedTo.displayName}</small></button>)}</div>)}
              </section>
            </section>

            {selectedLead ? <section className="create-panel lead-detail">
              <div className="section-heading"><div><p className="eyebrow">{t("commercial.selectLead")}</p><h2>{selectedLead.customer ? `${selectedLead.customer.firstName} ${selectedLead.customer.lastName ?? ""}` : selectedLead.source}</h2></div><span className="status-badge">{t(`commercial.status.${selectedLead.status}` as "commercial.status.NEW")}</span></div>
              <dl><div><dt>{t("commercial.customer")}</dt><dd>{selectedLead.customer?.email ?? "—"}<br />{selectedLead.customer?.phone ?? "—"}</dd></div><div><dt>{t("commercial.project")}</dt><dd>{selectedLead.project?.name ?? "—"}</dd></div><div><dt>{t("commercial.assignee")}</dt><dd>{selectedLead.assignedTo.displayName}</dd></div><div><dt>{t("commercial.status")}</dt><dd>{t(`commercial.status.${selectedLead.status}` as "commercial.status.NEW")}</dd></div></dl>
              <div className="lead-actions">
                {nextStatus[selectedLead.status] && has(user, "commercial:lead:qualify") ? <button className="button button-primary" type="button" disabled={busy} onClick={() => void action(async () => { setSelectedLead(await commercialApi.advanceLead(selectedLead.id, nextStatus[selectedLead.status]!)); await reloadLeadList(); })}>{t("commercial.nextAction").replace("{status}", t(`commercial.status.${nextStatus[selectedLead.status]!}` as "commercial.status.NEW"))}</button> : null}
                {selectedLead.status === "RESERVED" && has(user, "commercial:lead:qualify") ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => void action(async () => { setSelectedLead(await commercialApi.advanceLead(selectedLead.id, "LOST")); await reloadLeadList(); })}>{t("commercial.nextAction").replace("{status}", t("commercial.status.LOST"))}</button> : null}
                {!["RESERVED", "WON", "LOST", "DISQUALIFIED"].includes(selectedLead.status) && has(user, "commercial:lead:disqualify") ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => void action(async () => { setSelectedLead(await commercialApi.disqualifyLead(selectedLead.id)); await reloadLeadList(); })}>{t("commercial.disqualify")}</button> : null}
                {has(user, "commercial:lead:reassign") ? <label><span>{t("commercial.reassign")}</span><select value={selectedLead.assignedToId} onChange={(event) => void action(async () => { setSelectedLead(await commercialApi.reassignLead(selectedLead.id, event.target.value)); await reloadLeadList(); })}>{assignees.map((item) => <option key={item.id} value={item.id}>{item.displayName} — {item.role.name}</option>)}</select></label> : null}
              </div>
            </section> : null}

            <span className="commercial-anchor" id="commercial-transfer" aria-hidden="true" />
            {selectedLead ? <section className="commercial-work-grid">
              <section className="create-panel"><h2>{t("commercial.activities")}</h2><form className="activity-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void action(async () => { const created = await commercialApi.logActivity(selectedLead.id, { type: data.get("type"), notes: data.get("notes") }); setActivities((rows) => [...rows, created]); form.reset(); }); }}><label><span>{t("commercial.activityType")}</span><select name="type">{activityTypes.map((type) => <option key={type} value={type}>{t(`commercial.activity.${type}` as "commercial.activity.CALL")}</option>)}</select></label><label><span>{t("commercial.notes")}</span><textarea name="notes" required maxLength={4000} /></label><button className="button button-primary" disabled={busy}>{t("commercial.logActivity")}</button></form><ol className="activity-list">{activities.map((item) => <li key={item.id}><strong>{t(`commercial.activity.${item.type}` as "commercial.activity.CALL")} · {item.actor.displayName}</strong><p>{item.notes}</p><time>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time></li>)}</ol>{activities.length === 0 ? <p>{t("commercial.noActivities")}</p> : null}</section>

              <section className="create-panel" id="commercial-units"><h2>{t("commercial.units")}</h2><label><span>{t("commercial.project")}</span><select value={projectId} onChange={(event) => { setProjectId(event.target.value); setSelectedUnit(null); }}><option value="">{t("commercial.selectProject")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} — {project.name}</option>)}</select></label><label><span>{t("commercial.availableOnly")}</span><select value={selectedUnit?.id ?? ""} onChange={(event) => void chooseUnit(event.target.value)}><option value="">{t("commercial.selectUnit")}</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.code} — {unit.number} · {unit.grossArea} m²</option>)}</select></label>{projectId && units.length === 0 ? <p>{t("commercial.noUnits")}</p> : null}
                {selectedUnit ? <div className="unit-review"><h3>{selectedUnit.code} · {selectedUnit.unitType.name}</h3><p>{selectedUnit.building.name} / {selectedUnit.floor.name} · {selectedUnit.bedrooms} / {selectedUnit.bathrooms}</p><dl><div><dt>{t("commercial.publishedPrice")}</dt><dd>{activePrice ? formatMoney(activePrice.listPriceMinor, activePrice.currency, locale) : "—"}</dd></div><div><dt>{t("commercial.description")}</dt><dd>{selectedUnit.descriptions.unitType.value ?? "—"}{selectedUnit.descriptions.unitType.fallbackUsed ? <small> · {t("commercial.fallback")}</small> : null}</dd></div></dl>
                  {has(user, "commercial:hold:create") && selectedUnit.status === "AVAILABLE" ? <form className="hold-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void action(async () => setHold(await commercialApi.createHold({ leadId: selectedLead.id, unitId: selectedUnit.id, holdExpiresAt: new Date(String(data.get("holdExpiresAt"))).toISOString() }))); }}><label><span>{t("commercial.holdExpiry")}</span><input name="holdExpiresAt" type="datetime-local" defaultValue={localDateTime()} min={localDateTime(0.1)} required /></label><button className="button button-primary" disabled={busy}>{t("commercial.hold")}</button></form> : null}
                </div> : null}
                {hold ? <div className="hold-review"><h3>{t("commercial.holdActive")}</h3><p><strong>{t(`commercial.status.${hold.status}` as "commercial.status.ACTIVE")}</strong> · <time>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(hold.holdExpiresAt))}</time></p>{has(user, "commercial:hold:release") && hold.status === "ACTIVE" ? <button type="button" className="button button-secondary" onClick={() => void action(async () => setHold(await commercialApi.releaseHold(hold.id)))}>{t("commercial.releaseHold")}</button> : null}</div> : null}
                {hold?.status === "ACTIVE" && canConfirm ? <div className="reservation-review"><h3>{t("commercial.reservation")}</h3><label><span>{t("commercial.paymentPlan")}</span><select id="commercial-plan" defaultValue="">{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.installments.map((item) => `${item.shareBasisPoints / 100}% ${item.label ?? ""}`).join(" / ")}</option>)}</select></label><label className="check-row"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span>{t("commercial.review")}</span></label><button className="button button-primary" type="button" disabled={!reviewed || !activePrice || plans.length === 0 || busy} onClick={() => { const select = document.getElementById("commercial-plan") as HTMLSelectElement; void action(async () => setReservation(await commercialApi.confirmReservation(hold.id, select.value))); }}>{t("commercial.confirm")}</button></div> : null}
                {reservation ? <div className="reservation-result" aria-live="polite"><h3>{t("commercial.snapshot")}</h3><p><strong>{t(`commercial.status.${reservation.status}` as "commercial.status.CONFIRMED")}</strong> · {formatMoney(reservation.listPriceSnapshotMinor, reservation.currency, locale)}</p><code>{reservation.id}</code></div> : null}
              </section>
            </section> : null}
          </>
        )}
      </main>
      {canManage ? <section className="commercial-admin-boundary" id="commercial-inventory-admin"><header><h2>{t("commercial.admin")}</h2><p>{t("commercial.adminHint")}</p></header><CommercialInventory /></section> : null}
    </>
  );
}

function ConsentFields({ prefix, title, t }: { prefix: string; title: string; t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string }) {
  const [granted, setGranted] = useState(false);
  return <fieldset className="consent-fieldset"><legend>{title}</legend><label className="check-row"><input type="checkbox" name={`${prefix}Granted`} checked={granted} onChange={(event) => setGranted(event.target.checked)} /><span>{t("commercial.granted")}</span></label>{granted ? <div className="consent-grid"><label><span>{t("commercial.timestamp")}</span><input name={`${prefix}At`} type="datetime-local" defaultValue={localDateTime(0)} required /></label><label><span>{t("commercial.channel")}</span><input name={`${prefix}Channel`} required maxLength={80} /></label><label><span>{t("commercial.purpose")}</span><input name={`${prefix}Purpose`} required maxLength={240} /></label></div> : null}</fieldset>;
}

function formatMoney(minor: string, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency }).format(Number(minor) / 100);
}
