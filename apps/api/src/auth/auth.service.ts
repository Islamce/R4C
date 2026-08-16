import { createHash, randomBytes, randomUUID } from "node:crypto";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuditOutcome, Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { argon2Verify, argon2id } from "hash-wasm";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RefreshTokenDto, RequestPasswordResetDto, ResetPasswordDto } from "./auth.dto";
import { MailService } from "./mail.service";

const ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 14;
const MAX_REFRESH_TOKEN_TTL_DAYS = 365;
const REFRESH_TOKEN_SECRET_BYTES = 48;
const PASSWORD_HASH_SALT_BYTES = 16;
const PASSWORD_HASH_ITERATIONS = 3;
const PASSWORD_HASH_MEMORY_KIB = 65_536;
const PASSWORD_HASH_PARALLELISM = 4;
const PASSWORD_HASH_LENGTH_BYTES = 32;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function resetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type SessionMembership = Prisma.TenantMembershipGetPayload<{
  include: {
    tenant: true;
    role: { include: { permissions: { include: { permission: true } } } };
  };
}>;

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
};

type RefreshTokenRecord = Prisma.RefreshTokenGetPayload<{
  include: { user: true };
}>;

type RefreshTokenMaterial = {
  id: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

class ConcurrentRefreshReuseError extends Error {}

export async function hashPassword(password: string) {
  return argon2id({
    password,
    salt: randomBytes(PASSWORD_HASH_SALT_BYTES),
    parallelism: PASSWORD_HASH_PARALLELISM,
    iterations: PASSWORD_HASH_ITERATIONS,
    memorySize: PASSWORD_HASH_MEMORY_KIB,
    hashLength: PASSWORD_HASH_LENGTH_BYTES,
    outputType: "encoded",
  });
}

export async function verifyPassword(passwordHash: string, password: string) {
  return argon2Verify({ password, hash: passwordHash });
}

export function refreshTokenTtlDays(
  value = process.env.REFRESH_TOKEN_TTL_DAYS,
): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_REFRESH_TOKEN_TTL_DAYS;
  }

  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0 ||
    parsed > MAX_REFRESH_TOKEN_TTL_DAYS
  ) {
    throw new Error(
      `REFRESH_TOKEN_TTL_DAYS must be an integer between 1 and ${MAX_REFRESH_TOKEN_TTL_DAYS}`,
    );
  }
  return parsed;
}

function parseRefreshToken(token: string): { id: string; secret: string } {
  const separator = token.indexOf(".");
  const id = separator > 0 ? token.slice(0, separator) : "";
  const secret = separator > 0 ? token.slice(separator + 1) : "";

  if (!UUID_PATTERN.test(id) || secret.length < 48) {
    throw new UnauthorizedException("Invalid refresh token");
  }

  return { id, secret };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
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

    const membership = await this.requireMembership(user.id, command.tenantId);
    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(user, membership),
      this.createRefreshTokenMaterial(),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        id: refreshToken.id,
        userId: user.id,
        tenantId: membership.tenantId,
        tokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
      },
    });

    await this.audit.record({
      tenantId: membership.tenantId,
      actorId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { refreshTokenId: refreshToken.id },
    });

    return this.sessionResponse(user, membership, accessToken, refreshToken);
  }

  async refresh(command: RefreshTokenDto) {
    const { id, secret } = parseRefreshToken(command.refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!storedToken || storedToken.tenantId !== command.tenantId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const validSecret = await verifyPassword(storedToken.tokenHash, secret);
    if (!validSecret) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.revokedAt) {
      await this.handleRefreshTokenReuse(storedToken);
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    const now = new Date();
    if (storedToken.expiresAt.getTime() <= now.getTime()) {
      await this.prisma.refreshToken.updateMany({
        where: { id: storedToken.id, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit.record({
        tenantId: storedToken.tenantId,
        actorId: storedToken.userId,
        action: "AUTH_REFRESH_REJECTED",
        entityType: "RefreshToken",
        entityId: storedToken.id,
        outcome: AuditOutcome.DENIED,
        metadata: { reason: "EXPIRED" },
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException("User access is unavailable");
    }

    const membership = await this.requireMembership(
      storedToken.userId,
      storedToken.tenantId,
    );
    const [accessToken, nextRefreshToken] = await Promise.all([
      this.issueAccessToken(storedToken.user, membership),
      this.createRefreshTokenMaterial(),
    ]);

    try {
      await this.prisma.$transaction(async (transaction) => {
        const revoked = await transaction.refreshToken.updateMany({
          where: {
            id: storedToken.id,
            userId: storedToken.userId,
            tenantId: storedToken.tenantId,
            revokedAt: null,
          },
          data: { revokedAt: now },
        });

        if (revoked.count !== 1) {
          throw new ConcurrentRefreshReuseError();
        }

        await transaction.refreshToken.create({
          data: {
            id: nextRefreshToken.id,
            userId: storedToken.userId,
            tenantId: storedToken.tenantId,
            tokenHash: nextRefreshToken.tokenHash,
            expiresAt: nextRefreshToken.expiresAt,
          },
        });
      });
    } catch (error) {
      if (error instanceof ConcurrentRefreshReuseError) {
        await this.handleRefreshTokenReuse(storedToken);
        throw new UnauthorizedException("Refresh token reuse detected");
      }
      throw error;
    }

    await this.audit.record({
      tenantId: storedToken.tenantId,
      actorId: storedToken.userId,
      action: "AUTH_REFRESH_ROTATED",
      entityType: "RefreshToken",
      entityId: nextRefreshToken.id,
      metadata: { previousRefreshTokenId: storedToken.id },
    });

    return this.sessionResponse(
      storedToken.user,
      membership,
      accessToken,
      nextRefreshToken,
    );
  }

  async logout(command: RefreshTokenDto) {
    const { id, secret } = parseRefreshToken(command.refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!storedToken || storedToken.tenantId !== command.tenantId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const validSecret = await verifyPassword(storedToken.tokenHash, secret);
    if (!validSecret) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const revokedAt = storedToken.revokedAt ?? new Date();
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt },
    });

    await this.audit.record({
      tenantId: storedToken.tenantId,
      actorId: storedToken.userId,
      action: "AUTH_LOGOUT",
      entityType: "RefreshToken",
      entityId: storedToken.id,
      metadata: { alreadyRevoked: result.count === 0 },
    });

    return { revoked: true };
  }

  async requestPasswordReset(command: RequestPasswordResetDto) {
    const email = command.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { take: 1, orderBy: { tenantId: "asc" } } },
    });

    if (user?.isActive && user.memberships[0]) {
      const token = randomBytes(48).toString("base64url");
      const now = new Date();
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: now },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tenantId: user.memberships[0].tenantId,
            tokenHash: resetTokenHash(token),
            expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
          },
        }),
      ]);
      await this.mail.sendPasswordReset(email, token);
      await this.audit.record({
        tenantId: user.memberships[0].tenantId,
        actorId: user.id,
        action: "AUTH_PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
      });
    }

    return { accepted: true };
  }

  async resetPassword(command: ResetPasswordDto) {
    const tokenHash = resetTokenHash(command.token);
    const now = new Date();
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.consumedAt || record.expiresAt <= now || !record.user.isActive) {
      throw new BadRequestException("Reset link is invalid or expired");
    }

    const passwordHash = await hashPassword(command.password);
    const consumed = await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: { id: record.id, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) return false;
      await transaction.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await transaction.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return true;
    });
    if (!consumed) throw new BadRequestException("Reset link is invalid or expired");

    await this.audit.record({
      tenantId: record.tenantId,
      actorId: record.userId,
      action: "AUTH_PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: record.userId,
    });
    return { reset: true };
  }

  private async requireMembership(userId: string, tenantId: string) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: {
        tenant: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!membership || membership.tenant.status !== "ACTIVE") {
      throw new UnauthorizedException("Tenant access is unavailable");
    }

    return membership;
  }

  private issueAccessToken(user: SessionUser, membership: SessionMembership) {
    const permissions = membership.role.permissions.map(
      ({ permission }) => permission.code,
    );

    return this.jwt.signAsync({
      sub: user.id,
      tenantId: membership.tenantId,
      email: user.email,
      permissions,
    });
  }

  private async createRefreshTokenMaterial(): Promise<RefreshTokenMaterial> {
    const id = randomUUID();
    const secret = randomBytes(REFRESH_TOKEN_SECRET_BYTES).toString("base64url");
    const tokenHash = await hashPassword(secret);
    const expiresAt = new Date(
      Date.now() + refreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    return {
      id,
      token: `${id}.${secret}`,
      tokenHash,
      expiresAt,
    };
  }

  private sessionResponse(
    user: SessionUser,
    membership: SessionMembership,
    accessToken: string,
    refreshToken: RefreshTokenMaterial,
  ) {
    const permissions = membership.role.permissions.map(
      ({ permission }) => permission.code,
    );

    return {
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: refreshToken.token,
      refreshTokenExpiresInSeconds: Math.max(
        0,
        Math.floor((refreshToken.expiresAt.getTime() - Date.now()) / 1000),
      ),
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

  private async handleRefreshTokenReuse(storedToken: RefreshTokenRecord) {
    const now = new Date();
    const revoked = await this.prisma.refreshToken.updateMany({
      where: {
        userId: storedToken.userId,
        tenantId: storedToken.tenantId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    await this.audit.record({
      tenantId: storedToken.tenantId,
      actorId: storedToken.userId,
      action: "AUTH_REFRESH_REUSE_DETECTED",
      entityType: "RefreshToken",
      entityId: storedToken.id,
      outcome: AuditOutcome.DENIED,
      metadata: { revokedActiveTokens: revoked.count },
    });
  }
}
