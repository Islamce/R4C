"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { clientApi } from "../lib/client-api";
import type {
  BuildingRecord,
  FloorRecord,
  PhaseRecord,
  ProjectRecord,
  UnitPage,
  UnitRecord,
  UnitStatus,
  UnitTypeRecord,
} from "../lib/types";
import { useI18n } from "./I18nProvider";
import { EmptyState, ErrorState, LoadingState } from "./StatePrimitives";

const statuses: UnitStatus[] = ["DRAFT", "UNRELEASED", "AVAILABLE", "HELD", "RESERVED", "SOLD", "BLOCKED", "WITHDRAWN"];

function body(form: FormData, names: string[]) {
  return Object.fromEntries(names.map((name) => [name, String(form.get(name) ?? "")]).filter(([, value]) => value !== ""));
}

export function CommercialInventory() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const l = (en: string, arabic: string) => ar ? arabic : en;
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState("");
  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [floors, setFloors] = useState<FloorRecord[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeRecord[]>([]);
  const [units, setUnits] = useState<UnitPage>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [phaseId, setPhaseId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);

  const selectedBuilding = useMemo(() => buildings.find((item) => item.id === buildingId), [buildings, buildingId]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await clientApi<ProjectRecord[]>("/api/projects");
      setProjects(rows);
      setProjectId((current) => current || rows[0]?.id || "");
      setFailed(false);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [phaseRows, buildingRows, typeRows] = await Promise.all([
        clientApi<PhaseRecord[]>(`/api/backend/commercial/phases?projectId=${projectId}`),
        clientApi<BuildingRecord[]>(`/api/backend/commercial/buildings?projectId=${projectId}`),
        clientApi<UnitTypeRecord[]>(`/api/backend/commercial/unit-types?projectId=${projectId}`),
      ]);
      setPhases(phaseRows); setBuildings(buildingRows); setUnitTypes(typeRows);
      setPhaseId((current) => phaseRows.some((x) => x.id === current) ? current : phaseRows[0]?.id || "");
      setBuildingId((current) => buildingRows.some((x) => x.id === current) ? current : buildingRows[0]?.id || "");
      setFailed(false);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, [projectId]);

  const loadFloors = useCallback(async () => {
    if (!buildingId) { setFloors([]); setFloorId(""); return; }
    try {
      const rows = await clientApi<FloorRecord[]>(`/api/backend/commercial/floors?buildingId=${buildingId}`);
      setFloors(rows); setFloorId((current) => rows.some((x) => x.id === current) ? current : rows[0]?.id || "");
    } catch { setFailed(true); }
  }, [buildingId]);

  const loadUnits = useCallback(async () => {
    if (!projectId) return;
    const params = new URLSearchParams({ projectId, page: "1", pageSize: "100" });
    if (phaseId) params.set("phaseId", phaseId);
    if (buildingId) params.set("buildingId", buildingId);
    if (floorId) params.set("floorId", floorId);
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    try { setUnits(await clientApi<UnitPage>(`/api/backend/commercial/units?${params}`)); }
    catch { setFailed(true); }
  }, [projectId, phaseId, buildingId, floorId, status, query]);

  useEffect(() => { void loadProjects(); }, [loadProjects]);
  useEffect(() => { void loadProject(); }, [loadProject]);
  useEffect(() => { void loadFloors(); }, [loadFloors]);
  useEffect(() => { void loadUnits(); }, [loadUnits]);

  async function create(path: string, payload: Record<string, unknown>, form: HTMLFormElement) {
    setWorking(true); setFailed(false);
    try {
      await clientApi(`/api/backend/commercial/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      form.reset(); await loadProject(); await loadFloors(); await loadUnits();
    } catch { setFailed(true); }
    finally { setWorking(false); }
  }

  async function rename(path: string, item: { id: string; name?: string; number?: string }) {
    const field = path === "units" ? "number" : "name";
    const current = field === "number" ? item.number : item.name;
    const value = window.prompt(l(field === "number" ? "New unit number" : "New name", field === "number" ? "رقم الوحدة الجديد" : "الاسم الجديد"), current)?.trim();
    if (!value || value === current) return;
    setWorking(true);
    try { await clientApi(`/api/backend/commercial/${path}/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field]: value }) }); await loadProject(); await loadFloors(); await loadUnits(); }
    catch { setFailed(true); } finally { setWorking(false); }
  }

  async function transition(unit: UnitRecord, action: "release" | "block") {
    setWorking(true);
    try { await clientApi(`/api/backend/commercial/units/${unit.id}/${action}`, { method: "POST" }); await loadUnits(); }
    catch { setFailed(true); } finally { setWorking(false); }
  }

  if (loading && projects.length === 0) return <main className="workspace-page"><LoadingState /></main>;
  if (failed && projects.length === 0) return <main className="workspace-page"><ErrorState onRetry={loadProjects} /></main>;

  return (
    <main className="workspace-page commercial-workspace">
      <header className="page-heading"><div><p className="eyebrow">{l("Commercial foundation", "الأساس التجاري")}</p><h1>{l("Commercial inventory", "المخزون التجاري")}</h1><p>{l("Project → phase → building → floor → unit inventory, isolated by tenant.", "مخزون الوحدات حسب المشروع ← المرحلة ← المبنى ← الطابق، مع عزل المستأجرين.")}</p></div></header>

      <section className="create-panel commercial-selector">
        <label><span>{l("Project", "المشروع")}</span><select value={projectId} onChange={(e) => { setProjectId(e.target.value); setPhaseId(""); setBuildingId(""); setFloorId(""); }}><option value="">{l("Select project", "اختر المشروع")}</option>{projects.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></label>
      </section>

      {!projectId ? <EmptyState titleKey="projects.emptyTitle" messageKey="projects.emptyMessage" /> : null}
      {failed ? <div className="inline-alert">{l("The inventory request failed. Check permissions and hierarchy values, then retry.", "فشل طلب المخزون. تحقق من الصلاحيات وقيم التسلسل ثم أعد المحاولة.")}</div> : null}

      {projectId ? <>
        <div className="commercial-admin-grid">
          <form className="create-panel project-form" onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f=e.currentTarget; const d=body(new FormData(f), ["code","name","sequence"]); void create("phases", { ...d, projectId, sequence: Number(d.sequence || 0) }, f); }}><h2 className="field-wide">{l("Add phase", "إضافة مرحلة")}</h2><input name="code" placeholder={l("Code", "الرمز")} required /><input name="name" placeholder={l("Name", "الاسم")} required /><input name="sequence" type="number" min="0" defaultValue="0" /><button className="button button-primary" disabled={working}>{l("Create", "إنشاء")}</button></form>
          <form className="create-panel project-form" onSubmit={(e) => { e.preventDefault(); const f=e.currentTarget; const d=body(new FormData(f), ["phaseId","code","name"]); void create("buildings", { ...d, projectId }, f); }}><h2 className="field-wide">{l("Add building", "إضافة مبنى")}</h2><select name="phaseId" required value={phaseId} onChange={(e)=>setPhaseId(e.target.value)}><option value="">{l("Phase", "المرحلة")}</option>{phases.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select><input name="code" placeholder={l("Code", "الرمز")} required /><input name="name" placeholder={l("Name", "الاسم")} required /><button className="button button-primary" disabled={working}>{l("Create", "إنشاء")}</button></form>
          <form className="create-panel project-form" onSubmit={(e) => { e.preventDefault(); const f=e.currentTarget; const d=body(new FormData(f), ["buildingId","code","name","floorNumber","sequence"]); void create("floors", { ...d, floorNumber: Number(d.floorNumber), sequence: Number(d.sequence || 0) }, f); }}><h2 className="field-wide">{l("Add floor", "إضافة طابق")}</h2><select name="buildingId" required value={buildingId} onChange={(e)=>setBuildingId(e.target.value)}><option value="">{l("Building", "المبنى")}</option>{buildings.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select><input name="code" placeholder={l("Code", "الرمز")} required /><input name="name" placeholder={l("Name", "الاسم")} required /><input name="floorNumber" type="number" placeholder={l("Floor number", "رقم الطابق")} required /><input name="sequence" type="number" min="0" defaultValue="0" /><button className="button button-primary" disabled={working}>{l("Create", "إنشاء")}</button></form>
          <form className="create-panel project-form" onSubmit={(e) => { e.preventDefault(); const f=e.currentTarget; const d=body(new FormData(f), ["code","name","bedrooms","bathrooms","defaultArea"]); void create("unit-types", { ...d, projectId, bedrooms: Number(d.bedrooms), bathrooms: Number(d.bathrooms) }, f); }}><h2 className="field-wide">{l("Add unit type", "إضافة نوع وحدة")}</h2><input name="code" placeholder={l("Code", "الرمز")} required /><input name="name" placeholder={l("Name", "الاسم")} required /><input name="bedrooms" type="number" min="0" placeholder={l("Bedrooms", "غرف النوم")} required /><input name="bathrooms" type="number" min="0" placeholder={l("Bathrooms", "الحمامات")} required /><input name="defaultArea" inputMode="decimal" placeholder={l("Default area", "المساحة الافتراضية")} /><button className="button button-primary" disabled={working}>{l("Create", "إنشاء")}</button></form>
        </div>

        <section className="create-panel hierarchy-review"><h2>{l("Hierarchy", "التسلسل")}</h2><div className="hierarchy-columns"><div><h3>{l("Phases", "المراحل")}</h3>{phases.map(x=><button type="button" key={x.id} onClick={()=>void rename("phases",x)}>{x.code} · {x.name}</button>)}</div><div><h3>{l("Buildings", "المباني")}</h3>{buildings.map(x=><button type="button" key={x.id} onClick={()=>void rename("buildings",x)}>{x.code} · {x.name}</button>)}</div><div><h3>{l("Floors", "الطوابق")}</h3>{floors.map(x=><button type="button" key={x.id} onClick={()=>void rename("floors",x)}>{x.code} · {x.name}</button>)}</div><div><h3>{l("Unit types", "أنواع الوحدات")}</h3>{unitTypes.map(x=><button type="button" key={x.id} onClick={()=>void rename("unit-types",x)}>{x.code} · {x.name}</button>)}</div></div><small>{l("Select an item to rename it through the governed update endpoint.", "اختر عنصرًا لإعادة تسميته عبر مسار التحديث المحكوم.")}</small></section>

        <form className="create-panel project-form" onSubmit={(e) => { e.preventDefault(); const f=e.currentTarget; const d=body(new FormData(f), ["phaseId","buildingId","floorId","unitTypeId","code","number","grossArea","netArea","bedrooms","bathrooms","parkingCount","orientation","view"]); void create("units", { ...d, projectId, bedrooms:Number(d.bedrooms), bathrooms:Number(d.bathrooms), parkingCount:Number(d.parkingCount || 0) }, f); }}><h2 className="field-wide">{l("Add unit", "إضافة وحدة")}</h2><select name="phaseId" required value={phaseId} onChange={(e)=>setPhaseId(e.target.value)}><option value="">{l("Phase", "المرحلة")}</option>{phases.map(x=><option key={x.id} value={x.id}>{x.code}</option>)}</select><select name="buildingId" required value={buildingId} onChange={(e)=>setBuildingId(e.target.value)}><option value="">{l("Building", "المبنى")}</option>{buildings.filter(x=>!phaseId||x.phaseId===phaseId).map(x=><option key={x.id} value={x.id}>{x.code}</option>)}</select><select name="floorId" required value={floorId} onChange={(e)=>setFloorId(e.target.value)}><option value="">{l("Floor", "الطابق")}</option>{floors.map(x=><option key={x.id} value={x.id}>{x.code}</option>)}</select><select name="unitTypeId" required><option value="">{l("Unit type", "نوع الوحدة")}</option>{unitTypes.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select><input name="code" placeholder={l("Unit code", "رمز الوحدة")} required /><input name="number" placeholder={l("Unit number", "رقم الوحدة")} required /><input name="grossArea" inputMode="decimal" placeholder={l("Gross area", "المساحة الإجمالية")} required /><input name="netArea" inputMode="decimal" placeholder={l("Net area", "المساحة الصافية")} /><input name="bedrooms" type="number" min="0" placeholder={l("Bedrooms", "غرف النوم")} required /><input name="bathrooms" type="number" min="0" placeholder={l("Bathrooms", "الحمامات")} required /><input name="parkingCount" type="number" min="0" defaultValue="0" /><input name="orientation" placeholder={l("Orientation", "الاتجاه")} /><input name="view" placeholder={l("View", "الإطلالة")} /><button className="button button-primary field-wide" disabled={working || !selectedBuilding}>{l("Create unit", "إنشاء الوحدة")}</button></form>

        <section className="create-panel"><div className="section-heading"><div><h2>{l("Units", "الوحدات")}</h2><p>{l(`${units.total} inventory records`, `${units.total} سجل مخزون`)}</p></div></div><div className="inventory-filters"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={l("Search code or number", "بحث بالرمز أو الرقم")} /><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">{l("All statuses", "كل الحالات")}</option>{statuses.map(x=><option key={x} value={x}>{x}</option>)}</select><button type="button" className="button button-secondary" onClick={()=>{setPhaseId("");setBuildingId("");setFloorId("");setStatus("");setQuery("");}}>{l("Clear filters", "مسح المرشحات")}</button></div><div className="inventory-table" role="table">{units.items.map(unit=><article key={unit.id}><div><code>{unit.code}</code><strong>{unit.number}</strong><span>{unit.building.code} / {unit.floor.code} / {unit.unitType.code}</span></div><div><span className={`status-badge status-${unit.status.toLowerCase()}`}>{unit.status}</span><span>{unit.grossArea} m²</span><span>{unit.bedrooms} / {unit.bathrooms}</span></div><div className="inventory-actions"><button className="button button-quiet" type="button" onClick={()=>void rename("units",unit)}>{l("Rename", "إعادة تسمية")}</button>{["DRAFT","UNRELEASED","BLOCKED"].includes(unit.status)?<button className="button button-primary" type="button" onClick={()=>void transition(unit,"release")}>{l("Release", "طرح")}</button>:null}{["UNRELEASED","AVAILABLE"].includes(unit.status)?<button className="button button-secondary" type="button" onClick={()=>void transition(unit,"block")}>{l("Block", "حظر")}</button>:null}</div></article>)}</div>{units.items.length===0?<p>{l("No units match the current hierarchy and filters.", "لا توجد وحدات مطابقة للتسلسل والمرشحات الحالية.")}</p>:null}</section>
      </> : null}
    </main>
  );
}
