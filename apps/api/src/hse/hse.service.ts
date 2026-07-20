import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  SafetyEventStatus,
  SafetyPermitStatus,
  SafetySeverity,
} from "@prisma/client";
import { actorsAreIndependent, safetyInvestigationRequired } from "../common/domain-policies";
import { PrismaService } from "../prisma/prisma.service";
import {
  CloseSafetyEventDto,
  CompleteSafetyActionDto,
  CreateSafetyActionDto,
  CreateSafetyEventDto,
  CreateSafetyPermitDto,
  EvidenceIdsDto,
  InvestigateSafetyEventDto,
  ReviewSafetyPermitDto,
  SafetyPermitNoteDto,
  VerifySafetyActionDto,
} from "./hse.dto";

@Injectable()
export class HseService {
  constructor(private readonly prisma: PrismaService) {}

  async permits(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.permitStatus(status);
    return this.prisma.safetyPermit.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: [{ validUntil: "desc" }, { createdAt: "desc" }],
      include: {
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        requestedBy: { select: { id: true, displayName: true } },
        reviewedBy: { select: { id: true, displayName: true } },
        activatedBy: { select: { id: true, displayName: true } },
        closedBy: { select: { id: true, displayName: true } },
        _count: { select: { evidence: true } },
      },
      take: 500,
    });
  }

  async createPermit(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateSafetyPermitDto,
  ) {
    await this.requireProject(tenantId, projectId);
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    await this.requireElement(tenantId, projectId, command.bimElementId);
    const validFrom = new Date(command.validFrom);
    const validUntil = new Date(command.validUntil);
    if (validUntil <= validFrom) {
      throw new BadRequestException("Permit validity end must be after its start");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const permit = await tx.safetyPermit.create({
          data: {
            tenantId,
            projectId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            type: command.type,
            title: command.title.trim(),
            description: command.description.trim(),
            riskAssessment: command.riskAssessment.trim(),
            controls: command.controls.trim(),
            validFrom,
            validUntil,
            requestedById: actorId,
          },
          include: { wbsNode: true, bimElement: true },
        });
        await this.audit(tx, tenantId, actorId, "SAFETY_PERMIT_CREATED", "SafetyPermit", permit.id, {
          projectId,
          externalId: permit.externalId,
          type: permit.type,
        });
        return permit;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Permit external ID already exists");
      }
      throw error;
    }
  }

  async submitPermit(
    tenantId: string,
    projectId: string,
    permitId: string,
    actorId: string,
    command: EvidenceIdsDto,
  ) {
    const permit = await this.requirePermit(tenantId, projectId, permitId);
    if (permit.requestedById !== actorId) {
      throw new ForbiddenException("Only the permit requester may submit it");
    }
    if (permit.status !== "DRAFT") {
      throw new ConflictException("Only a draft permit can be submitted");
    }
    const evidenceIds = this.unique(command.evidenceDocumentVersionIds ?? []);
    await this.requireEvidence(tenantId, projectId, evidenceIds);

    return this.prisma.$transaction(
      async (tx) => {
        const changed = await tx.safetyPermit.updateMany({
          where: { id: permitId, tenantId, projectId, status: "DRAFT" },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Permit state changed concurrently");
        }
        if (evidenceIds.length) {
          await tx.safetyEvidence.createMany({
            data: evidenceIds.map((documentVersionId) => ({
              tenantId,
              safetyPermitId: permitId,
              documentVersionId,
              addedById: actorId,
            })),
          });
        }
        await this.audit(tx, tenantId, actorId, "SAFETY_PERMIT_SUBMITTED", "SafetyPermit", permitId, {
          projectId,
          evidence: evidenceIds.length,
        });
        return tx.safetyPermit.findUniqueOrThrow({
          where: { id: permitId },
          include: { evidence: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reviewPermit(
    tenantId: string,
    projectId: string,
    permitId: string,
    actorId: string,
    command: ReviewSafetyPermitDto,
  ) {
    const permit = await this.requirePermit(tenantId, projectId, permitId);
    if (!actorsAreIndependent(permit.requestedById, actorId)) {
      throw new ForbiddenException("Permit requester and reviewer must be different users");
    }
    if (permit.status !== "SUBMITTED") {
      throw new ConflictException("Only a submitted permit can be reviewed");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const status = command.approve ? "APPROVED" : "DRAFT";
        const changed = await tx.safetyPermit.updateMany({
          where: { id: permitId, tenantId, projectId, status: "SUBMITTED" },
          data: {
            status,
            reviewedById: actorId,
            reviewedAt: new Date(),
            reviewComment: command.comment.trim(),
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Permit state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "SAFETY_PERMIT_REVIEWED", "SafetyPermit", permitId, {
          projectId,
          approved: command.approve,
        });
        return tx.safetyPermit.findUniqueOrThrow({ where: { id: permitId } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async activatePermit(
    tenantId: string,
    projectId: string,
    permitId: string,
    actorId: string,
  ) {
    const permit = await this.requirePermit(tenantId, projectId, permitId);
    if (permit.status !== "APPROVED" && permit.status !== "SUSPENDED") {
      throw new ConflictException("Only an approved or suspended permit can be activated");
    }
    const now = new Date();
    if (now < permit.validFrom || now > permit.validUntil) {
      throw new ConflictException("Permit is outside its approved validity window");
    }
    const changed = await this.prisma.safetyPermit.updateMany({
      where: {
        id: permitId,
        tenantId,
        projectId,
        status: permit.status,
      },
      data: {
        status: "ACTIVE",
        activatedById: actorId,
        activatedAt: now,
        suspendedAt: null,
      },
    });
    if (changed.count !== 1) throw new ConflictException("Permit state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "SAFETY_PERMIT_ACTIVATED",
        entityType: "SafetyPermit",
        entityId: permitId,
        metadata: { projectId, externalId: permit.externalId },
      },
    });
    return this.prisma.safetyPermit.findUniqueOrThrow({ where: { id: permitId } });
  }

  async suspendPermit(
    tenantId: string,
    projectId: string,
    permitId: string,
    actorId: string,
    command: SafetyPermitNoteDto,
  ) {
    const permit = await this.requirePermit(tenantId, projectId, permitId);
    if (permit.status !== "ACTIVE") {
      throw new ConflictException("Only an active permit can be suspended");
    }
    const changed = await this.prisma.safetyPermit.updateMany({
      where: { id: permitId, tenantId, projectId, status: "ACTIVE" },
      data: { status: "SUSPENDED", suspendedAt: new Date() },
    });
    if (changed.count !== 1) throw new ConflictException("Permit state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "SAFETY_PERMIT_SUSPENDED",
        entityType: "SafetyPermit",
        entityId: permitId,
        metadata: { projectId, note: command.note.trim() },
      },
    });
    return this.prisma.safetyPermit.findUniqueOrThrow({ where: { id: permitId } });
  }

  async closePermit(
    tenantId: string,
    projectId: string,
    permitId: string,
    actorId: string,
    command: SafetyPermitNoteDto,
  ) {
    const permit = await this.requirePermit(tenantId, projectId, permitId);
    if (permit.status !== "ACTIVE" && permit.status !== "SUSPENDED") {
      throw new ConflictException("Only an active or suspended permit can be closed");
    }
    if (!actorsAreIndependent(permit.requestedById, actorId)) {
      throw new ForbiddenException("Permit requester and closer must be different users");
    }
    const changed = await this.prisma.safetyPermit.updateMany({
      where: { id: permitId, tenantId, projectId, status: permit.status },
      data: {
        status: "CLOSED",
        closedById: actorId,
        closedAt: new Date(),
        closeNote: command.note.trim(),
      },
    });
    if (changed.count !== 1) throw new ConflictException("Permit state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "SAFETY_PERMIT_CLOSED",
        entityType: "SafetyPermit",
        entityId: permitId,
        metadata: { projectId, externalId: permit.externalId },
      },
    });
    return this.prisma.safetyPermit.findUniqueOrThrow({ where: { id: permitId } });
  }

  async events(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.eventStatus(status);
    return this.prisma.safetyEvent.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      include: {
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        reportedBy: { select: { id: true, displayName: true } },
        investigatedBy: { select: { id: true, displayName: true } },
        closedBy: { select: { id: true, displayName: true } },
        actions: { orderBy: { dueAt: "asc" } },
        _count: { select: { evidence: true } },
      },
      take: 500,
    });
  }

  async reportEvent(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateSafetyEventDto,
  ) {
    await this.requireProject(tenantId, projectId);
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    await this.requireElement(tenantId, projectId, command.bimElementId);
    const evidenceIds = this.unique(command.evidenceDocumentVersionIds ?? []);
    if (command.severity === "CRITICAL" && !evidenceIds.length) {
      throw new BadRequestException("Critical safety events require document evidence");
    }
    await this.requireEvidence(tenantId, projectId, evidenceIds);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.safetyEvent.create({
          data: {
            tenantId,
            projectId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            type: command.type,
            severity: command.severity,
            title: command.title.trim(),
            description: command.description.trim(),
            occurredAt: new Date(command.occurredAt),
            dueAt: command.dueAt ? new Date(command.dueAt) : undefined,
            reportedById: actorId,
          },
        });
        if (evidenceIds.length) {
          await tx.safetyEvidence.createMany({
            data: evidenceIds.map((documentVersionId) => ({
              tenantId,
              safetyEventId: event.id,
              documentVersionId,
              addedById: actorId,
            })),
          });
        }
        await this.audit(tx, tenantId, actorId, "SAFETY_EVENT_REPORTED", "SafetyEvent", event.id, {
          projectId,
          externalId: event.externalId,
          type: event.type,
          severity: event.severity,
          evidence: evidenceIds.length,
        });
        return tx.safetyEvent.findUniqueOrThrow({
          where: { id: event.id },
          include: { evidence: true, wbsNode: true, bimElement: true },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Safety event external ID or evidence already exists");
      }
      throw error;
    }
  }

  async investigateEvent(
    tenantId: string,
    projectId: string,
    eventId: string,
    actorId: string,
    command: InvestigateSafetyEventDto,
  ) {
    const event = await this.requireEvent(tenantId, projectId, eventId);
    if (!actorsAreIndependent(event.reportedById, actorId)) {
      throw new ForbiddenException("Event reporter and investigator must be different users");
    }
    if (event.status !== "OPEN" && event.status !== "UNDER_INVESTIGATION") {
      throw new ConflictException("Event cannot be investigated in its current state");
    }
    const changed = await this.prisma.safetyEvent.updateMany({
      where: { id: eventId, tenantId, projectId, status: event.status },
      data: {
        status: "UNDER_INVESTIGATION",
        investigatedById: actorId,
        investigationAt: new Date(),
        rootCause: command.rootCause.trim(),
        immediateActions: command.immediateActions.trim(),
      },
    });
    if (changed.count !== 1) throw new ConflictException("Event state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "SAFETY_EVENT_INVESTIGATED",
        entityType: "SafetyEvent",
        entityId: eventId,
        metadata: { projectId, externalId: event.externalId },
      },
    });
    return this.prisma.safetyEvent.findUniqueOrThrow({ where: { id: eventId } });
  }

  async createAction(
    tenantId: string,
    projectId: string,
    eventId: string,
    actorId: string,
    command: CreateSafetyActionDto,
  ) {
    const event = await this.requireEvent(tenantId, projectId, eventId);
    if (event.status === "CLOSED" || event.status === "VOID") {
      throw new ConflictException("Closed or void events cannot receive actions");
    }
    await this.requireProjectMember(projectId, command.assignedToId);
    return this.prisma.$transaction(async (tx) => {
      const action = await tx.safetyAction.create({
        data: {
          tenantId,
          safetyEventId: eventId,
          description: command.description.trim(),
          assignedToId: command.assignedToId,
          dueAt: new Date(command.dueAt),
        },
      });
      await tx.safetyEvent.update({
        where: { id: eventId },
        data: { status: "ACTIONED" },
      });
      await this.audit(tx, tenantId, actorId, "SAFETY_ACTION_CREATED", "SafetyAction", action.id, {
        projectId,
        eventId,
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
    command: CompleteSafetyActionDto,
  ) {
    const action = await this.prisma.safetyAction.findFirst({
      where: { id: actionId, tenantId, safetyEvent: { projectId } },
    });
    if (!action) throw new NotFoundException("Safety action not found");
    if (action.assignedToId !== actorId) {
      throw new ForbiddenException("Only the assigned user may complete this action");
    }
    if (action.status !== "OPEN") {
      throw new ConflictException("Only an open action can be completed");
    }
    const changed = await this.prisma.safetyAction.updateMany({
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
        action: "SAFETY_ACTION_COMPLETED",
        entityType: "SafetyAction",
        entityId: actionId,
        metadata: { projectId, eventId: action.safetyEventId },
      },
    });
    return this.prisma.safetyAction.findUniqueOrThrow({ where: { id: actionId } });
  }

  async verifyAction(
    tenantId: string,
    projectId: string,
    actionId: string,
    actorId: string,
    command: VerifySafetyActionDto,
  ) {
    const action = await this.prisma.safetyAction.findFirst({
      where: { id: actionId, tenantId, safetyEvent: { projectId } },
    });
    if (!action) throw new NotFoundException("Safety action not found");
    if (action.status !== "COMPLETED") {
      throw new ConflictException("Only a completed action can be verified");
    }
    if (!actorsAreIndependent(action.completedById!, actorId)) {
      throw new ForbiddenException("Action completer and verifier must be different users");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const changed = await tx.safetyAction.updateMany({
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
        if (changed.count !== 1) throw new ConflictException("Action state changed concurrently");
        if (command.accept) {
          const remaining = await tx.safetyAction.count({
            where: { safetyEventId: action.safetyEventId, status: { not: "VERIFIED" } },
          });
          if (!remaining) {
            await tx.safetyEvent.updateMany({
              where: {
                id: action.safetyEventId,
                tenantId,
                status: { in: ["OPEN", "UNDER_INVESTIGATION", "ACTIONED"] },
              },
              data: { status: "READY_FOR_CLOSURE" },
            });
          }
        } else {
          await tx.safetyEvent.updateMany({
            where: { id: action.safetyEventId, tenantId },
            data: { status: "ACTIONED" },
          });
        }
        await this.audit(tx, tenantId, actorId, "SAFETY_ACTION_VERIFIED", "SafetyAction", actionId, {
          projectId,
          eventId: action.safetyEventId,
          accepted: command.accept,
        });
        return tx.safetyAction.findUniqueOrThrow({ where: { id: actionId } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async closeEvent(
    tenantId: string,
    projectId: string,
    eventId: string,
    actorId: string,
    command: CloseSafetyEventDto,
  ) {
    const event = await this.prisma.safetyEvent.findFirst({
      where: { id: eventId, tenantId, projectId },
      include: { actions: { select: { status: true } } },
    });
    if (!event) throw new NotFoundException("Safety event not found");
    if (!actorsAreIndependent(event.reportedById, actorId)) {
      throw new ForbiddenException("Event reporter and closer must be different users");
    }
    const investigationRequired = safetyInvestigationRequired(
      event.type,
      event.severity,
    );
    if (investigationRequired && !event.rootCause) {
      throw new ConflictException("This event requires a completed investigation");
    }
    if (investigationRequired && !event.actions.length) {
      throw new ConflictException("This event requires at least one corrective action");
    }
    if (event.actions.some((action) => action.status !== "VERIFIED")) {
      throw new ConflictException("Every corrective action must be verified before closure");
    }
    const directClosure =
      !investigationRequired &&
      !event.actions.length &&
      (event.status === "OPEN" || event.status === "UNDER_INVESTIGATION");
    if (event.status !== "READY_FOR_CLOSURE" && !directClosure) {
      throw new ConflictException("Safety event is not ready for closure");
    }

    const changed = await this.prisma.safetyEvent.updateMany({
      where: { id: eventId, tenantId, projectId, status: event.status },
      data: {
        status: "CLOSED",
        closedById: actorId,
        closedAt: new Date(),
        closureNote: command.closureNote.trim(),
      },
    });
    if (changed.count !== 1) throw new ConflictException("Event state changed concurrently");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "SAFETY_EVENT_CLOSED",
        entityType: "SafetyEvent",
        entityId: eventId,
        metadata: { projectId, externalId: event.externalId },
      },
    });
    return this.prisma.safetyEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: { actions: true, evidence: true },
    });
  }

  async dashboard(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    const now = new Date();
    const [permits, events, criticalOpen, highOpen, overdueEvents, overdueActions] =
      await Promise.all([
        this.prisma.safetyPermit.groupBy({
          by: ["status"],
          where: { tenantId, projectId },
          _count: { _all: true },
        }),
        this.prisma.safetyEvent.groupBy({
          by: ["status"],
          where: { tenantId, projectId },
          _count: { _all: true },
        }),
        this.prisma.safetyEvent.count({
          where: {
            tenantId,
            projectId,
            severity: "CRITICAL",
            status: { notIn: ["CLOSED", "VOID"] },
          },
        }),
        this.prisma.safetyEvent.count({
          where: {
            tenantId,
            projectId,
            severity: "HIGH",
            status: { notIn: ["CLOSED", "VOID"] },
          },
        }),
        this.prisma.safetyEvent.count({
          where: {
            tenantId,
            projectId,
            dueAt: { lt: now },
            status: { notIn: ["CLOSED", "VOID"] },
          },
        }),
        this.prisma.safetyAction.count({
          where: {
            tenantId,
            dueAt: { lt: now },
            status: { not: "VERIFIED" },
            safetyEvent: { projectId },
          },
        }),
      ]);
    const permitCounts = Object.fromEntries(
      permits.map((item) => [item.status, item._count._all]),
    );
    const eventCounts = Object.fromEntries(
      events.map((item) => [item.status, item._count._all]),
    );
    return {
      permits: {
        submitted: permitCounts.SUBMITTED ?? 0,
        approved: permitCounts.APPROVED ?? 0,
        active: permitCounts.ACTIVE ?? 0,
        suspended: permitCounts.SUSPENDED ?? 0,
        closed: permitCounts.CLOSED ?? 0,
      },
      events: {
        open:
          (eventCounts.OPEN ?? 0) +
          (eventCounts.UNDER_INVESTIGATION ?? 0) +
          (eventCounts.ACTIONED ?? 0) +
          (eventCounts.READY_FOR_CLOSURE ?? 0),
        critical: criticalOpen,
        high: highOpen,
        overdue: overdueEvents,
        closed: eventCounts.CLOSED ?? 0,
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
    const [events, permits] = await Promise.all([
      this.prisma.safetyEvent.findMany({
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
        },
      }),
      this.prisma.safetyPermit.findMany({
        where: {
          tenantId,
          projectId: model.projectId,
          status: { in: ["ACTIVE", "SUSPENDED"] },
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
          status: true,
          validUntil: true,
        },
      }),
    ]);
    const directEvents = new Map<string, typeof events>();
    const wbsEvents = new Map<string, typeof events>();
    for (const event of events) {
      const map = event.bimElementId ? directEvents : wbsEvents;
      const key = event.bimElementId ?? event.wbsNodeId;
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    const directPermits = new Map<string, typeof permits>();
    const wbsPermits = new Map<string, typeof permits>();
    for (const permit of permits) {
      const map = permit.bimElementId ? directPermits : wbsPermits;
      const key = permit.bimElementId ?? permit.wbsNodeId;
      map.set(key, [...(map.get(key) ?? []), permit]);
    }
    const states = model.elements.map((element) => {
      const applicableEvents =
        directEvents.get(element.id) ??
        element.wbsLinks.flatMap((link) => wbsEvents.get(link.wbsNodeId) ?? []);
      const applicablePermits =
        directPermits.get(element.id) ??
        element.wbsLinks.flatMap((link) => wbsPermits.get(link.wbsNodeId) ?? []);
      const severity = this.worstSeverity(applicableEvents.map((item) => item.severity));
      return {
        globalId: element.globalId,
        safetyState: severity ?? (applicablePermits.length ? "CONTROLLED" : "CLEAR"),
        events: applicableEvents.map((item) => ({
          id: item.id,
          externalId: item.externalId,
          type: item.type,
          severity: item.severity,
          status: item.status,
          title: item.title,
        })),
        permits: applicablePermits.map((item) => ({
          id: item.id,
          externalId: item.externalId,
          type: item.type,
          status: item.status,
          validUntil: item.validUntil,
        })),
      };
    });
    return {
      summary: {
        elements: states.length,
        clear: states.filter((item) => item.safetyState === "CLEAR").length,
        controlled: states.filter((item) => item.safetyState === "CONTROLLED").length,
        low: states.filter((item) => item.safetyState === "LOW").length,
        medium: states.filter((item) => item.safetyState === "MEDIUM").length,
        high: states.filter((item) => item.safetyState === "HIGH").length,
        critical: states.filter((item) => item.safetyState === "CRITICAL").length,
        openEvents: events.length,
        activePermits: permits.filter((item) => item.status === "ACTIVE").length,
      },
      elements: states,
    };
  }

  private permitStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(SafetyPermitStatus).includes(value as SafetyPermitStatus)) {
      throw new BadRequestException("Invalid safety permit status");
    }
    return value as SafetyPermitStatus;
  }

  private eventStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(SafetyEventStatus).includes(value as SafetyEventStatus)) {
      throw new BadRequestException("Invalid safety event status");
    }
    return value as SafetyEventStatus;
  }

  private worstSeverity(values: SafetySeverity[]) {
    if (values.includes("CRITICAL")) return "CRITICAL" as const;
    if (values.includes("HIGH")) return "HIGH" as const;
    if (values.includes("MEDIUM")) return "MEDIUM" as const;
    if (values.includes("LOW")) return "LOW" as const;
    return null;
  }

  private unique(values: string[]) {
    return [...new Set(values)];
  }

  private async requirePermit(tenantId: string, projectId: string, permitId: string) {
    const permit = await this.prisma.safetyPermit.findFirst({
      where: { id: permitId, tenantId, projectId },
    });
    if (!permit) throw new NotFoundException("Safety permit not found");
    return permit;
  }

  private async requireEvent(tenantId: string, projectId: string, eventId: string) {
    const event = await this.prisma.safetyEvent.findFirst({
      where: { id: eventId, tenantId, projectId },
    });
    if (!event) throw new NotFoundException("Safety event not found");
    return event;
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

  private async requireElement(tenantId: string, projectId: string, elementId?: string) {
    if (!elementId) return;
    const count = await this.prisma.bimElement.count({
      where: { id: elementId, tenantId, bimModel: { projectId } },
    });
    if (!count) throw new BadRequestException("BIM element does not belong to this project");
  }

  private async requireProjectMember(projectId: string, userId: string) {
    const count = await this.prisma.projectMember.count({ where: { projectId, userId } });
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
