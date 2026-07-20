import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  QualityFindingSeverity,
  QualityFindingStatus,
  QualityInspectionStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CloseQualityFindingDto,
  CompleteQualityActionDto,
  CreateQualityActionDto,
  CreateQualityFindingDto,
  CreateQualityPlanDto,
  ReviewInspectionDto,
  ScheduleInspectionDto,
  SubmitInspectionDto,
  VerifyQualityActionDto,
} from "./quality.dto";

@Injectable()
export class QualityService {
  constructor(private readonly prisma: PrismaService) {}

  async plans(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.qualityPlan.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { checkpoints: true } },
      },
    });
  }

  async activePlan(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeQualityPlanId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeQualityPlanId) {
      throw new NotFoundException("No published quality plan exists");
    }
    return this.prisma.qualityPlan.findFirstOrThrow({
      where: { id: project.activeQualityPlanId, tenantId, projectId },
      include: {
        checkpoints: {
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
          include: { wbsNode: { select: { id: true, code: true, name: true } } },
        },
      },
    });
  }

  async createPlan(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateQualityPlanDto,
  ) {
    await this.requireProject(tenantId, projectId);
    const codes = command.checkpoints.map((item) => item.code.trim().toUpperCase());
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException("Checkpoint codes must be unique within a plan");
    }
    const wbsIds = [
      ...new Set(
        command.checkpoints
          .map((item) => item.wbsNodeId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    if (wbsIds.length) {
      const count = await this.prisma.wbsNode.count({
        where: { id: { in: wbsIds }, tenantId, projectId },
      });
      if (count !== wbsIds.length) {
        throw new BadRequestException("Every checkpoint WBS node must belong to this project");
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const plan = await tx.qualityPlan.create({
          data: {
            tenantId,
            projectId,
            revision: command.revision.trim(),
            name: command.name.trim(),
            createdById: actorId,
          },
        });
        await tx.qualityCheckpoint.createMany({
          data: command.checkpoints.map((item, index) => ({
            tenantId,
            qualityPlanId: plan.id,
            wbsNodeId: item.wbsNodeId,
            code: item.code.trim().toUpperCase(),
            title: item.title.trim(),
            inspectionType: item.inspectionType.trim().toUpperCase(),
            acceptanceCriteria: item.acceptanceCriteria.trim(),
            holdPoint: item.holdPoint ?? false,
            ifcType: item.ifcType?.trim().toUpperCase(),
            sortOrder: item.sortOrder ?? index,
          })),
        });
        await this.audit(tx, tenantId, actorId, "QUALITY_PLAN_CREATED", "QualityPlan", plan.id, {
          projectId,
          revision: plan.revision,
          checkpoints: command.checkpoints.length,
        });
        return tx.qualityPlan.findUniqueOrThrow({
          where: { id: plan.id },
          include: { _count: { select: { checkpoints: true } } },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Quality plan revision or checkpoint code already exists");
      }
      throw error;
    }
  }

  async publishPlan(
    tenantId: string,
    projectId: string,
    planId: string,
    actorId: string,
  ) {
    const plan = await this.prisma.qualityPlan.findFirst({
      where: { id: planId, tenantId, projectId },
      include: { _count: { select: { checkpoints: true } } },
    });
    if (!plan) throw new NotFoundException("Quality plan not found");
    if (plan.status !== "DRAFT") {
      throw new ConflictException("Only a draft quality plan can be published");
    }
    if (!plan._count.checkpoints) {
      throw new ConflictException("An empty quality plan cannot be published");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const project = await tx.project.updateMany({
          where: { id: projectId, tenantId },
          data: { activeQualityPlanId: planId },
        });
        if (project.count !== 1) throw new NotFoundException("Project not found");
        await tx.qualityPlan.updateMany({
          where: {
            tenantId,
            projectId,
            id: { not: planId },
            status: "PUBLISHED",
          },
          data: { status: "SUPERSEDED" },
        });
        const published = await tx.qualityPlan.updateMany({
          where: { id: planId, tenantId, projectId, status: "DRAFT" },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        if (published.count !== 1) {
          throw new ConflictException("Quality plan state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "QUALITY_PLAN_PUBLISHED", "QualityPlan", planId, {
          projectId,
          revision: plan.revision,
        });
        return tx.qualityPlan.findUniqueOrThrow({
          where: { id: planId },
          include: { _count: { select: { checkpoints: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async inspections(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.inspectionStatus(status);
    return this.prisma.qualityInspection.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      include: {
        checkpoint: { select: { code: true, title: true, holdPoint: true } },
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        inspectedBy: { select: { id: true, displayName: true } },
        reviewedBy: { select: { id: true, displayName: true } },
        _count: { select: { findings: true, evidence: true } },
      },
      take: 500,
    });
  }

  async scheduleInspection(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: ScheduleInspectionDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeQualityPlanId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeQualityPlanId) {
      throw new ConflictException("Publish a quality plan before scheduling inspections");
    }
    const checkpoint = await this.prisma.qualityCheckpoint.findFirst({
      where: {
        id: command.checkpointId,
        tenantId,
        qualityPlanId: project.activeQualityPlanId,
      },
    });
    if (!checkpoint) {
      throw new BadRequestException("Checkpoint must belong to the active quality plan");
    }
    if (checkpoint.wbsNodeId && checkpoint.wbsNodeId !== command.wbsNodeId) {
      throw new BadRequestException("Inspection WBS must match the checkpoint WBS");
    }
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    await this.requireProjectMember(projectId, command.inspectedById);
    if (command.bimElementId) {
      const element = await this.prisma.bimElement.findFirst({
        where: {
          id: command.bimElementId,
          tenantId,
          bimModel: { projectId },
        },
        select: { ifcType: true },
      });
      if (!element) throw new BadRequestException("BIM element does not belong to this project");
      if (checkpoint.ifcType && checkpoint.ifcType !== element.ifcType.toUpperCase()) {
        throw new BadRequestException("BIM element type does not match the checkpoint");
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const inspection = await tx.qualityInspection.create({
          data: {
            tenantId,
            projectId,
            checkpointId: command.checkpointId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            scheduledFor: new Date(command.scheduledFor),
            inspectedById: command.inspectedById,
          },
          include: {
            checkpoint: { select: { code: true, title: true, holdPoint: true } },
            wbsNode: { select: { code: true, name: true } },
          },
        });
        await this.audit(tx, tenantId, actorId, "QUALITY_INSPECTION_SCHEDULED", "QualityInspection", inspection.id, {
          projectId,
          externalId: inspection.externalId,
          checkpointId: inspection.checkpointId,
          inspectedById: inspection.inspectedById,
        });
        return inspection;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Inspection external ID already exists");
      }
      throw error;
    }
  }

  async submitInspection(
    tenantId: string,
    projectId: string,
    inspectionId: string,
    actorId: string,
    command: SubmitInspectionDto,
  ) {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id: inspectionId, tenantId, projectId },
    });
    if (!inspection) throw new NotFoundException("Inspection not found");
    if (inspection.inspectedById !== actorId) {
      throw new ForbiddenException("Only the assigned inspector may submit this inspection");
    }
    if (inspection.status !== "SCHEDULED") {
      throw new ConflictException("Only a scheduled inspection can be submitted");
    }
    const evidenceIds = this.unique(command.evidenceDocumentVersionIds ?? []);
    await this.requireEvidence(tenantId, projectId, evidenceIds);

    return this.prisma.$transaction(
      async (tx) => {
        const changed = await tx.qualityInspection.updateMany({
          where: { id: inspectionId, tenantId, projectId, status: "SCHEDULED" },
          data: {
            status: "SUBMITTED",
            result: command.result,
            notes: command.notes?.trim(),
            submittedAt: new Date(),
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Inspection state changed concurrently");
        }
        if (evidenceIds.length) {
          await tx.qualityEvidence.createMany({
            data: evidenceIds.map((documentVersionId) => ({
              tenantId,
              inspectionId,
              documentVersionId,
              addedById: actorId,
            })),
          });
        }
        await this.audit(tx, tenantId, actorId, "QUALITY_INSPECTION_SUBMITTED", "QualityInspection", inspectionId, {
          projectId,
          result: command.result,
          evidence: evidenceIds.length,
        });
        return tx.qualityInspection.findUniqueOrThrow({
          where: { id: inspectionId },
          include: { evidence: true, checkpoint: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reviewInspection(
    tenantId: string,
    projectId: string,
    inspectionId: string,
    actorId: string,
    command: ReviewInspectionDto,
  ) {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id: inspectionId, tenantId, projectId },
      include: { _count: { select: { findings: true } } },
    });
    if (!inspection) throw new NotFoundException("Inspection not found");
    if (inspection.inspectedById === actorId) {
      throw new ForbiddenException("Inspector and reviewer must be different users");
    }
    if (inspection.status !== "SUBMITTED") {
      throw new ConflictException("Only a submitted inspection can be reviewed");
    }
    if (
      command.accept &&
      (inspection.result === "FAIL" || inspection.result === "CONDITIONAL") &&
      !inspection._count.findings
    ) {
      throw new ConflictException("Failed or conditional work requires a linked finding");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const status = command.accept ? "ACCEPTED" : "REJECTED";
        const changed = await tx.qualityInspection.updateMany({
          where: { id: inspectionId, tenantId, projectId, status: "SUBMITTED" },
          data: {
            status,
            reviewedById: actorId,
            reviewedAt: new Date(),
            reviewComment: command.comment.trim(),
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Inspection state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "QUALITY_INSPECTION_REVIEWED", "QualityInspection", inspectionId, {
          projectId,
          status,
        });
        return tx.qualityInspection.findUniqueOrThrow({
          where: { id: inspectionId },
          include: { checkpoint: true, findings: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findings(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.findingStatus(status);
    return this.prisma.qualityFinding.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: {
        inspection: { select: { id: true, externalId: true, result: true } },
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        raisedBy: { select: { id: true, displayName: true } },
        closedBy: { select: { id: true, displayName: true } },
        actions: { orderBy: { dueAt: "asc" } },
        _count: { select: { evidence: true } },
      },
      take: 500,
    });
  }

  async createFinding(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateQualityFindingDto,
  ) {
    await this.requireProject(tenantId, projectId);
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    if (command.inspectionId) {
      const inspection = await this.prisma.qualityInspection.findFirst({
        where: { id: command.inspectionId, tenantId, projectId },
      });
      if (!inspection) throw new BadRequestException("Inspection does not belong to this project");
      if (inspection.wbsNodeId !== command.wbsNodeId) {
        throw new BadRequestException("Finding WBS must match its inspection");
      }
      if (
        inspection.bimElementId &&
        command.bimElementId &&
        inspection.bimElementId !== command.bimElementId
      ) {
        throw new BadRequestException("Finding BIM element must match its inspection");
      }
    }
    if (command.bimElementId) {
      const exists = await this.prisma.bimElement.count({
        where: { id: command.bimElementId, tenantId, bimModel: { projectId } },
      });
      if (!exists) throw new BadRequestException("BIM element does not belong to this project");
    }
    const evidenceIds = this.unique(command.evidenceDocumentVersionIds ?? []);
    await this.requireEvidence(tenantId, projectId, evidenceIds);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const finding = await tx.qualityFinding.create({
          data: {
            tenantId,
            projectId,
            inspectionId: command.inspectionId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            type: command.type,
            severity: command.severity,
            title: command.title.trim(),
            description: command.description.trim(),
            dueAt: command.dueAt ? new Date(command.dueAt) : undefined,
            raisedById: actorId,
          },
        });
        if (evidenceIds.length) {
          await tx.qualityEvidence.createMany({
            data: evidenceIds.map((documentVersionId) => ({
              tenantId,
              findingId: finding.id,
              documentVersionId,
              addedById: actorId,
            })),
          });
        }
        await this.audit(tx, tenantId, actorId, "QUALITY_FINDING_CREATED", "QualityFinding", finding.id, {
          projectId,
          externalId: finding.externalId,
          type: finding.type,
          severity: finding.severity,
        });
        return tx.qualityFinding.findUniqueOrThrow({
          where: { id: finding.id },
          include: { evidence: true, wbsNode: true, bimElement: true },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Finding external ID or evidence already exists");
      }
      throw error;
    }
  }

  async createAction(
    tenantId: string,
    projectId: string,
    findingId: string,
    actorId: string,
    command: CreateQualityActionDto,
  ) {
    const finding = await this.prisma.qualityFinding.findFirst({
      where: { id: findingId, tenantId, projectId },
    });
    if (!finding) throw new NotFoundException("Quality finding not found");
    if (finding.status === "CLOSED" || finding.status === "VOID") {
      throw new ConflictException("Closed or void findings cannot receive actions");
    }
    await this.requireProjectMember(projectId, command.assignedToId);

    return this.prisma.$transaction(async (tx) => {
      const action = await tx.qualityAction.create({
        data: {
          tenantId,
          findingId,
          description: command.description.trim(),
          assignedToId: command.assignedToId,
          dueAt: new Date(command.dueAt),
        },
      });
      await tx.qualityFinding.update({
        where: { id: findingId },
        data: { status: "ACTIONED" },
      });
      await this.audit(tx, tenantId, actorId, "QUALITY_ACTION_CREATED", "QualityAction", action.id, {
        projectId,
        findingId,
        assignedToId: action.assignedToId,
      });
      return action;
    });
  }

  async completeAction(
    tenantId: string,
    projectId: string,
    actionId: string,
    actorId: string,
    command: CompleteQualityActionDto,
  ) {
    const action = await this.prisma.qualityAction.findFirst({
      where: { id: actionId, tenantId, finding: { projectId } },
    });
    if (!action) throw new NotFoundException("Quality action not found");
    if (action.assignedToId !== actorId) {
      throw new ForbiddenException("Only the assigned user may complete this action");
    }
    if (action.status !== "OPEN") {
      throw new ConflictException("Only an open action can be completed");
    }
    const changed = await this.prisma.qualityAction.updateMany({
      where: { id: actionId, tenantId, status: "OPEN" },
      data: {
        status: "COMPLETED",
        completedById: actorId,
        completedAt: new Date(),
        completionNote: command.note.trim(),
      },
    });
    if (changed.count !== 1) throw new ConflictException("Action state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "QUALITY_ACTION_COMPLETED",
        entityType: "QualityAction",
        entityId: actionId,
        metadata: { projectId, findingId: action.findingId },
      },
    });
    return this.prisma.qualityAction.findUniqueOrThrow({ where: { id: actionId } });
  }

  async verifyAction(
    tenantId: string,
    projectId: string,
    actionId: string,
    actorId: string,
    command: VerifyQualityActionDto,
  ) {
    const action = await this.prisma.qualityAction.findFirst({
      where: { id: actionId, tenantId, finding: { projectId } },
    });
    if (!action) throw new NotFoundException("Quality action not found");
    if (action.status !== "COMPLETED") {
      throw new ConflictException("Only a completed action can be verified");
    }
    if (action.completedById === actorId) {
      throw new ForbiddenException("Action completer and verifier must be different users");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const changed = await tx.qualityAction.updateMany({
          where: { id: actionId, tenantId, status: "COMPLETED" },
          data: command.accept
            ? {
                status: "VERIFIED",
                verifiedById: actorId,
                verifiedAt: new Date(),
                verificationNote: command.note.trim(),
              }
            : {
                status: "OPEN",
                completedById: null,
                completedAt: null,
                completionNote: null,
                verifiedById: actorId,
                verifiedAt: new Date(),
                verificationNote: command.note.trim(),
              },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Action state changed concurrently");
        }
        if (command.accept) {
          const remaining = await tx.qualityAction.count({
            where: { findingId: action.findingId, status: { not: "VERIFIED" } },
          });
          if (!remaining) {
            await tx.qualityFinding.updateMany({
              where: {
                id: action.findingId,
                tenantId,
                status: { in: ["OPEN", "ACTIONED"] },
              },
              data: { status: "READY_FOR_VERIFICATION" },
            });
          }
        } else {
          await tx.qualityFinding.updateMany({
            where: { id: action.findingId, tenantId },
            data: { status: "ACTIONED" },
          });
        }
        await this.audit(tx, tenantId, actorId, "QUALITY_ACTION_VERIFIED", "QualityAction", actionId, {
          projectId,
          findingId: action.findingId,
          accepted: command.accept,
        });
        return tx.qualityAction.findUniqueOrThrow({ where: { id: actionId } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async closeFinding(
    tenantId: string,
    projectId: string,
    findingId: string,
    actorId: string,
    command: CloseQualityFindingDto,
  ) {
    const finding = await this.prisma.qualityFinding.findFirst({
      where: { id: findingId, tenantId, projectId },
      include: { actions: { select: { status: true } } },
    });
    if (!finding) throw new NotFoundException("Quality finding not found");
    if (finding.raisedById === actorId) {
      throw new ForbiddenException("Finding raiser and closer must be different users");
    }
    if (finding.type !== "OBSERVATION" && !finding.actions.length) {
      throw new ConflictException("NCR and punch findings require a corrective action");
    }
    if (finding.actions.some((action) => action.status !== "VERIFIED")) {
      throw new ConflictException("Every corrective action must be verified before closure");
    }
    if (
      finding.status !== "READY_FOR_VERIFICATION" &&
      !(finding.type === "OBSERVATION" && finding.status === "OPEN")
    ) {
      throw new ConflictException("Finding is not ready for closure");
    }

    const changed = await this.prisma.qualityFinding.updateMany({
      where: { id: findingId, tenantId, projectId, status: finding.status },
      data: {
        status: "CLOSED",
        closedById: actorId,
        closedAt: new Date(),
        closureNote: command.closureNote.trim(),
      },
    });
    if (changed.count !== 1) throw new ConflictException("Finding state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "QUALITY_FINDING_CLOSED",
        entityType: "QualityFinding",
        entityId: findingId,
        metadata: { projectId, externalId: finding.externalId },
      },
    });
    return this.prisma.qualityFinding.findUniqueOrThrow({
      where: { id: findingId },
      include: { actions: true, evidence: true },
    });
  }

  async dashboard(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    const now = new Date();
    const [
      inspections,
      openFindings,
      criticalOpen,
      majorOpen,
      overdueFindings,
      overdueActions,
      closedFindings,
    ] = await Promise.all([
      this.prisma.qualityInspection.groupBy({
        by: ["status"],
        where: { tenantId, projectId },
        _count: { _all: true },
      }),
      this.prisma.qualityFinding.count({
        where: { tenantId, projectId, status: { notIn: ["CLOSED", "VOID"] } },
      }),
      this.prisma.qualityFinding.count({
        where: {
          tenantId,
          projectId,
          severity: "CRITICAL",
          status: { notIn: ["CLOSED", "VOID"] },
        },
      }),
      this.prisma.qualityFinding.count({
        where: {
          tenantId,
          projectId,
          severity: "MAJOR",
          status: { notIn: ["CLOSED", "VOID"] },
        },
      }),
      this.prisma.qualityFinding.count({
        where: {
          tenantId,
          projectId,
          dueAt: { lt: now },
          status: { notIn: ["CLOSED", "VOID"] },
        },
      }),
      this.prisma.qualityAction.count({
        where: {
          tenantId,
          dueAt: { lt: now },
          status: { not: "VERIFIED" },
          finding: { projectId },
        },
      }),
      this.prisma.qualityFinding.count({
        where: { tenantId, projectId, status: "CLOSED" },
      }),
    ]);
    const inspectionCounts = Object.fromEntries(
      inspections.map((item) => [item.status, item._count._all]),
    );
    const accepted = inspectionCounts.ACCEPTED ?? 0;
    const rejected = inspectionCounts.REJECTED ?? 0;
    const reviewed = accepted + rejected;
    return {
      inspections: {
        scheduled: inspectionCounts.SCHEDULED ?? 0,
        submitted: inspectionCounts.SUBMITTED ?? 0,
        accepted,
        rejected,
        acceptanceRate: reviewed ? Math.round((accepted / reviewed) * 10000) / 100 : null,
      },
      findings: {
        open: openFindings,
        critical: criticalOpen,
        major: majorOpen,
        overdue: overdueFindings,
        closed: closedFindings,
      },
      actions: { overdue: overdueActions },
      generatedAt: now.toISOString(),
    };
  }

  async bimState(tenantId: string, bimModelId: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      select: {
        projectId: true,
        elements: {
          select: {
            id: true,
            globalId: true,
            wbsLinks: { select: { wbsNodeId: true } },
          },
        },
      },
    });
    if (!model) throw new NotFoundException("BIM model not found");
    const elementIds = model.elements.map((item) => item.id);
    const wbsIds = [
      ...new Set(model.elements.flatMap((item) => item.wbsLinks.map((link) => link.wbsNodeId))),
    ];
    const findings = await this.prisma.qualityFinding.findMany({
      where: {
        tenantId,
        projectId: model.projectId,
        status: { notIn: ["CLOSED", "VOID"] },
        OR: [
          { bimElementId: { in: elementIds } },
          { bimElementId: null, wbsNodeId: { in: wbsIds } },
        ],
      },
      select: {
        id: true,
        externalId: true,
        bimElementId: true,
        wbsNodeId: true,
        type: true,
        severity: true,
        status: true,
        title: true,
        dueAt: true,
      },
    });
    const direct = new Map<string, typeof findings>();
    const byWbs = new Map<string, typeof findings>();
    for (const finding of findings) {
      const map = finding.bimElementId ? direct : byWbs;
      const key = finding.bimElementId ?? finding.wbsNodeId;
      map.set(key, [...(map.get(key) ?? []), finding]);
    }
    const states = model.elements.map((element) => {
      const applicable =
        direct.get(element.id) ??
        element.wbsLinks.flatMap((link) => byWbs.get(link.wbsNodeId) ?? []);
      const severity = this.worstSeverity(applicable.map((item) => item.severity));
      return {
        globalId: element.globalId,
        qualityState: severity ?? "CLEAR",
        findings: applicable.map((item) => ({
          id: item.id,
          externalId: item.externalId,
          type: item.type,
          severity: item.severity,
          status: item.status,
          title: item.title,
          dueAt: item.dueAt,
        })),
      };
    });
    return {
      summary: {
        elements: states.length,
        clear: states.filter((item) => item.qualityState === "CLEAR").length,
        minor: states.filter((item) => item.qualityState === "MINOR").length,
        major: states.filter((item) => item.qualityState === "MAJOR").length,
        critical: states.filter((item) => item.qualityState === "CRITICAL").length,
        openFindings: findings.length,
      },
      elements: states,
    };
  }

  private inspectionStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(QualityInspectionStatus).includes(value as QualityInspectionStatus)) {
      throw new BadRequestException("Invalid inspection status");
    }
    return value as QualityInspectionStatus;
  }

  private findingStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(QualityFindingStatus).includes(value as QualityFindingStatus)) {
      throw new BadRequestException("Invalid finding status");
    }
    return value as QualityFindingStatus;
  }

  private worstSeverity(values: QualityFindingSeverity[]) {
    if (values.includes("CRITICAL")) return "CRITICAL" as const;
    if (values.includes("MAJOR")) return "MAJOR" as const;
    if (values.includes("MINOR")) return "MINOR" as const;
    return null;
  }

  private unique(values: string[]) {
    return [...new Set(values)];
  }

  private async requireEvidence(tenantId: string, projectId: string, ids: string[]) {
    if (!ids.length) return;
    const count = await this.prisma.documentVersion.count({
      where: { id: { in: ids }, tenantId, document: { projectId } },
    });
    if (count !== ids.length) {
      throw new BadRequestException("Every evidence document version must belong to this project");
    }
  }

  private async requireProjectMember(projectId: string, userId: string) {
    const count = await this.prisma.projectMember.count({
      where: { projectId, userId },
    });
    if (!count) throw new BadRequestException("User must be a project member");
  }

  private async requireWbs(tenantId: string, projectId: string, wbsNodeId: string) {
    const node = await this.prisma.wbsNode.findFirst({
      where: { id: wbsNodeId, tenantId, projectId },
    });
    if (!node) throw new BadRequestException("WBS node does not belong to this project");
    return node;
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private audit(
    tx: Prisma.TransactionClient,
    tenantId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    return tx.auditEvent.create({
      data: { tenantId, actorId, action, entityType, entityId, metadata },
    });
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }
}
