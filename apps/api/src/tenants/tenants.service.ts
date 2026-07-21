import { Injectable, NotFoundException } from "@nestjs/common";
import { TenantStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const TENANT_CODE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!TENANT_CODE.test(code)) throw new NotFoundException("Tenant not found");

    const tenant = await this.prisma.tenant.findFirst({
      where: { code, status: TenantStatus.ACTIVE },
      select: { id: true, code: true, name: true, status: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }
}
