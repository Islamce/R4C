import { createHmac, randomInt } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { Prisma, TenantStatus, UnitStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RequestPhoneVerificationDto, SubmitPublicInterestDto, VerifyPhoneDto } from "./commercial.dto";

const CODE_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class PublicCommercialService {
  constructor(private readonly prisma: PrismaService) {}

  async portfolio(rawTenantCode: string) {
    const tenant = await this.tenant(rawTenantCode);
    const projects = await this.prisma.project.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE", units: { some: { status: UnitStatus.AVAILABLE } } },
      select: {
        id: true, code: true, name: true, description: true, targetDate: true,
        _count: { select: { units: { where: { status: UnitStatus.AVAILABLE } } } },
        units: {
          where: { status: UnitStatus.AVAILABLE },
          orderBy: [{ building: { code: "asc" } }, { floor: { floorNumber: "asc" } }, { number: "asc" }],
          select: { id: true, code: true, number: true, grossArea: true, netArea: true, bedrooms: true, bathrooms: true, orientation: true, view: true, building: { select: { name: true } }, floor: { select: { name: true, floorNumber: true } }, unitType: { select: { name: true } }, priceRevisions: { where: { status: "PUBLISHED" }, orderBy: { revision: "desc" }, take: 1, select: { listPriceMinor: true, currency: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
    return { tenant: { code: tenant.code, name: tenant.name }, projects: projects.map((project) => ({ ...project, units: project.units.map((unit) => ({ ...unit, grossArea: unit.grossArea.toString(), netArea: unit.netArea?.toString() ?? null, price: unit.priceRevisions[0] ? { amountMinor: unit.priceRevisions[0].listPriceMinor.toString(), currency: unit.priceRevisions[0].currency } : null, priceRevisions: undefined })) })) };
  }

  async requestPhoneVerification(command: RequestPhoneVerificationDto) {
    const tenant = await this.tenant(command.tenantCode);
    const phone = this.normalizeSaudiPhone(command.phone);
    const recent = await this.prisma.phoneVerification.count({ where: { tenantId: tenant.id, phoneNormalized: phone, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } } });
    if (recent >= 3) throw new ConflictException("Too many verification requests. Try again later");
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const record = await this.prisma.phoneVerification.create({ data: { tenantId: tenant.id, phoneNormalized: phone, codeHash: this.hash(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
    await this.sendSms(phone, `رمز التحقق من R4C هو ${code}. صالح لمدة 5 دقائق.`);
    return { verificationId: record.id, expiresInSeconds: CODE_TTL_MS / 1000, ...(process.env.NODE_ENV === "production" ? {} : { uatCode: code }) };
  }

  async verifyPhone(command: VerifyPhoneDto) {
    const tenant = await this.tenant(command.tenantCode);
    const record = await this.prisma.phoneVerification.findFirst({ where: { id: command.verificationId, tenantId: tenant.id } });
    if (!record || record.consumedAt || record.expiresAt <= new Date()) throw new UnauthorizedException("Verification code is invalid or expired");
    if (record.attempts >= MAX_ATTEMPTS) throw new UnauthorizedException("Verification attempts exceeded");
    if (record.codeHash !== this.hash(command.code)) {
      await this.prisma.phoneVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException("Verification code is invalid or expired");
    }
    await this.prisma.phoneVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return { verified: true, phone: record.phoneNormalized };
  }

  async submitInterest(command: SubmitPublicInterestDto) {
    if (!command.enquiryConsentGranted) throw new BadRequestException("Enquiry contact consent is required");
    const tenant = await this.tenant(command.tenantCode);
    const phone = this.normalizeSaudiPhone(command.phone);
    const email = command.email.trim().toLowerCase();
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.phoneVerification.findFirst({ where: { id: command.verificationId, tenantId: tenant.id, phoneNormalized: phone, verifiedAt: { not: null }, consumedAt: null, expiresAt: { gt: new Date() } } });
      if (!verification) throw new UnauthorizedException("A verified mobile number is required");
      const project = await tx.project.findFirst({ where: { id: command.projectId, tenantId: tenant.id, status: "ACTIVE" } });
      if (!project) throw new NotFoundException("Project not found");
      const unit = command.unitId ? await tx.unit.findFirst({ where: { id: command.unitId, projectId: project.id, tenantId: tenant.id, status: UnitStatus.AVAILABLE } }) : null;
      if (command.unitId && !unit) throw new NotFoundException("Available unit not found");
      const membership = await tx.tenantMembership.findFirst({ where: { tenantId: tenant.id, user: { isActive: true }, role: { permissions: { some: { permission: { code: "commercial:lead:view-own" } } } } }, orderBy: { userId: "asc" } });
      if (!membership) throw new ServiceUnavailableException("No sales representative is available");
      let customer = await tx.customer.findFirst({ where: { tenantId: tenant.id, phoneNormalized: phone, emailNormalized: email } });
      customer ??= await tx.customer.create({ data: { tenantId: tenant.id, firstName: command.firstName.trim(), lastName: command.lastName?.trim() || null, phone, phoneNormalized: phone, email, emailNormalized: email } });
      const now = new Date();
      const lead = await tx.lead.create({ data: { tenantId: tenant.id, customerId: customer.id, projectId: project.id, unitId: unit?.id, assignedToId: membership.userId, source: "Customer portal", isExternalEnquiry: true, enquiryConsentGranted: true, enquiryConsentAt: now, enquiryConsentChannel: "customer-portal", enquiryConsentPurpose: "Respond to property enquiry", marketingConsentGranted: command.marketingConsentGranted ?? false, ...(command.marketingConsentGranted ? { marketingConsentAt: now, marketingConsentChannel: "customer-portal", marketingConsentPurpose: "Property marketing updates" } : {}) } });
      await tx.phoneVerification.update({ where: { id: verification.id }, data: { consumedAt: now } });
      await tx.auditEvent.create({ data: { tenantId: tenant.id, actorId: null, action: "PUBLIC_INTEREST_REGISTERED", entityType: "Lead", entityId: lead.id, metadata: { projectId: project.id, unitId: unit?.id ?? null, phoneVerified: true } } });
      return { reference: lead.id, status: lead.status, message: "Interest registered successfully" };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async tenant(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) throw new NotFoundException("Tenant not found");
    const tenant = await this.prisma.tenant.findFirst({ where: { code, status: TenantStatus.ACTIVE }, select: { id: true, code: true, name: true } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  private normalizeSaudiPhone(value: string) {
    const compact = value.trim().replace(/[\s()-]/g, "");
    const local = compact.startsWith("+966") ? compact.slice(4) : compact.startsWith("00966") ? compact.slice(5) : compact.startsWith("966") ? compact.slice(3) : compact.startsWith("0") ? compact.slice(1) : compact;
    if (!/^5\d{8}$/.test(local)) throw new BadRequestException("Phone must be a Saudi mobile number");
    return `+966${local}`;
  }

  private hash(code: string) {
    const pepper = process.env.PHONE_VERIFICATION_PEPPER ?? (process.env.NODE_ENV === "production" ? "" : "r4c-local-uat-pepper");
    if (!pepper) throw new ServiceUnavailableException("Phone verification is not configured");
    return createHmac("sha256", pepper).update(code).digest("hex");
  }

  private async sendSms(phone: string, message: string) {
    if (process.env.NODE_ENV !== "production" && !process.env.SMS_API_URL) return;
    const url = process.env.SMS_API_URL;
    const token = process.env.SMS_API_TOKEN;
    const sender = process.env.SMS_SENDER_ID;
    if (!url || !token || !sender) throw new ServiceUnavailableException("SMS delivery is not configured");
    const response = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ to: phone, from: sender, message }) });
    if (!response.ok) throw new ServiceUnavailableException("SMS delivery failed");
  }
}
