"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import styles from "./BimViewer.module.css";

interface Manifest {
  id: string;
  projectId: string;
  name: string;
  schema: string | null;
  elementCount: number;
  geometry: { url: string; sizeBytes: string; expiresInSeconds: number };
}

interface VisualState {
  globalId: string;
  linked: boolean;
  progress: number | null;
}

interface FourDState {
  globalId: string;
  scheduled: boolean;
  plannedState: "UNSCHEDULED" | "FUTURE" | "ACTIVE" | "PLANNED_COMPLETE";
  plannedStart: string | null;
  plannedFinish: string | null;
  expectedProgress: number | null;
  actualProgress: number | null;
  variance: number | null;
}

interface FourDResponse {
  schedule: {
    id: string;
    name: string;
    revision: string;
    dataDate: string;
    start: string;
    finish: string;
  } | null;
  selectedDate: string | null;
  summary: {
    elements: number;
    scheduled: number;
    future: number;
    active: number;
    plannedComplete: number;
    behind: number;
  } | null;
  elements: FourDState[];
}

interface FiveDState {
  globalId: string;
  costState:
    | "UNBUDGETED"
    | "UNBUDGETED_COST"
    | "CONTROLLED"
    | "OVERCOMMITTED"
    | "OVERRUN";
  currency: string;
  budget: number;
  earnedValue: number;
  actualCost: number;
  commitments: number;
  costVariance: number;
}

interface FiveDResponse {
  budget: {
    id: string;
    name: string;
    revision: string;
    currency: string;
  } | null;
  asOf: string;
  summary: {
    budgetAtCompletion: string;
    plannedValue: string;
    earnedValue: string;
    actualCost: string;
    commitments: string;
    forecastExposure: string;
    costVariance: string;
    scheduleVariance: string;
    cpi: number | null;
    spi: number | null;
    estimateAtCompletion: string | null;
    estimateToComplete: string | null;
    varianceAtCompletion: string | null;
  } | null;
  elements: FiveDState[];
}

interface MaterialElementState {
  globalId: string;
  readinessState: "NO_REQUIREMENT" | "SHORTAGE" | "ORDERED" | "AVAILABLE" | "ISSUED";
  materials: Array<{
    materialId: string;
    code: string;
    status: "SHORTAGE" | "ORDERED" | "AVAILABLE" | "ISSUED";
    required: string;
    stock: string;
    gap: string;
    unit: string;
  }>;
}

interface MaterialStateResponse {
  takeoff: { id: string; name: string; revision: string } | null;
  summary: {
    materials: number;
    shortage: number;
    ordered: number;
    available: number;
    issued: number;
  } | null;
  elements: MaterialElementState[];
}

interface QualityElementState {
  globalId: string;
  qualityState: "CLEAR" | "MINOR" | "MAJOR" | "CRITICAL";
  findings: Array<{
    id: string;
    externalId: string;
    type: "NCR" | "PUNCH" | "OBSERVATION";
    severity: "MINOR" | "MAJOR" | "CRITICAL";
    status: string;
    title: string;
    dueAt: string | null;
  }>;
}

interface QualityStateResponse {
  summary: {
    elements: number;
    clear: number;
    minor: number;
    major: number;
    critical: number;
    openFindings: number;
  };
  elements: QualityElementState[];
}

interface SafetyElementState {
  globalId: string;
  safetyState: "CLEAR" | "CONTROLLED" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  events: Array<{
    id: string;
    externalId: string;
    type: "HAZARD" | "OBSERVATION" | "NEAR_MISS" | "INCIDENT";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: string;
    title: string;
  }>;
  permits: Array<{
    id: string;
    externalId: string;
    type: string;
    status: "ACTIVE" | "SUSPENDED";
    validUntil: string;
  }>;
}

interface SafetyStateResponse {
  summary: {
    elements: number;
    clear: number;
    controlled: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    openEvents: number;
    activePermits: number;
  };
  elements: SafetyElementState[];
}

interface TurnoverElementState {
  globalId: string;
  turnoverState:
    | "NOT_STARTED"
    | "COMMISSIONING"
    | "BLOCKED"
    | "READY_FOR_HANDOVER"
    | "HANDED_OVER";
  latestTest: {
    id: string;
    externalId: string;
    status: string;
    result: string | null;
    scheduledFor: string;
  } | null;
  packages: Array<{
    id: string;
    externalId: string;
    status: string;
    system: string;
  }>;
}

interface TurnoverStateResponse {
  summary: {
    elements: number;
    notStarted: number;
    commissioning: number;
    blocked: number;
    readyForHandover: number;
    handedOver: number;
  };
  elements: TurnoverElementState[];
}

interface WbsNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  progressUpdates: Array<{ percent: string }>;
}

interface ElementDetail {
  id: string;
  globalId: string;
  ifcType: string;
  name: string | null;
  tag: string | null;
  properties: Array<{ id: string; propertySet: string; name: string; value: string | null }>;
  wbsLinks: Array<{ wbsNode: { id: string; code: string; name: string } }>;
}

type ViewMode = "progress" | "fourD" | "fiveD" | "materials" | "quality" | "safety" | "turnover";

const API_URL = "/api/backend";
const DAY_MS = 86_400_000;

function progressColor(state?: VisualState) {
  if (!state?.linked) return 0x64748b;
  if (state.progress === null) return 0x8b5cf6;
  if (state.progress >= 100) return 0x22c55e;
  if (state.progress >= 75) return 0x3b82f6;
  if (state.progress >= 25) return 0xf59e0b;
  return 0xef4444;
}

function fourDColor(state?: FourDState) {
  if (!state?.scheduled) return 0x64748b;
  if (state.plannedState === "FUTURE") return 0x94a3b8;
  if (state.plannedState === "ACTIVE") {
    return state.variance !== null && state.variance < -10 ? 0xef4444 : 0xf59e0b;
  }
  return state.actualProgress !== null && state.actualProgress >= 100
    ? 0x22c55e
    : 0x3b82f6;
}

function fiveDColor(state?: FiveDState) {
  if (!state || state.costState === "UNBUDGETED") return 0x64748b;
  if (
    state.costState === "OVERRUN" ||
    state.costState === "UNBUDGETED_COST"
  ) {
    return 0xef4444;
  }
  if (state.costState === "OVERCOMMITTED") return 0xf59e0b;
  return 0x22c55e;
}

function materialColor(state?: MaterialElementState) {
  if (!state || state.readinessState === "NO_REQUIREMENT") return 0x64748b;
  if (state.readinessState === "SHORTAGE") return 0xef4444;
  if (state.readinessState === "ORDERED") return 0xf59e0b;
  if (state.readinessState === "AVAILABLE") return 0x3b82f6;
  return 0x22c55e;
}

function qualityColor(state?: QualityElementState) {
  if (!state || state.qualityState === "CLEAR") return 0x22c55e;
  if (state.qualityState === "MINOR") return 0x3b82f6;
  if (state.qualityState === "MAJOR") return 0xf59e0b;
  return 0xef4444;
}

function safetyColor(state?: SafetyElementState) {
  if (!state || state.safetyState === "CLEAR") return 0x22c55e;
  if (state.safetyState === "CONTROLLED") return 0x3b82f6;
  if (state.safetyState === "LOW") return 0x8b5cf6;
  if (state.safetyState === "MEDIUM") return 0xf59e0b;
  if (state.safetyState === "HIGH") return 0xf97316;
  return 0xef4444;
}

function turnoverColor(state?: TurnoverElementState) {
  if (!state || state.turnoverState === "NOT_STARTED") return 0x64748b;
  if (state.turnoverState === "COMMISSIONING") return 0xf59e0b;
  if (state.turnoverState === "BLOCKED") return 0xef4444;
  if (state.turnoverState === "READY_FOR_HANDOVER") return 0x3b82f6;
  return 0x22c55e;
}

function findGlobalId(object: THREE.Object3D, known: Map<string, unknown>) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const candidate =
      typeof current.userData.globalId === "string"
        ? current.userData.globalId
        : current.name;
    if (candidate && known.has(candidate)) return candidate;
    current = current.parent;
  }
  return null;
}

function colorScene(
  scene: THREE.Scene,
  progress: Map<string, VisualState>,
  fourD: Map<string, FourDState>,
  fiveD: Map<string, FiveDState>,
  materials: Map<string, MaterialElementState>,
  quality: Map<string, QualityElementState>,
  safety: Map<string, SafetyElementState>,
  turnover: Map<string, TurnoverElementState>,
  mode: ViewMode,
  selectedGlobalId: string | null,
) {
  const known = progress.size
    ? progress
    : fourD.size
      ? fourD
      : materials.size
        ? materials
        : quality.size
          ? quality
          : safety.size
            ? safety
            : turnover;
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const globalId = findGlobalId(object, known);
    const fourDState = globalId ? fourD.get(globalId) : undefined;
    const fiveDState = globalId ? fiveD.get(globalId) : undefined;
    const materialState = globalId ? materials.get(globalId) : undefined;
    const qualityState = globalId ? quality.get(globalId) : undefined;
    const safetyState = globalId ? safety.get(globalId) : undefined;
    const turnoverState = globalId ? turnover.get(globalId) : undefined;
    const isFuture = mode === "fourD" && fourDState?.plannedState === "FUTURE";
    const color =
      globalId === selectedGlobalId
        ? 0xfacc15
        : mode === "turnover"
          ? turnoverColor(turnoverState)
          : mode === "safety"
            ? safetyColor(safetyState)
            : mode === "quality"
            ? qualityColor(qualityState)
            : mode === "materials"
            ? materialColor(materialState)
            : mode === "fiveD"
            ? fiveDColor(fiveDState)
            : mode === "fourD"
            ? fourDColor(fourDState)
            : progressColor(globalId ? progress.get(globalId) : undefined);
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of meshMaterials) {
      if ("color" in material && material.color instanceof THREE.Color) {
        material.color.setHex(color);
      }
      material.transparent = isFuture;
      material.opacity = isFuture ? 0.08 : 1;
      material.depthWrite = !isFuture;
      material.needsUpdate = true;
    }
  });
}

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

function toDayIndex(value: string) {
  return Math.floor(new Date(`${toDateOnly(value)}T00:00:00.000Z`).getTime() / DAY_MS);
}

function fromDayIndex(value: number) {
  return new Date(value * DAY_MS).toISOString().slice(0, 10);
}

function formatMoney(value: string | number | null, currency: string) {
  if (value === null) return "—";
  return `${currency} ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BimViewer({ modelId }: { modelId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const progressRef = useRef(new Map<string, VisualState>());
  const fourDRef = useRef(new Map<string, FourDState>());
  const fiveDRef = useRef(new Map<string, FiveDState>());
  const materialRef = useRef(new Map<string, MaterialElementState>());
  const qualityRef = useRef(new Map<string, QualityElementState>());
  const safetyRef = useRef(new Map<string, SafetyElementState>());
  const turnoverRef = useRef(new Map<string, TurnoverElementState>());
  const modeRef = useRef<ViewMode>("progress");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [wbsNodes, setWbsNodes] = useState<WbsNode[]>([]);
  const [selectedWbsId, setSelectedWbsId] = useState("");
  const [selected, setSelected] = useState<ElementDetail | null>(null);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("progress");
  const [fourD, setFourD] = useState<FourDResponse | null>(null);
  const [fiveD, setFiveD] = useState<FiveDResponse | null>(null);
  const [materialState, setMaterialState] = useState<MaterialStateResponse | null>(null);
  const [qualityState, setQualityState] = useState<QualityStateResponse | null>(null);
  const [safetyState, setSafetyState] = useState<SafetyStateResponse | null>(null);
  const [turnoverState, setTurnoverState] = useState<TurnoverStateResponse | null>(null);
  const [timelineDate, setTimelineDate] = useState("");
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("Loading model…");
  const [error, setError] = useState("");

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(body.message ?? "Request failed");
    }
    return response.json() as Promise<T>;
  }

  function repaint(selectedId: string | null = selected?.globalId ?? null) {
    if (!sceneRef.current) return;
    colorScene(
      sceneRef.current,
      progressRef.current,
      fourDRef.current,
      fiveDRef.current,
      materialRef.current,
      qualityRef.current,
      safetyRef.current,
      turnoverRef.current,
      modeRef.current,
      selectedId,
    );
  }

  async function refreshVisualState(selectedId: string | null = selected?.globalId ?? null) {
    const visual = await api<VisualState[]>(`/bim-models/${modelId}/visual-state`);
    progressRef.current = new Map(visual.map((item) => [item.globalId, item]));
    repaint(selectedId);
  }

  async function refreshFourDState(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await api<FourDResponse>(`/bim-models/${modelId}/4d-state${query}`);
    setFourD(response);
    fourDRef.current = new Map(response.elements.map((item) => [item.globalId, item]));
    if (response.selectedDate) setTimelineDate(toDateOnly(response.selectedDate));
    repaint();
    return response;
  }

  async function refreshFiveDState(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await api<FiveDResponse>(`/bim-models/${modelId}/5d-state${query}`);
    setFiveD(response);
    fiveDRef.current = new Map(response.elements.map((item) => [item.globalId, item]));
    repaint();
    return response;
  }

  async function refreshMaterialState() {
    const response = await api<MaterialStateResponse>(
      `/bim-models/${modelId}/material-state`,
    );
    setMaterialState(response);
    materialRef.current = new Map(
      response.elements.map((item) => [item.globalId, item]),
    );
    repaint();
    return response;
  }

  async function refreshQualityState() {
    const response = await api<QualityStateResponse>(
      `/bim-models/${modelId}/quality-state`,
    );
    setQualityState(response);
    qualityRef.current = new Map(
      response.elements.map((item) => [item.globalId, item]),
    );
    repaint();
    return response;
  }

  async function refreshSafetyState() {
    const response = await api<SafetyStateResponse>(
      `/bim-models/${modelId}/safety-state`,
    );
    setSafetyState(response);
    safetyRef.current = new Map(
      response.elements.map((item) => [item.globalId, item]),
    );
    repaint();
    return response;
  }

  async function refreshTurnoverState() {
    const response = await api<TurnoverStateResponse>(
      `/bim-models/${modelId}/turnover-state`,
    );
    setTurnoverState(response);
    turnoverRef.current = new Map(
      response.elements.map((item) => [item.globalId, item]),
    );
    repaint();
    return response;
  }

  async function inspect(globalId: string) {
    const detail = await api<ElementDetail>(
      `/bim-models/${modelId}/elements/global/${encodeURIComponent(globalId)}`,
    );
    setSelected(detail);
    repaint(globalId);
  }

  function changeMode(mode: ViewMode) {
    modeRef.current = mode;
    setViewMode(mode);
    repaint();
  }

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function initialize() {
      if (!hostRef.current) return;
      try {
        const model = await api<Manifest>(`/bim-models/${modelId}/viewer-manifest`);
        const [visual, wbs, initialFourD] = await Promise.all([
          api<VisualState[]>(`/bim-models/${modelId}/visual-state`),
          api<WbsNode[]>(`/projects/${model.projectId}/wbs`),
          api<FourDResponse>(`/bim-models/${modelId}/4d-state`),
        ]);
        const initialCostDate = initialFourD.selectedDate
          ? toDateOnly(initialFourD.selectedDate)
          : undefined;
        const [
          initialFiveD,
          initialMaterialState,
          initialQualityState,
          initialSafetyState,
          initialTurnoverState,
        ] = await Promise.all([
          api<FiveDResponse>(
            `/bim-models/${modelId}/5d-state${
            initialCostDate ? `?date=${encodeURIComponent(initialCostDate)}` : ""
            }`,
          ),
          api<MaterialStateResponse>(`/bim-models/${modelId}/material-state`),
          api<QualityStateResponse>(`/bim-models/${modelId}/quality-state`),
          api<SafetyStateResponse>(`/bim-models/${modelId}/safety-state`),
          api<TurnoverStateResponse>(`/bim-models/${modelId}/turnover-state`),
        ]);
        if (disposed || !hostRef.current) return;
        setManifest(model);
        setWbsNodes(wbs);
        setFourD(initialFourD);
        setFiveD(initialFiveD);
        setMaterialState(initialMaterialState);
        setQualityState(initialQualityState);
        setSafetyState(initialSafetyState);
        setTurnoverState(initialTurnoverState);
        if (initialFourD.selectedDate) {
          setTimelineDate(toDateOnly(initialFourD.selectedDate));
        }
        progressRef.current = new Map(visual.map((item) => [item.globalId, item]));
        fourDRef.current = new Map(
          initialFourD.elements.map((item) => [item.globalId, item]),
        );
        fiveDRef.current = new Map(
          initialFiveD.elements.map((item) => [item.globalId, item]),
        );
        materialRef.current = new Map(
          initialMaterialState.elements.map((item) => [item.globalId, item]),
        );
        qualityRef.current = new Map(
          initialQualityState.elements.map((item) => [item.globalId, item]),
        );
        safetyRef.current = new Map(
          initialSafetyState.elements.map((item) => [item.globalId, item]),
        );
        turnoverRef.current = new Map(
          initialTurnoverState.elements.map((item) => [item.globalId, item]),
        );

        const host = hostRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x07111f);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
        camera.position.set(30, 30, 30);
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        host.replaceChildren(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.screenSpacePanning = true;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.5));
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(30, 50, 20);
        scene.add(sun);
        scene.add(new THREE.GridHelper(200, 40, 0x33546f, 0x183044));

        const gltf = await new GLTFLoader().loadAsync(model.geometry.url);
        if (disposed) return;
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.material = Array.isArray(object.material)
            ? object.material.map((material) => material.clone())
            : object.material.clone();
        });
        scene.add(gltf.scene);
        colorScene(
          scene,
          progressRef.current,
          fourDRef.current,
          fiveDRef.current,
          materialRef.current,
          qualityRef.current,
          safetyRef.current,
          turnoverRef.current,
          "progress",
          null,
        );

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const distance = Math.max(sphere.radius * 2.6, 10);
        camera.position.copy(sphere.center).add(new THREE.Vector3(distance, distance, distance));
        camera.near = Math.max(distance / 10000, 0.01);
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.target.copy(sphere.center);
        controls.update();

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        renderer.domElement.addEventListener("pointerdown", (event) => {
          if (!renderer) return;
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(gltf.scene.children, true)[0];
          const known = progressRef.current.size
            ? progressRef.current
            : fourDRef.current.size
              ? fourDRef.current
              : materialRef.current.size
                ? materialRef.current
                : qualityRef.current.size
                  ? qualityRef.current
                  : safetyRef.current.size
                    ? safetyRef.current
                    : turnoverRef.current;
          const globalId = hit ? findGlobalId(hit.object, known) : null;
          if (globalId) void inspect(globalId);
        });

        resizeObserver = new ResizeObserver(() => {
          if (!renderer || !host.clientWidth || !host.clientHeight) return;
          renderer.setSize(host.clientWidth, host.clientHeight, false);
          camera.aspect = host.clientWidth / host.clientHeight;
          camera.updateProjectionMatrix();
        });
        resizeObserver.observe(host);

        renderer.setAnimationLoop(() => {
          controls?.update();
          renderer?.render(scene, camera);
        });
        setStatus(`${model.elementCount.toLocaleString()} BIM elements loaded`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load BIM model");
        setStatus("Viewer unavailable");
      }
    }

    void initialize();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      renderer?.setAnimationLoop(null);
      controls?.dispose();
      sceneRef.current?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer?.dispose();
      sceneRef.current = null;
    };
  }, [modelId]);

  useEffect(() => {
    if (!playing || !fourD?.schedule) return;
    const finish = toDayIndex(fourD.schedule.finish);
    const timer = window.setInterval(() => {
      setTimelineDate((current) => {
        const nextIndex = toDayIndex(current) + 1;
        if (nextIndex > finish) {
          setPlaying(false);
          return current;
        }
        const next = fromDayIndex(nextIndex);
        void refreshFourDState(next);
        void refreshFiveDState(next);
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing, fourD?.schedule]);

  async function linkSelected() {
    if (!selected || !selectedWbsId) return;
    try {
      await api(`/bim-models/${modelId}/wbs-links`, {
        method: "POST",
        body: JSON.stringify({
          elementIds: [selected.id],
          wbsNodeId: selectedWbsId,
          weight: 1,
        }),
      });
      await inspect(selected.globalId);
      await refreshVisualState(selected.globalId);
      if (timelineDate) {
        await Promise.all([
          refreshFourDState(timelineDate),
          refreshFiveDState(timelineDate),
        ]);
      }
      await Promise.all([
        refreshMaterialState(),
        refreshQualityState(),
        refreshSafetyState(),
        refreshTurnoverState(),
      ]);
      setStatus("Element linked to WBS");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Linking failed");
    }
  }

  async function submitProgress() {
    if (!selectedWbsId) return;
    try {
      await api(`/wbs/${selectedWbsId}/progress`, {
        method: "POST",
        body: JSON.stringify({ percent: progress, note: "Submitted from BIM viewer" }),
      });
      setStatus("Progress submitted for approval");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Progress submission failed");
    }
  }

  const selectedFourD = selected ? fourDRef.current.get(selected.globalId) : undefined;
  const selectedFiveD = selected ? fiveDRef.current.get(selected.globalId) : undefined;
  const selectedMaterial = selected
    ? materialRef.current.get(selected.globalId)
    : undefined;
  const selectedQuality = selected
    ? qualityRef.current.get(selected.globalId)
    : undefined;
  const selectedSafety = selected
    ? safetyRef.current.get(selected.globalId)
    : undefined;
  const selectedTurnover = selected
    ? turnoverRef.current.get(selected.globalId)
    : undefined;
  const schedule = fourD?.schedule;
  const rangeMin = schedule ? toDayIndex(schedule.start) : 0;
  const rangeMax = schedule ? toDayIndex(schedule.finish) : 0;
  const rangeValue = timelineDate ? toDayIndex(timelineDate) : rangeMin;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>R4C · BIM CONTROL ROOM</p>
          <h1>{manifest?.name ?? "BIM Model"}</h1>
          <p>{manifest?.schema ?? "IFC"} · {status}</p>
        </div>
        <div>
          <div className={styles.modeSwitch} aria-label="Viewer coloring mode">
            <button
              className={viewMode === "progress" ? styles.modeActive : ""}
              onClick={() => changeMode("progress")}
            >
              Progress
            </button>
            <button
              className={viewMode === "fourD" ? styles.modeActive : ""}
              disabled={!schedule}
              onClick={() => changeMode("fourD")}
            >
              4D plan
            </button>
            <button
              className={viewMode === "fiveD" ? styles.modeActive : ""}
              disabled={!fiveD?.budget}
              onClick={() => changeMode("fiveD")}
            >
              5D cost
            </button>
            <button
              className={viewMode === "materials" ? styles.modeActive : ""}
              disabled={!materialState?.takeoff}
              onClick={() => changeMode("materials")}
            >
              Materials
            </button>
            <button
              className={viewMode === "quality" ? styles.modeActive : ""}
              onClick={() => changeMode("quality")}
            >
              Quality
            </button>
            <button
              className={viewMode === "safety" ? styles.modeActive : ""}
              onClick={() => changeMode("safety")}
            >
              HSE
            </button>
            <button
              className={viewMode === "turnover" ? styles.modeActive : ""}
              onClick={() => changeMode("turnover")}
            >
              Turnover
            </button>
          </div>
          <div className={styles.legend}>
            {viewMode === "progress" ? (
              <>
                <span><i className={styles.unlinked} />Unlinked</span>
                <span><i className={styles.notReported} />Linked</span>
                <span><i className={styles.behind} />0–24%</span>
                <span><i className={styles.active} />25–74%</span>
                <span><i className={styles.near} />75–99%</span>
                <span><i className={styles.complete} />100%</span>
              </>
            ) : viewMode === "fourD" ? (
              <>
                <span><i className={styles.unlinked} />Unscheduled</span>
                <span><i className={styles.future} />Future</span>
                <span><i className={styles.active} />Active</span>
                <span><i className={styles.behind} />Behind</span>
                <span><i className={styles.near} />Planned complete</span>
                <span><i className={styles.complete} />Actual complete</span>
              </>
            ) : viewMode === "fiveD" ? (
              <>
                <span><i className={styles.unlinked} />Unbudgeted</span>
                <span><i className={styles.behind} />Unbudgeted cost</span>
                <span><i className={styles.complete} />Controlled</span>
                <span><i className={styles.active} />Overcommitted</span>
                <span><i className={styles.behind} />Cost overrun</span>
              </>
            ) : viewMode === "materials" ? (
              <>
                <span><i className={styles.unlinked} />No requirement</span>
                <span><i className={styles.behind} />Shortage</span>
                <span><i className={styles.active} />Ordered</span>
                <span><i className={styles.near} />Available</span>
                <span><i className={styles.complete} />Issued</span>
              </>
            ) : viewMode === "quality" ? (
              <>
                <span><i className={styles.complete} />Clear</span>
                <span><i className={styles.near} />Minor</span>
                <span><i className={styles.active} />Major</span>
                <span><i className={styles.behind} />Critical</span>
              </>
            ) : viewMode === "safety" ? (
              <>
                <span><i className={styles.complete} />Clear</span>
                <span><i className={styles.near} />Permit controlled</span>
                <span><i className={styles.notReported} />Low</span>
                <span><i className={styles.active} />Medium</span>
                <span><i className={styles.behind} />High / critical</span>
              </>
            ) : (
              <>
                <span><i className={styles.unlinked} />Not started</span>
                <span><i className={styles.active} />Commissioning</span>
                <span><i className={styles.behind} />Blocked</span>
                <span><i className={styles.near} />Ready for handover</span>
                <span><i className={styles.complete} />Handed over</span>
              </>
            )}
          </div>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {schedule && (
        <section className={styles.timeline}>
          <div className={styles.timelineTitle}>
            <strong>{schedule.name}</strong>
            <span>Revision {schedule.revision} · Data date {toDateOnly(schedule.dataDate)}</span>
          </div>
          <div className={styles.timelineControls}>
            <button
              className={styles.playButton}
              onClick={() => {
                changeMode("fourD");
                setPlaying((current) => !current);
              }}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <input
              aria-label="4D playback date"
              type="range"
              min={rangeMin}
              max={rangeMax}
              value={Math.min(Math.max(rangeValue, rangeMin), rangeMax)}
              onChange={(event) => {
                const next = fromDayIndex(Number(event.target.value));
                setTimelineDate(next);
                changeMode("fourD");
                void refreshFourDState(next);
                void refreshFiveDState(next);
              }}
            />
            <time>{timelineDate}</time>
          </div>
          {viewMode === "turnover" && turnoverState ? (
            <div className={styles.metrics}>
              <span><strong>{turnoverState.summary.notStarted}</strong> not started</span>
              <span><strong>{turnoverState.summary.commissioning}</strong> commissioning</span>
              <span><strong>{turnoverState.summary.blocked}</strong> blocked</span>
              <span><strong>{turnoverState.summary.readyForHandover}</strong> ready</span>
              <span><strong>{turnoverState.summary.handedOver}</strong> handed over</span>
            </div>
          ) : viewMode === "safety" && safetyState ? (
            <div className={styles.metrics}>
              <span><strong>{safetyState.summary.openEvents}</strong> open events</span>
              <span><strong>{safetyState.summary.activePermits}</strong> active permits</span>
              <span><strong>{safetyState.summary.critical}</strong> critical elements</span>
              <span><strong>{safetyState.summary.high}</strong> high elements</span>
              <span><strong>{safetyState.summary.controlled}</strong> controlled</span>
            </div>
          ) : viewMode === "quality" && qualityState ? (
            <div className={styles.metrics}>
              <span><strong>{qualityState.summary.openFindings}</strong> open findings</span>
              <span><strong>{qualityState.summary.critical}</strong> critical elements</span>
              <span><strong>{qualityState.summary.major}</strong> major elements</span>
              <span><strong>{qualityState.summary.minor}</strong> minor elements</span>
              <span><strong>{qualityState.summary.clear}</strong> clear elements</span>
            </div>
          ) : viewMode === "materials" && materialState?.summary ? (
            <div className={styles.metrics}>
              <span><strong>{materialState.summary.materials}</strong> materials</span>
              <span><strong>{materialState.summary.shortage}</strong> shortage</span>
              <span><strong>{materialState.summary.ordered}</strong> ordered</span>
              <span><strong>{materialState.summary.available}</strong> available</span>
              <span><strong>{materialState.summary.issued}</strong> issued</span>
            </div>
          ) : viewMode === "fiveD" && fiveD?.summary && fiveD.budget ? (
            <div className={styles.metrics}>
              <span>
                <strong>{formatMoney(fiveD.summary.budgetAtCompletion, fiveD.budget.currency)}</strong>
                BAC
              </span>
              <span>
                <strong>{formatMoney(fiveD.summary.earnedValue, fiveD.budget.currency)}</strong>
                EV
              </span>
              <span>
                <strong>{formatMoney(fiveD.summary.actualCost, fiveD.budget.currency)}</strong>
                AC
              </span>
              <span><strong>{fiveD.summary.cpi ?? "—"}</strong>CPI</span>
              <span><strong>{fiveD.summary.spi ?? "—"}</strong>SPI</span>
            </div>
          ) : fourD.summary ? (
            <div className={styles.metrics}>
              <span><strong>{fourD.summary.scheduled}</strong> scheduled</span>
              <span><strong>{fourD.summary.active}</strong> active</span>
              <span><strong>{fourD.summary.plannedComplete}</strong> planned complete</span>
              <span><strong>{fourD.summary.behind}</strong> behind</span>
            </div>
          ) : null}
        </section>
      )}

      <section className={styles.workspace}>
        <aside className={styles.panel}>
          <h2>WBS control</h2>
          <label>
            WBS activity
            <select value={selectedWbsId} onChange={(event) => setSelectedWbsId(event.target.value)}>
              <option value="">Select WBS activity</option>
              {wbsNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.code} — {node.name}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!selected || !selectedWbsId} onClick={() => void linkSelected()}>
            Link selected element
          </button>

          <h2>Progress update</h2>
          <label>
            Physical progress: {progress}%
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
            />
          </label>
          <button disabled={!selectedWbsId} onClick={() => void submitProgress()}>
            Submit for approval
          </button>
          <p className={styles.hint}>
            Approved progress supplies actual 4D variance; schedule revisions remain immutable.
          </p>
        </aside>

        <div ref={hostRef} className={styles.viewer} aria-label="Interactive BIM model" />

        <aside className={styles.panel}>
          <h2>Element inspector</h2>
          {selected ? (
            <>
              <dl>
                <dt>GlobalId</dt><dd>{selected.globalId}</dd>
                <dt>IFC type</dt><dd>{selected.ifcType}</dd>
                <dt>Name</dt><dd>{selected.name ?? "—"}</dd>
                <dt>Tag</dt><dd>{selected.tag ?? "—"}</dd>
              </dl>
              {selectedFourD && (
                <>
                  <h3>4D status</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedFourD.plannedState}</dd>
                    <dt>Planned</dt>
                    <dd>
                      {selectedFourD.plannedStart
                        ? `${toDateOnly(selectedFourD.plannedStart)} → ${toDateOnly(
                            selectedFourD.plannedFinish!,
                          )}`
                        : "Unscheduled"}
                    </dd>
                    <dt>Expected</dt>
                    <dd>
                      {selectedFourD.expectedProgress === null
                        ? "—"
                        : `${selectedFourD.expectedProgress}%`}
                    </dd>
                    <dt>Actual</dt>
                    <dd>
                      {selectedFourD.actualProgress === null
                        ? "Not approved"
                        : `${selectedFourD.actualProgress}%`}
                    </dd>
                    <dt>Variance</dt>
                    <dd>
                      {selectedFourD.variance === null
                        ? "—"
                        : `${selectedFourD.variance > 0 ? "+" : ""}${selectedFourD.variance}%`}
                    </dd>
                  </dl>
                </>
              )}
              {selectedFiveD && fiveD?.budget && (
                <>
                  <h3>5D cost</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedFiveD.costState}</dd>
                    <dt>Budget</dt>
                    <dd>{formatMoney(selectedFiveD.budget, selectedFiveD.currency)}</dd>
                    <dt>Earned</dt>
                    <dd>{formatMoney(selectedFiveD.earnedValue, selectedFiveD.currency)}</dd>
                    <dt>Actual</dt>
                    <dd>{formatMoney(selectedFiveD.actualCost, selectedFiveD.currency)}</dd>
                    <dt>Committed</dt>
                    <dd>{formatMoney(selectedFiveD.commitments, selectedFiveD.currency)}</dd>
                    <dt>Variance</dt>
                    <dd>{formatMoney(selectedFiveD.costVariance, selectedFiveD.currency)}</dd>
                  </dl>
                </>
              )}
              {selectedMaterial && (
                <>
                  <h3>Material readiness</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedMaterial.readinessState}</dd>
                  </dl>
                  {selectedMaterial.materials.map((item) => (
                    <p key={item.materialId}>
                      {item.code} · {item.status} · required {item.required} {item.unit}
                      {" · "}stock {item.stock} · gap {item.gap}
                    </p>
                  ))}
                </>
              )}
              {selectedQuality && (
                <>
                  <h3>Quality status</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedQuality.qualityState}</dd>
                    <dt>Open findings</dt><dd>{selectedQuality.findings.length}</dd>
                  </dl>
                  {selectedQuality.findings.map((item) => (
                    <p key={item.id}>
                      {item.externalId} · {item.type} · {item.severity} · {item.title}
                    </p>
                  ))}
                </>
              )}
              {selectedSafety && (
                <>
                  <h3>HSE status</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedSafety.safetyState}</dd>
                    <dt>Open events</dt><dd>{selectedSafety.events.length}</dd>
                    <dt>Permits</dt><dd>{selectedSafety.permits.length}</dd>
                  </dl>
                  {selectedSafety.events.map((item) => (
                    <p key={item.id}>
                      {item.externalId} · {item.type} · {item.severity} · {item.title}
                    </p>
                  ))}
                  {selectedSafety.permits.map((item) => (
                    <p key={item.id}>
                      {item.externalId} · {item.type} · {item.status}
                    </p>
                  ))}
                </>
              )}
              {selectedTurnover && (
                <>
                  <h3>Turnover status</h3>
                  <dl>
                    <dt>State</dt><dd>{selectedTurnover.turnoverState}</dd>
                    <dt>Latest test</dt>
                    <dd>
                      {selectedTurnover.latestTest
                        ? `${selectedTurnover.latestTest.externalId} · ${selectedTurnover.latestTest.status} · ${selectedTurnover.latestTest.result ?? "—"}`
                        : "Not scheduled"}
                    </dd>
                    <dt>Packages</dt><dd>{selectedTurnover.packages.length}</dd>
                  </dl>
                  {selectedTurnover.packages.map((item) => (
                    <p key={item.id}>
                      {item.externalId} · {item.system} · {item.status}
                    </p>
                  ))}
                </>
              )}
              <h3>WBS links</h3>
              {selected.wbsLinks.length ? selected.wbsLinks.map((link) => (
                <p key={link.wbsNode.id}>{link.wbsNode.code} — {link.wbsNode.name}</p>
              )) : <p className={styles.hint}>Not linked</p>}
              <h3>Properties</h3>
              <div className={styles.properties}>
                {selected.properties.slice(0, 100).map((property) => (
                  <div key={property.id}>
                    <strong>{property.propertySet}.{property.name}</strong>
                    <span>{property.value ?? "—"}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.hint}>Select an element in the model to inspect and link it.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
