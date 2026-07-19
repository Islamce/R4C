import { Injectable } from "@nestjs/common";
import { AuditOutcome, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditCommand {
  tenantId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  outcome?: AuditOutcome;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(command: AuditCommand) {
    return this.prisma.auditEvent.create({
      data: {
        tenantId: command.tenantId,
        action: command.action,
        entityType: command.entityType,
        outcome: command.outcome ?? AuditOutcome.SUCCESS,
        ...(command.actorId ? { actorId: command.actorId } : {}),
        ...(command.entityId ? { entityId: command.entityId } : {}),
        ...(command.metadata ? { metadata: command.metadata } : {}),
      },
    });
  }
}
