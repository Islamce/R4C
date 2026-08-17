import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CommitWbsImportDto,
  CreateProjectDto,
  CreateWbsNodeDto,
  PreviewWbsImportDto,
  WbsImportRowDto,
} from "./projects.dto";

export interface WbsImportIssue {
  rowNumber: number;
  code: string;
  field: "code" | "name" | "parentCode" | "plannedFrom" | "plannedTo" | "weight" | "general";
  reasonCode:
    | "DUPLICATE_CODE"
    | "DATE_ORDER"
    | "SELF_PARENT"
    | "PARENT_NOT_FOUND"
    | "HIERARCHY_CYCLE"
    | "EXISTING_CODE";
  message: string;
}

export interface WbsImportPreviewRow {
  rowNumber: number;
  code: string;
  name: string;
  parentCode: string | null;
  sortOrder: number;
  plannedFrom: string | null;
  plannedTo: string | null;
  weight: number;
  depth: number;
  parentSource: "root" | "existing" | "import";
}

export interface WbsImportPreview {
  projectId: string;
  sourceName: string | null;
  checksum: string;
  canCommit: boolean;
  summary: {
    receivedRows: number;
    validRows: number;
    invalidRows: number;
    rootRows: number;
    existingParentLinks: number;
    importedParentLinks: number;
  };
  rows: WbsImportPreviewRow[];
  issues: WbsImportIssue[];
}

interface NormalizedImportRow {
  rowNumber: number;
  code: string;
  name: string;
  parentCode: string | null;
  sortOrder: number;
  plannedFrom: string | null;
  plannedTo: string | null;
  weight: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { wbsNodes: true, workItems: true } } },
    });
  }

  async wbsTree(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.wbsNode.findMany({
      where: { tenantId, projectId },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: {
        _count: { select: { children: true, workItems: true, bimLinks: true } },
        progressUpdates: {
          where: { status: "APPROVED" },
          orderBy: { reportedAt: "desc" },
          take: 1,
        },
      },
    });
  }

  async create(tenantId: string, actorId: string, command: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        tenantId,
        code: command.code.trim().toUpperCase(),
        name: command.name.trim(),
        description: command.description,
        startDate: command.startDate ? new Date(command.startDate) : undefined,
        targetDate: command.targetDate ? new Date(command.targetDate) : undefined,
      },
    });
    await this.audit.record({
      tenantId,
      actorId,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: project.id,
      metadata: { code: project.code },
    });
    return project;
  }

  async createWbsNode(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateWbsNodeDto,
  ) {
    await this.requireProject(tenantId, projectId);

    if (command.parentId) {
      const parent = await this.prisma.wbsNode.findFirst({
        where: { id: command.parentId, tenantId, projectId },
      });
      if (!parent) throw new NotFoundException("Parent WBS node not found");
    }

    const node = await this.prisma.wbsNode.create({
      data: {
        tenantId,
        projectId,
        parentId: command.parentId,
        code: command.code.trim().toUpperCase(),
        name: command.name.trim(),
      },
    });
    await this.audit.record({
      tenantId,
      actorId,
      action: "WBS_NODE_CREATED",
      entityType: "WbsNode",
      entityId: node.id,
      metadata: { projectId, code: node.code },
    });
    return node;
  }

  async previewWbsImport(
    tenantId: string,
    projectId: string,
    command: PreviewWbsImportDto,
  ): Promise<WbsImportPreview> {
    await this.requireProject(tenantId, projectId);
    const rows = command.rows.map((row) => this.normalizeImportRow(row));
    const issues: WbsImportIssue[] = [];
    const issueRows = new Set<number>();
    const addIssue = (
      row: NormalizedImportRow,
      field: WbsImportIssue["field"],
      reasonCode: WbsImportIssue["reasonCode"],
      message: string,
    ) => {
      issues.push({ rowNumber: row.rowNumber, code: row.code, field, reasonCode, message });
      issueRows.add(row.rowNumber);
    };

    const byCode = new Map<string, NormalizedImportRow>();
    for (const row of rows) {
      const prior = byCode.get(row.code);
      if (prior) {
        addIssue(row, "code", "DUPLICATE_CODE", `Duplicate WBS code; it is already used on spreadsheet row ${prior.rowNumber}.`);
        addIssue(prior, "code", "DUPLICATE_CODE", `Duplicate WBS code; it is repeated on spreadsheet row ${row.rowNumber}.`);
      } else {
        byCode.set(row.code, row);
      }
      if (row.plannedFrom && row.plannedTo && new Date(row.plannedFrom) > new Date(row.plannedTo)) {
        addIssue(row, "plannedTo", "DATE_ORDER", "Planned finish must be on or after planned start.");
      }
      if (row.parentCode === row.code) {
        addIssue(row, "parentCode", "SELF_PARENT", "A WBS node cannot be its own parent.");
      }
    }

    const lookupCodes = [
      ...new Set([
        ...byCode.keys(),
        ...rows.flatMap((row) => (row.parentCode ? [row.parentCode] : [])),
      ]),
    ];
    const existingNodes = lookupCodes.length
      ? await this.prisma.wbsNode.findMany({
          where: { tenantId, projectId, code: { in: lookupCodes } },
          select: { id: true, code: true },
        })
      : [];
    const existingByCode = new Map(existingNodes.map((node) => [node.code, node]));
    for (const row of rows) {
      if (existingByCode.has(row.code)) {
        addIssue(row, "code", "EXISTING_CODE", "This WBS code already exists in the selected project.");
      }
      if (row.parentCode && !byCode.has(row.parentCode) && !existingByCode.has(row.parentCode)) {
        addIssue(row, "parentCode", "PARENT_NOT_FOUND", "Parent code was not found in the selected project or this import.");
      }
    }

    for (const row of rows) {
      const traversed = new Set<string>();
      let current: NormalizedImportRow | undefined = row;
      while (current?.parentCode && byCode.has(current.parentCode)) {
        if (traversed.has(current.code)) {
          addIssue(row, "parentCode", "HIERARCHY_CYCLE", "Parent hierarchy contains a cycle.");
          break;
        }
        traversed.add(current.code);
        current = byCode.get(current.parentCode);
      }
    }

    const depthFor = (row: NormalizedImportRow) => {
      let depth = 0;
      let current: NormalizedImportRow | undefined = row;
      const traversed = new Set<string>();
      while (current?.parentCode && byCode.has(current.parentCode) && !traversed.has(current.code)) {
        traversed.add(current.code);
        depth += 1;
        current = byCode.get(current.parentCode);
      }
      return depth;
    };

    const previewRows = rows.map<WbsImportPreviewRow>((row) => ({
      ...row,
      depth: depthFor(row),
      parentSource: row.parentCode
        ? existingByCode.has(row.parentCode)
          ? "existing"
          : "import"
        : "root",
    }));
    const invalidRows = new Set(issueRows).size;
    const checksum = this.importChecksum(projectId, rows);
    const sourceName = command.sourceName?.trim() || null;

    return {
      projectId,
      sourceName,
      checksum,
      canCommit: rows.length > 0 && issues.length === 0,
      summary: {
        receivedRows: rows.length,
        validRows: rows.length - invalidRows,
        invalidRows,
        rootRows: rows.filter((row) => !row.parentCode).length,
        existingParentLinks: rows.filter(
          (row) => row.parentCode && existingByCode.has(row.parentCode),
        ).length,
        importedParentLinks: rows.filter(
          (row) => row.parentCode && byCode.has(row.parentCode),
        ).length,
      },
      rows: previewRows,
      issues: issues.sort((left, right) => left.rowNumber - right.rowNumber),
    };
  }

  async commitWbsImport(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CommitWbsImportDto,
  ) {
    const preview = await this.previewWbsImport(tenantId, projectId, command);
    if (preview.checksum !== command.previewChecksum) {
      throw new ConflictException("Import rows changed since the reviewed preview. Run validation again.");
    }
    if (!preview.canCommit) {
      throw new BadRequestException({
        message: "The WBS import contains validation errors and cannot be committed.",
        issues: preview.issues,
      });
    }

    const rows = preview.rows;
    return this.prisma.$transaction(async (tx) => {
      const importedCodes = rows.map((row) => row.code);
      const existing = await tx.wbsNode.findMany({
        where: { tenantId, projectId, code: { in: importedCodes } },
        select: { id: true, code: true },
      });
      if (existing.length) {
        throw new ConflictException({
          message: "One or more WBS codes were created after validation. Run validation again.",
          codes: existing.map((node) => node.code),
        });
      }

      const parentCodes = [...new Set(rows.flatMap((row) => (row.parentCode ? [row.parentCode] : [])))];
      const existingParents = parentCodes.length
        ? await tx.wbsNode.findMany({
            where: { tenantId, projectId, code: { in: parentCodes } },
            select: { id: true, code: true },
          })
        : [];
      const parentIds = new Map(existingParents.map((node) => [node.code, node.id]));
      const pending = [...rows];
      const created: Array<{ id: string; code: string; parentCode: string | null }> = [];

      while (pending.length) {
        const ready = pending.filter((row) => !row.parentCode || parentIds.has(row.parentCode));
        if (!ready.length) {
          throw new ConflictException("The WBS hierarchy changed after validation. Run validation again.");
        }
        for (const row of ready) {
          const node = await tx.wbsNode.create({
            data: {
              tenantId,
              projectId,
              parentId: row.parentCode ? parentIds.get(row.parentCode) : undefined,
              code: row.code,
              name: row.name,
              sortOrder: row.sortOrder,
              plannedFrom: row.plannedFrom ? new Date(row.plannedFrom) : undefined,
              plannedTo: row.plannedTo ? new Date(row.plannedTo) : undefined,
              weight: row.weight,
            },
            select: { id: true, code: true },
          });
          parentIds.set(node.code, node.id);
          created.push({ id: node.id, code: node.code, parentCode: row.parentCode });
          pending.splice(pending.indexOf(row), 1);
        }
      }

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "WBS_IMPORT_COMMITTED",
          entityType: "Project",
          entityId: projectId,
          metadata: {
            checksum: preview.checksum,
            sourceName: preview.sourceName,
            importedCount: created.length,
            codes: created.map((node) => node.code),
          },
        },
      });

      return {
        projectId,
        checksum: preview.checksum,
        sourceName: preview.sourceName,
        createdCount: created.length,
        created,
      };
    });
  }

  private normalizeImportRow(row: WbsImportRowDto): NormalizedImportRow {
    return {
      rowNumber: row.rowNumber,
      code: row.code.trim().toUpperCase(),
      name: row.name.trim(),
      parentCode: row.parentCode?.trim().toUpperCase() || null,
      sortOrder: row.sortOrder ?? 0,
      plannedFrom: row.plannedFrom ?? null,
      plannedTo: row.plannedTo ?? null,
      weight: row.weight ?? 0,
    };
  }

  private importChecksum(projectId: string, rows: NormalizedImportRow[]) {
    return createHash("sha256")
      .update(JSON.stringify({ projectId, rows }))
      .digest("hex");
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
