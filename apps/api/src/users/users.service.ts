import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { hashPassword } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserAccessDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      orderBy: { user: { displayName: "asc" } },
      select: {
        user: { select: { id: true, email: true, displayName: true, isActive: true, createdAt: true } },
        role: { select: { code: true, name: true } },
      },
    });
  }

  roles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId, code: { in: ["ADMIN", "SALES_MANAGER", "SALES_AGENT", "VIEWER"] } },
      orderBy: { code: "asc" },
      select: {
        code: true,
        name: true,
        permissions: { select: { permission: { select: { code: true, name: true } } } },
      },
    });
  }

  async create(tenantId: string, actorId: string, command: CreateUserDto) {
    const email = command.email.trim().toLowerCase();
    const role = await this.requireRole(tenantId, command.roleCode);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("A user with this email already exists");
    const passwordHash = await hashPassword(command.temporaryPassword);
    const membership = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, displayName: command.displayName.trim(), passwordHash, isActive: true },
      });
      return tx.tenantMembership.create({
        data: { tenantId, userId: user.id, roleId: role.id },
        select: { user: { select: { id: true, email: true, displayName: true, isActive: true, createdAt: true } }, role: { select: { code: true, name: true } } },
      });
    });
    await this.audit.record({ tenantId, actorId, action: "USER_CREATED", entityType: "User", entityId: membership.user.id, metadata: { roleCode: role.code } });
    return membership;
  }

  async update(tenantId: string, actorId: string, userId: string, command: UpdateUserAccessDto) {
    if (actorId === userId && command.isActive === false) {
      throw new BadRequestException("Administrators cannot deactivate their own account");
    }
    const membership = await this.prisma.tenantMembership.findUnique({ where: { tenantId_userId: { tenantId, userId } }, include: { user: true, role: true } });
    if (!membership) throw new NotFoundException("User membership not found");
    if (
      membership.user.email.toLowerCase() === "islam@kynox.io" &&
      (command.isActive === false || (command.roleCode !== undefined && command.roleCode !== "ADMIN"))
    ) {
      throw new BadRequestException("The protected KYNOX administrator must remain active with the ADMIN role");
    }
    const role = command.roleCode ? await this.requireRole(tenantId, command.roleCode) : membership.role;
    if (membership.role.code === "ADMIN" && (command.roleCode && command.roleCode !== "ADMIN" || command.isActive === false)) {
      const activeAdmins = await this.prisma.tenantMembership.count({ where: { tenantId, role: { code: "ADMIN" }, user: { isActive: true } } });
      if (activeAdmins <= 1) throw new BadRequestException("The tenant must retain at least one active administrator");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      if (command.isActive !== undefined) await tx.user.update({ where: { id: userId }, data: { isActive: command.isActive } });
      await tx.tenantMembership.update({ where: { tenantId_userId: { tenantId, userId } }, data: { roleId: role.id } });
      return tx.tenantMembership.findUniqueOrThrow({ where: { tenantId_userId: { tenantId, userId } }, select: { user: { select: { id: true, email: true, displayName: true, isActive: true, createdAt: true } }, role: { select: { code: true, name: true } } } });
    });
    await this.audit.record({ tenantId, actorId, action: "USER_ACCESS_UPDATED", entityType: "User", entityId: userId, metadata: { roleCode: role.code, isActive: command.isActive ?? membership.user.isActive } });
    return updated;
  }

  private async requireRole(tenantId: string, code: string) {
    const role = await this.prisma.role.findUnique({ where: { tenantId_code: { tenantId, code } } });
    if (!role) throw new NotFoundException(`Role ${code} is not configured`);
    return role;
  }
}
