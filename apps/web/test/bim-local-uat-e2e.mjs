import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const apiBase = process.env.JOURNEY_API_URL ?? "http://127.0.0.1:4000/api/v1";
const tenantCode = process.env.SEED_UAT_TENANT_CODE ?? "ALOMRAN";
const email = process.env.SEED_UAT_ADMIN_EMAIL ?? "uat.admin@alomran.test";
const password = process.env.SEED_UAT_ADMIN_PASSWORD;
const fixturePath = path.resolve(
  process.cwd(),
  "../bim-worker/tests/fixtures/r4c-synthetic-box.ifc",
);

async function request(pathname, { token, method = "GET", body } = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {}
  return { response, body: parsed };
}

test("local BIM journey produces semantic data and renderable stored GLB", { timeout: 240_000 }, async () => {
  assert.ok(password, "SEED_UAT_ADMIN_PASSWORD is required");
  const fixture = await readFile(fixturePath);
  assert.match(fixture.toString("utf8"), /IFCEXTRUDEDAREASOLID/);

  const tenant = await request(`/tenants/by-code/${tenantCode}`);
  assert.equal(tenant.response.status, 200, JSON.stringify(tenant.body));
  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password, tenantId: tenant.body.id },
  });
  assert.equal(login.response.status, 201, JSON.stringify(login.body));
  const token = login.body.accessToken;

  const projects = await request("/projects", { token });
  assert.equal(projects.response.status, 200, JSON.stringify(projects.body));
  assert.ok(projects.body.length, "Alomran seed must provide a project");
  const project = projects.body[0];

  const suffix = Date.now().toString(36).toUpperCase();
  const document = await request(`/projects/${project.id}/documents`, {
    token,
    method: "POST",
    body: {
      code: `BIM-${suffix}`,
      title: "R4C Synthetic Local UAT Model",
      documentType: "IFC",
      discipline: "Architecture",
    },
  });
  assert.equal(document.response.status, 201, JSON.stringify(document.body));

  const uploadRequest = await request(
    `/documents/${document.body.id}/versions/upload-request`,
    {
      token,
      method: "POST",
      body: {
        revision: "UAT-1",
        fileName: "r4c-synthetic-box.ifc",
        mimeType: "application/ifc",
        sizeBytes: fixture.byteLength,
        checksumSha256: createHash("sha256").update(fixture).digest("hex"),
      },
    },
  );
  assert.equal(uploadRequest.response.status, 201, JSON.stringify(uploadRequest.body));

  const uploaded = await fetch(uploadRequest.body.upload.url, {
    method: "PUT",
    headers: { "content-type": "application/ifc" },
    body: fixture,
  });
  assert.ok(uploaded.ok, `IFC object upload returned ${uploaded.status}`);

  const versionId = uploadRequest.body.version.id;
  const confirmed = await request(`/document-versions/${versionId}/confirm-upload`, {
    token,
    method: "POST",
  });
  assert.equal(confirmed.response.status, 201, JSON.stringify(confirmed.body));
  assert.equal(confirmed.body.uploadStatus, "UPLOADED");

  const processing = await request(`/document-versions/${versionId}/bim/process`, {
    token,
    method: "POST",
  });
  assert.equal(processing.response.status, 201, JSON.stringify(processing.body));

  let model;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const status = await request(`/bim-models/${processing.body.bimModelId}`, { token });
    assert.equal(status.response.status, 200, JSON.stringify(status.body));
    model = status.body;
    if (model.status === "READY") break;
    if (model.status === "FAILED") throw new Error(`BIM processing failed: ${model.lastError}`);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  assert.equal(model?.status, "READY", `BIM model did not become READY: ${JSON.stringify(model)}`);
  assert.equal(model.ifcSchema, "IFC4");
  assert.equal(model.elementCount, 1);
  assert.ok(model.spatialNodeCount >= 4);

  const spatial = await request(`/bim-models/${model.id}/spatial-tree`, { token });
  assert.equal(spatial.response.status, 200, JSON.stringify(spatial.body));
  assert.deepEqual(
    spatial.body.map((node) => node.spatialType),
    ["PROJECT", "SITE", "BUILDING", "STOREY"],
  );

  const elements = await request(`/bim-models/${model.id}/elements`, { token });
  assert.equal(elements.response.status, 200, JSON.stringify(elements.body));
  assert.equal(elements.body.total, 1);
  assert.equal(elements.body.rows[0].ifcType, "IfcWall");
  assert.equal(elements.body.rows[0].name, "Renderable Wall");

  const element = await request(
    `/bim-models/${model.id}/elements/global/${encodeURIComponent(elements.body.rows[0].globalId)}`,
    { token },
  );
  assert.equal(element.response.status, 200, JSON.stringify(element.body));
  assert.ok(
    element.body.properties.some(
      (property) =>
        property.propertySet === "Pset_R4CSynthetic" &&
        property.name === "FixturePurpose" &&
        property.value === "BIM Local UAT",
    ),
  );

  const manifest = await request(`/bim-models/${model.id}/viewer-manifest`, { token });
  assert.equal(manifest.response.status, 200, JSON.stringify(manifest.body));
  assert.equal(manifest.body.geometry.format, "GLB");
  assert.equal(manifest.body.geometry.mimeType, "model/gltf-binary");
  assert.ok(Number(manifest.body.geometry.sizeBytes) > 0);
  const glb = Buffer.from(await (await fetch(manifest.body.geometry.url)).arrayBuffer());
  assert.equal(glb.subarray(0, 4).toString("ascii"), "glTF");
  assert.equal(glb.byteLength, Number(manifest.body.geometry.sizeBytes));

  console.log(`BIM_MODEL_ID=${model.id}`);
  console.log(
    JSON.stringify({
      schema: model.ifcSchema,
      elements: model.elementCount,
      spatialNodes: model.spatialNodeCount,
      geometryBytes: glb.byteLength,
      globalId: elements.body.rows[0].globalId,
    }),
  );
});
