import assert from "node:assert/strict";
import test from "node:test";
import { ProjectsService } from "../dist/projects/projects.service.js";

function makePrisma() {
  const existing = [{ id: "existing-root", code: "0", tenantId: "tenant-a", projectId: "project-a" }];
  const created = [];
  const audits = [];
  let sequence = 0;
  const project = { id: "project-a", tenantId: "tenant-a" };

  const findExisting = async ({ where }) => {
    const wanted = new Set(where.code?.in ?? []);
    return [...existing, ...created]
      .filter((node) => node.tenantId === where.tenantId && node.projectId === where.projectId && wanted.has(node.code))
      .map((node) => ({ id: node.id, code: node.code }));
  };

  const transaction = {
    wbsNode: {
      findMany: findExisting,
      create: async ({ data }) => {
        const node = { id: `created-${++sequence}`, ...data };
        created.push(node);
        return { id: node.id, code: node.code };
      },
    },
    auditEvent: {
      create: async ({ data }) => {
        audits.push(data);
        return data;
      },
    },
  };

  return {
    project: { findFirst: async ({ where }) => (where.id === project.id && where.tenantId === project.tenantId ? project : null) },
    wbsNode: { findMany: findExisting },
    $transaction: async (callback) => callback(transaction),
    state: { created, audits },
  };
}

const rows = [
  { rowNumber: 2, code: "1", name: "Delivery", parentCode: "0", sortOrder: 10, weight: 100 },
  { rowNumber: 3, code: "1.1", name: "Design", parentCode: "1", sortOrder: 20, plannedFrom: "2026-01-01", plannedTo: "2026-03-31", weight: 25 },
];

test("WBS import preview accepts a tenant-scoped existing parent and calculates imported hierarchy depth", async () => {
  const prisma = makePrisma();
  const service = new ProjectsService(prisma);
  const preview = await service.previewWbsImport("tenant-a", "project-a", { sourceName: "wbs.xlsx", rows });

  assert.equal(preview.canCommit, true);
  assert.equal(preview.issues.length, 0);
  assert.equal(preview.summary.existingParentLinks, 1);
  assert.equal(preview.summary.importedParentLinks, 1);
  assert.deepEqual(
    preview.rows.map((row) => [row.code, row.depth, row.parentSource]),
    [["1", 0, "existing"], ["1.1", 1, "import"]],
  );
});

test("WBS import commit creates parent packages before children and records one batch audit event", async () => {
  const prisma = makePrisma();
  const service = new ProjectsService(prisma);
  const preview = await service.previewWbsImport("tenant-a", "project-a", { sourceName: "wbs.xlsx", rows });
  const receipt = await service.commitWbsImport("tenant-a", "project-a", "user-a", {
    sourceName: "wbs.xlsx",
    rows,
    previewChecksum: preview.checksum,
  });

  assert.equal(receipt.createdCount, 2);
  assert.deepEqual(prisma.state.created.map((node) => node.code), ["1", "1.1"]);
  assert.equal(prisma.state.created[0].parentId, "existing-root");
  assert.equal(prisma.state.created[1].parentId, "created-1");
  assert.equal(prisma.state.audits.length, 1);
  assert.equal(prisma.state.audits[0].action, "WBS_IMPORT_COMMITTED");
  assert.deepEqual(prisma.state.audits[0].metadata.codes, ["1", "1.1"]);
});

test("WBS import preview blocks duplicate spreadsheet codes and existing project codes", async () => {
  const prisma = makePrisma();
  const service = new ProjectsService(prisma);
  const duplicate = await service.previewWbsImport("tenant-a", "project-a", {
    rows: [
      { rowNumber: 2, code: "1", name: "Delivery" },
      { rowNumber: 3, code: "1", name: "Repeated delivery" },
    ],
  });
  const existing = await service.previewWbsImport("tenant-a", "project-a", {
    rows: [{ rowNumber: 2, code: "0", name: "Existing root" }],
  });

  assert.equal(duplicate.canCommit, false);
  assert.ok(duplicate.issues.some((issue) => issue.reasonCode === "DUPLICATE_CODE"));
  assert.equal(existing.canCommit, false);
  assert.ok(existing.issues.some((issue) => issue.reasonCode === "EXISTING_CODE"));
});


test("WBS import does not disclose or write a project outside the authenticated tenant", async () => {
  const prisma = makePrisma();
  const service = new ProjectsService(prisma);

  await assert.rejects(
    () => service.previewWbsImport("tenant-b", "project-a", { rows }),
    /Project not found/,
  );
  assert.equal(prisma.state.created.length, 0);
  assert.equal(prisma.state.audits.length, 0);
});

test("WBS import rejects a commit whose reviewed checksum is stale or altered", async () => {
  const prisma = makePrisma();
  const service = new ProjectsService(prisma);

  await assert.rejects(
    () => service.commitWbsImport("tenant-a", "project-a", "user-a", {
      sourceName: "wbs.xlsx",
      rows,
      previewChecksum: "0".repeat(64),
    }),
    /Import rows changed since the reviewed preview/,
  );
  assert.equal(prisma.state.created.length, 0);
  assert.equal(prisma.state.audits.length, 0);
});
