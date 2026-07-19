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
        actorId: command.actorId,
        action: command.action,
        entityType: command.entityType,
        entityId: command.entityId,
        outcome: command.outcome ?? AuditOutcome.SUCCESS,
        metadata: command.metadata,
      },
    });
  }
}
