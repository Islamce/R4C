import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReviewProgressDto, SubmitProgressDto } from "./progress.dto";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async history(tenantId: string, wbsNodeId: string) {
    await this.requireWbs(tenantId, wbsNodeId);
    return this.prisma.wbsProgressUpdate.findMany({
      where: { tenantId, wbsNodeId },
      orderBy: { reportedAt: "desc" },
      include: {
        reportedBy: { select: { id: true, displayName: true } },
        reviewedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async submit(
    tenantId: string,
    actorId: string,
    wbsNodeId: string,
    command: SubmitProgressDto,
  ) {
    const wbs = await this.requireWbs(tenantId, wbsNodeId);
    return this.prisma.$transaction(async (tx) => {
      const update = await tx.wbsProgressUpdate.create({
        data: {
          tenantId,
          wbsNodeId,
          percent: command.percent,
          reportedById: actorId,
          ...(command.note ? { note: command.note.trim() } : {}),
        },
      });
      await tx.notificationOutbox.create({
        data: {
          tenantId,
          channel: "IN_APP",
          eventType: "WBS_PROGRESS_SUBMITTED",
          payload: { projectId: wbs.projectId, wbsNodeId, progressUpdateId: update.id },
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "WBS_PROGRESS_SUBMITTED",
          entityType: "WbsProgressUpdate",
          entityId: update.id,
          metadata: { wbsNodeId, percent: command.percent },
        },
      });
      return update;
    });
  }

  async review(
    tenantId: string,
    actorId: string,
    progressUpdateId: string,
    command: ReviewProgressDto,
  ) {
    const current = await this.prisma.wbsProgressUpdate.findFirst({
      where: { id: progressUpdateId, tenantId },
    });
    if (!current) throw new NotFoundException("Progress update not found");
    if (current.status !== "SUBMITTED") {
      throw new ConflictException("Only submitted progress may be reviewed");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wbsProgressUpdate.updateMany({
        where: { id: progressUpdateId, tenantId, status: "SUBMITTED" },
        data: {
          status: command.decision,
          reviewedById: actorId,
          reviewedAt: new Date(),
          ...(command.comment ? { reviewComment: command.comment.trim() } : {}),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException("Progress state changed concurrently");
      }
      await tx.notificationOutbox.create({
        data: {
          tenantId,
          channel: "IN_APP",
          eventType: `WBS_PROGRESS_${command.decision}`,
          recipientUserId: current.reportedById,
          payload: { progressUpdateId, wbsNodeId: current.wbsNodeId },
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: `WBS_PROGRESS_${command.decision}`,
          entityType: "WbsProgressUpdate",
          entityId: progressUpdateId,
        },
      });
      return tx.wbsProgressUpdate.findUniqueOrThrow({ where: { id: progressUpdateId } });
    });
  }

  private async requireWbs(tenantId: string, wbsNodeId: string) {
    const wbs = await this.prisma.wbsNode.findFirst({
      where: { id: wbsNodeId, tenantId },
    });
    if (!wbs) throw new NotFoundException("WBS node not found");
    return wbs;
  }
}
