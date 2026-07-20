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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function progressColor(state?: VisualState) {
  if (!state?.linked) return 0x64748b;
  if (state.progress === null) return 0x8b5cf6;
  if (state.progress >= 100) return 0x22c55e;
  if (state.progress >= 75) return 0x3b82f6;
  if (state.progress >= 25) return 0xf59e0b;
  return 0xef4444;
}

function findGlobalId(object: THREE.Object3D, known: Map<string, VisualState>) {
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
  known: Map<string, VisualState>,
  selectedGlobalId: string | null,
) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const globalId = findGlobalId(object, known);
    const color = globalId === selectedGlobalId ? 0xfacc15 : progressColor(
      globalId ? known.get(globalId) : undefined,
    );
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if ("color" in material && material.color instanceof THREE.Color) {
        material.color.setHex(color);
      }
    }
  });
}

export function BimViewer({ modelId }: { modelId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const visualRef = useRef(new Map<string, VisualState>());
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [wbsNodes, setWbsNodes] = useState<WbsNode[]>([]);
  const [selectedWbsId, setSelectedWbsId] = useState("");
  const [selected, setSelected] = useState<ElementDetail | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Loading model…");
  const [error, setError] = useState("");

  const token = () => window.localStorage.getItem("r4c_access_token");

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const accessToken = token();
    if (!accessToken) throw new Error("Sign in first; no R4C access token was found.");
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(body.message ?? "Request failed");
    }
    return response.json() as Promise<T>;
  }

  async function refreshVisualState(selectedId: string | null = selected?.globalId ?? null) {
    const visual = await api<VisualState[]>(`/bim-models/${modelId}/visual-state`);
    visualRef.current = new Map(visual.map((item) => [item.globalId, item]));
    if (sceneRef.current) colorScene(sceneRef.current, visualRef.current, selectedId);
  }

  async function inspect(globalId: string) {
    const detail = await api<ElementDetail>(
      `/bim-models/${modelId}/elements/global/${encodeURIComponent(globalId)}`,
    );
    setSelected(detail);
    if (sceneRef.current) colorScene(sceneRef.current, visualRef.current, globalId);
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
        const [visual, wbs] = await Promise.all([
          api<VisualState[]>(`/bim-models/${modelId}/visual-state`),
          api<WbsNode[]>(`/projects/${model.projectId}/wbs`),
        ]);
        if (disposed || !hostRef.current) return;
        setManifest(model);
        setWbsNodes(wbs);
        visualRef.current = new Map(visual.map((item) => [item.globalId, item]));

        const host = hostRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x07111f);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
        camera.position.set(30, 30, 30);
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
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
        colorScene(scene, visualRef.current, null);

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
          const globalId = hit ? findGlobalId(hit.object, visualRef.current) : null;
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

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>R4C · BIM CONTROL ROOM</p>
          <h1>{manifest?.name ?? "BIM Model"}</h1>
          <p>{manifest?.schema ?? "IFC"} · {status}</p>
        </div>
        <div className={styles.legend}>
          <span><i className={styles.unlinked} />Unlinked</span>
          <span><i className={styles.notReported} />Linked</span>
          <span><i className={styles.behind} />0–24%</span>
          <span><i className={styles.active} />25–74%</span>
          <span><i className={styles.near} />75–99%</span>
          <span><i className={styles.complete} />100%</span>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

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
          <p className={styles.hint}>Approved progress controls the model colors.</p>
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
