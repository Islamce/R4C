import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { WorkflowStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const allowedTransitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  DRAFT: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "RETURNED"],
  UNDER_REVIEW: ["APPROVED", "RETURNED"],
  RETURNED: ["IN_PROGRESS"],
  APPROVED: ["COMPLETED"],
  COMPLETED: [],
};

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(
    tenantId: string,
    actorId: string,
    workItemId: string,
    toStatus: WorkflowStatus,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.workItem.findFirst({ where: { id: workItemId, tenantId } });
      if (!current) throw new NotFoundException("Work item not found");

      if (!allowedTransitions[current.workflowStatus].includes(toStatus)) {
        throw new ConflictException(
          `Transition ${current.workflowStatus} → ${toStatus} is not allowed`,
        );
      }

      const updated = await tx.workItem.updateMany({
        where: { id: workItemId, tenantId, workflowStatus: current.workflowStatus },
        data: { workflowStatus: toStatus },
      });
      if (updated.count !== 1) {
        throw new ConflictException("Work item changed concurrently; reload and retry");
      }

      await tx.workflowTransition.create({
        data: {
          tenantId,
          actorId,
          workItemId,
          fromStatus: current.workflowStatus,
          toStatus,
          ...(reason ? { reason } : {}),
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "WORK_ITEM_TRANSITIONED",
          entityType: "WorkItem",
          entityId: workItemId,
          metadata: {
            from: current.workflowStatus,
            to: toStatus,
            ...(reason ? { reason } : {}),
          },
        },
      });

      return tx.workItem.findUniqueOrThrow({ where: { id: workItemId } });
    });
  }
}
