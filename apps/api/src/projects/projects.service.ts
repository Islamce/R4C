import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto, CreateWbsNodeDto } from "./projects.dto";

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
    const project = await this.prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException("Project not found");

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
}
