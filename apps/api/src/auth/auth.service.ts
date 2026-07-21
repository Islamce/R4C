import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./auth.dto";

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(passwordHash: string, password: string) {
  return argon2.verify(passwordHash, password);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(command: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: command.email.toLowerCase() },
    });
    const validPassword =
      user?.isActive && (await verifyPassword(user.passwordHash, command.password));

    if (!user || !validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: { tenantId: command.tenantId, userId: user.id },
      },
      include: {
        tenant: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!membership || membership.tenant.status !== "ACTIVE") {
      throw new UnauthorizedException("Tenant access is unavailable");
    }

    const permissions = membership.role.permissions.map(({ permission }) => permission.code);
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tenantId: membership.tenantId,
      email: user.email,
      permissions,
    });

    await this.audit.record({
      tenantId: membership.tenantId,
      actorId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds: 900,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        tenantId: membership.tenantId,
        role: membership.role.code,
        permissions,
      },
    };
  }
}
