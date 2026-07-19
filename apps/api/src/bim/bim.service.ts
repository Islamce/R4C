import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BimModelStatus, UploadStatus } from "@prisma/client";
import { extname } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { LinkBimElementsDto } from "./bim.dto";
import { BimQueueService } from "./bim-queue.service";

@Injectable()
export class BimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: BimQueueService,
  ) {}

  async requestProcessing(tenantId: string, actorId: string, documentVersionId: string) {
    const version = await this.prisma.documentVersion.findFirst({
      where: { id: documentVersionId, tenantId },
      include: { document: true, bimModel: true },
    });
    if (!version) throw new NotFoundException("Document version not found");
    if (version.uploadStatus !== UploadStatus.UPLOADED) {
      throw new ConflictException("The IFC upload must be confirmed first");
    }
    if (extname(version.fileName).toLowerCase() !== ".ifc") {
      throw new ConflictException("Only IFC document versions can be processed");
    }
    if (version.bimModel) {
      const active = await this.prisma.bimProcessingJob.findFirst({
        where: {
          bimModelId: version.bimModel.id,
          status: { in: ["QUEUED", "RUNNING"] },
        },
      });
      if (active) throw new ConflictException("This model already has an active processing job");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const model = await tx.bimModel.upsert({
        where: { documentVersionId },
        create: {
          tenantId,
          projectId: version.document.projectId,
          documentVersionId,
          name: version.document.title,
          status: BimModelStatus.QUEUED,
        },
        update: {
          status: BimModelStatus.QUEUED,
          lastError: null,
        },
      });
      const processingJob = await tx.bimProcessingJob.create({
        data: { tenantId, bimModelId: model.id },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "BIM_PROCESSING_QUEUED",
          entityType: "BimModel",
          entityId: model.id,
          metadata: { processingJobId: processingJob.id, documentVersionId },
        },
      });
      return { model, processingJob };
    });

    try {
      await this.queue.enqueue({
        processingJobId: result.processingJob.id,
        bimModelId: result.model.id,
        tenantId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue unavailable";
      await this.prisma.$transaction([
        this.prisma.bimProcessingJob.update({
          where: { id: result.processingJob.id },
          data: { status: "FAILED", lastError: message, finishedAt: new Date() },
        }),
        this.prisma.bimModel.update({
          where: { id: result.model.id },
          data: { status: "FAILED", lastError: message },
        }),
      ]);
      throw error;
    }

    return {
      bimModelId: result.model.id,
      processingJobId: result.processingJob.id,
      status: "QUEUED",
    };
  }

  async status(tenantId: string, bimModelId: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      include: {
        jobs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!model) throw new NotFoundException("BIM model not found");
    return model;
  }

  async spatialTree(tenantId: string, bimModelId: string) {
    await this.requireModel(tenantId, bimModelId);
    return this.prisma.bimSpatialNode.findMany({
      where: { tenantId, bimModelId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { elements: true, children: true } } },
    });
  }

  async elements(
    tenantId: string,
    bimModelId: string,
    page: number,
    limit: number,
    ifcType?: string,
  ) {
    await this.requireModel(tenantId, bimModelId);
    const take = Math.min(Math.max(limit, 1), 200);
    const where = {
      tenantId,
      bimModelId,
      ...(ifcType ? { ifcType } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.bimElement.count({ where }),
      this.prisma.bimElement.findMany({
        where,
        skip: (Math.max(page, 1) - 1) * take,
        take,
        orderBy: [{ ifcType: "asc" }, { name: "asc" }],
        include: {
          spatialNode: { select: { id: true, name: true, spatialType: true } },
          wbsLinks: { include: { wbsNode: { select: { id: true, code: true, name: true } } } },
        },
      }),
    ]);
    return { total, page: Math.max(page, 1), limit: take, rows };
  }

  async linkElements(
    tenantId: string,
    actorId: string,
    bimModelId: string,
    command: LinkBimElementsDto,
  ) {
    const model = await this.requireModel(tenantId, bimModelId);
    if (model.status !== BimModelStatus.READY) {
      throw new ConflictException("BIM model must be ready before WBS linking");
    }

    const wbs = await this.prisma.wbsNode.findFirst({
      where: { id: command.wbsNodeId, tenantId, projectId: model.projectId },
    });
    if (!wbs) throw new NotFoundException("WBS node not found in this project");

    const count = await this.prisma.bimElement.count({
      where: { id: { in: command.elementIds }, tenantId, bimModelId },
    });
    if (count !== new Set(command.elementIds).size) {
      throw new NotFoundException("One or more BIM elements were not found in this model");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const links = await tx.bimWbsLink.createMany({
        data: [...new Set(command.elementIds)].map((elementId) => ({
          tenantId,
          elementId,
          wbsNodeId: command.wbsNodeId,
          linkedById: actorId,
          weight: command.weight,
        })),
        skipDuplicates: true,
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "BIM_ELEMENTS_LINKED_TO_WBS",
          entityType: "WbsNode",
          entityId: command.wbsNodeId,
          metadata: { bimModelId, requested: command.elementIds.length, created: links.count },
        },
      });
      return links;
    });
    return { linked: result.count, wbsNodeId: command.wbsNodeId };
  }

  private async requireModel(tenantId: string, bimModelId: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
    });
    if (!model) throw new NotFoundException("BIM model not found");
    return model;
  }
}
