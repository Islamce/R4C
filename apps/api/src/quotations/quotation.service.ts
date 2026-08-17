import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CustomerDecisionType, SalesQuotationStatus, UnitPriceRevisionStatus, UnitStatus } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { AuthContext } from "../common/auth-context";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSalesQuotationDto,
  RecordCustomerDecisionDto,
  ReturnSalesQuotationDto,
  UpdateSalesQuotationDto,
} from "./quotation.dto";

const GENERIC_TOKEN_ERROR = "Quotation link is unavailable";
const TOKEN_PURPOSE = "SYNTHETIC_QUOTATION_PREVIEW";
const QUOTATION_NUMBER_PREFIX = "SQ";
const CUSTOMER_VISIBLE_STATUSES: SalesQuotationStatus[] = [
  SalesQuotationStatus.APPROVED_TO_SEND,
  SalesQuotationStatus.SENT,
  SalesQuotationStatus.VIEWED,
];
const SUPERSEDABLE_STATUSES: SalesQuotationStatus[] = [
  SalesQuotationStatus.APPROVED_TO_SEND,
  SalesQuotationStatus.SENT,
  SalesQuotationStatus.VIEWED,
  SalesQuotationStatus.WITHDRAWN,
  SalesQuotationStatus.EXPIRED,
];

const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");
const stableChecksum = (value: unknown) => hashValue(JSON.stringify(value));
const asMinor = (value: bigint) => value.toString();
const asDecimal = (value: { toString(): string } | null) => (value ? value.toString() : null);

@Injectable()
export class QuotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthContext, options: { projectId?: string; status?: string }) {
    const leadScope = this.canSeeAll(user) ? {} : { lead: { assignedToId: user.userId } };
    const status = options.status && Object.values(SalesQuotationStatus).includes(options.status as SalesQuotationStatus)
      ? options.status as SalesQuotationStatus
      : undefined;
    const quotations = await this.prisma.salesQuotation.findMany({
      where: { tenantId: user.tenantId, ...(options.projectId ? { projectId: options.projectId } : {}), ...(status ? { status } : {}), ...leadScope },
      orderBy: [{ updatedAt: "desc" }, { quotationNumber: "desc" }],
      include: this.summaryInclude(),
    });
    return quotations.map((quotation) => this.serializeSummary(quotation));
  }

  async detail(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, true);
    return this.serializeDetail(quotation);
  }

  async createDraft(user: AuthContext, command: CreateSalesQuotationDto) {
    const lead = await this.requireAccessibleLead(user, command.leadId);
    if (!lead.customerId || !lead.projectId || !lead.unitId) {
      throw new BadRequestException("A quotation requires a lead with customer, project, and unit");
    }
    if (!lead.unit || lead.unit.status !== UnitStatus.AVAILABLE) {
      throw new ConflictException("A quotation requires an available unit");
    }
    const expiresAt = this.requireFutureExpiry(command.expiresAt);
    const [priceRevision, paymentPlan] = await Promise.all([
      this.currentPublishedPrice(user.tenantId, lead.unitId),
      this.requirePaymentPlan(user.tenantId, lead.projectId, command.paymentPlanId),
    ]);
    const quotation = await this.prisma.salesQuotation.create({
      data: {
        tenantId: user.tenantId,
        quotationNumber: this.nextQuotationNumber(),
        leadId: lead.id,
        customerId: lead.customerId,
        projectId: lead.projectId,
        unitId: lead.unitId,
        sourcePriceRevisionId: priceRevision.id,
        paymentPlanId: paymentPlan.id,
        currency: priceRevision.currency,
        expiresAt,
        termsSnapshot: command.terms ? { body: command.terms.trim() } : undefined,
        createdById: user.userId,
      },
      include: this.summaryInclude(),
    });
    await this.audit.record({
      tenantId: user.tenantId,
      actorId: user.userId,
      action: "SALES_QUOTATION_DRAFT_CREATED",
      entityType: "SalesQuotation",
      entityId: quotation.id,
      metadata: { quotationNumber: quotation.quotationNumber, revision: quotation.revision, leadId: quotation.leadId },
    });
    return this.serializeDetail(quotation);
  }

  async updateDraft(user: AuthContext, quotationId: string, command: UpdateSalesQuotationDto) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    if (quotation.status !== SalesQuotationStatus.DRAFT) {
      throw new ConflictException("Only a draft quotation may be edited");
    }
    if (quotation.createdById !== user.userId && !this.canSeeAll(user)) {
      throw new ForbiddenException("Only the draft creator may edit this quotation");
    }
    const paymentPlan = command.paymentPlanId
      ? await this.requirePaymentPlan(user.tenantId, quotation.projectId, command.paymentPlanId)
      : undefined;
    const updated = await this.prisma.salesQuotation.update({
      where: { id: quotation.id },
      data: {
        ...(command.expiresAt ? { expiresAt: this.requireFutureExpiry(command.expiresAt) } : {}),
        ...(paymentPlan ? { paymentPlanId: paymentPlan.id } : {}),
        ...(command.terms !== undefined ? { termsSnapshot: { body: command.terms.trim() } } : {}),
      },
      include: this.summaryInclude(),
    });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.userId, action: "SALES_QUOTATION_DRAFT_UPDATED", entityType: "SalesQuotation", entityId: quotation.id });
    return this.serializeDetail(updated);
  }

  async submitForReview(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    if (quotation.status !== SalesQuotationStatus.DRAFT) {
      throw new ConflictException("Only a draft quotation may be submitted for review");
    }
    if (quotation.createdById !== user.userId && !this.canSeeAll(user)) {
      throw new ForbiddenException("Only the draft creator may submit this quotation");
    }
    const updated = await this.prisma.salesQuotation.update({
      where: { id: quotation.id },
      data: { status: SalesQuotationStatus.INTERNAL_REVIEW },
      include: this.summaryInclude(),
    });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.userId, action: "SALES_QUOTATION_SUBMITTED_FOR_REVIEW", entityType: "SalesQuotation", entityId: quotation.id });
    return this.serializeDetail(updated);
  }

  async returnToDraft(user: AuthContext, quotationId: string, command: ReturnSalesQuotationDto) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    this.requireManager(user);
    if (quotation.status !== SalesQuotationStatus.INTERNAL_REVIEW) {
      throw new ConflictException("Only a quotation under internal review may be returned");
    }
    const now = new Date();
    const updated = await this.prisma.salesQuotation.update({
      where: { id: quotation.id },
      data: { status: SalesQuotationStatus.DRAFT, reviewedById: user.userId, reviewedAt: now },
      include: this.summaryInclude(),
    });
    await this.audit.record({
      tenantId: user.tenantId,
      actorId: user.userId,
      action: "SALES_QUOTATION_RETURNED_TO_DRAFT",
      entityType: "SalesQuotation",
      entityId: quotation.id,
      metadata: { reason: command.reason.trim() },
    });
    return this.serializeDetail(updated);
  }

  async approveToSend(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    this.requireManager(user);
    if (quotation.status !== SalesQuotationStatus.INTERNAL_REVIEW) {
      throw new ConflictException("Only a quotation under internal review may be approved to send");
    }
    if (quotation.createdById === user.userId) {
      throw new ForbiddenException("A quotation creator cannot approve their own quotation");
    }
    if (quotation.expiresAt <= new Date()) {
      throw new ConflictException("An expired quotation cannot be approved to send");
    }

    const source = await this.requireSnapshotSources(user.tenantId, quotation);
    const snapshot = this.buildSnapshot(quotation, source);
    const now = new Date();
    const updated = await this.prisma.salesQuotation.update({
      where: { id: quotation.id },
      data: {
        status: SalesQuotationStatus.APPROVED_TO_SEND,
        priceSnapshot: snapshot.price,
        paymentPlanSnapshot: snapshot.paymentPlan,
        customerSnapshot: snapshot.customer,
        unitSnapshot: snapshot.unit,
        termsSnapshot: snapshot.terms,
        sourcePriceRevisionId: source.price.id,
        paymentPlanId: source.paymentPlan.id,
        currency: source.price.currency,
        snapshotChecksum: snapshot.checksum,
        previewChecksum: snapshot.previewChecksum,
        reviewedById: user.userId,
        reviewedAt: now,
        approvedToSendById: user.userId,
        approvedToSendAt: now,
      },
      include: this.summaryInclude(),
    });
    await this.audit.record({
      tenantId: user.tenantId,
      actorId: user.userId,
      action: "SALES_QUOTATION_APPROVED_TO_SEND",
      entityType: "SalesQuotation",
      entityId: quotation.id,
      metadata: { snapshotChecksum: snapshot.checksum, sourcePriceRevisionId: source.price.id, paymentPlanId: source.paymentPlan.id },
    });
    return this.serializeDetail(updated);
  }

  async withdraw(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    this.requireManager(user);
    if (!CUSTOMER_VISIBLE_STATUSES.includes(quotation.status)) {
      throw new ConflictException("Only an approved or customer-visible quotation may be withdrawn");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.quotationApprovalToken.updateMany({ where: { quotationId: quotation.id, consumedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      return tx.salesQuotation.update({ where: { id: quotation.id }, data: { status: SalesQuotationStatus.WITHDRAWN, withdrawnAt: new Date() }, include: this.summaryInclude() });
    });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.userId, action: "SALES_QUOTATION_WITHDRAWN", entityType: "SalesQuotation", entityId: quotation.id });
    return this.serializeDetail(updated);
  }

  async createRevision(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, false);
    if (!SUPERSEDABLE_STATUSES.includes(quotation.status)) {
      throw new ConflictException("This quotation state cannot be superseded");
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const nextRevision = quotation.revision + 1;
      await tx.salesQuotation.update({ where: { id: quotation.id }, data: { status: SalesQuotationStatus.SUPERSEDED } });
      return tx.salesQuotation.create({
        data: {
          tenantId: user.tenantId,
          quotationNumber: quotation.quotationNumber,
          revision: nextRevision,
          leadId: quotation.leadId,
          customerId: quotation.customerId,
          projectId: quotation.projectId,
          unitId: quotation.unitId,
          sourcePriceRevisionId: quotation.sourcePriceRevisionId,
          paymentPlanId: quotation.paymentPlanId,
          currency: quotation.currency,
          expiresAt: quotation.expiresAt,
          termsSnapshot: quotation.termsSnapshot ?? undefined,
          createdById: user.userId,
          supersedesId: quotation.id,
        },
        include: this.summaryInclude(),
      });
    });
    await this.audit.record({ tenantId: user.tenantId, actorId: user.userId, action: "SALES_QUOTATION_SUPERSEDED", entityType: "SalesQuotation", entityId: quotation.id, metadata: { newRevisionId: result.id } });
    return this.serializeDetail(result);
  }

  async previewDocument(user: AuthContext, quotationId: string) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, true);
    if (!quotation.snapshotChecksum || !quotation.priceSnapshot || !quotation.paymentPlanSnapshot || !quotation.customerSnapshot || !quotation.unitSnapshot) {
      throw new ConflictException("The quotation must be approved before preview");
    }
    return {
      kind: "SYNTHETIC_PDF_PREVIEW",
      label: "DESIGN/UAT PREVIEW — NO LEGAL SIGNATURE OR LIVE COMMUNICATION",
      quotation: this.serializeDetail(quotation),
      checksum: quotation.previewChecksum ?? quotation.snapshotChecksum,
    };
  }

  async generateSyntheticPreviewLink(user: AuthContext, quotationId: string, ttlMinutes = 60) {
    const quotation = await this.requireAccessibleQuotation(user, quotationId, true);
    if (quotation.status !== SalesQuotationStatus.APPROVED_TO_SEND) {
      throw new ConflictException("Only an approved-to-send quotation can generate a synthetic preview link");
    }
    const token = randomBytes(48).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(Math.min(quotation.expiresAt.getTime(), now.getTime() + ttlMinutes * 60_000));
    await this.prisma.$transaction([
      this.prisma.quotationApprovalToken.updateMany({ where: { quotationId: quotation.id, purpose: TOKEN_PURPOSE, consumedAt: null, revokedAt: null }, data: { revokedAt: now } }),
      this.prisma.quotationApprovalToken.create({ data: { tenantId: user.tenantId, quotationId: quotation.id, tokenHash: hashValue(token), purpose: TOKEN_PURPOSE, expiresAt } }),
    ]);
    await this.audit.record({ tenantId: user.tenantId, actorId: user.userId, action: "SALES_QUOTATION_SYNTHETIC_PREVIEW_LINK_GENERATED", entityType: "SalesQuotation", entityId: quotation.id, metadata: { expiresAt: expiresAt.toISOString() } });
    return { token, expiresAt: expiresAt.toISOString(), mode: "SYNTHETIC_PREVIEW_ONLY" };
  }

  async publicQuotation(token: string) {
    const resolved = await this.resolvePublicToken(token, false);
    const quotation = resolved.quotation;
    if (quotation.status === SalesQuotationStatus.SENT) {
      await this.prisma.salesQuotation.updateMany({ where: { id: quotation.id, status: SalesQuotationStatus.SENT }, data: { status: SalesQuotationStatus.VIEWED, viewedAt: new Date() } });
    }
    return {
      mode: "DESIGN_UAT_PREVIEW",
      label: "DESIGN/UAT PREVIEW — NO LEGAL SIGNATURE OR LIVE COMMUNICATION",
      quotation: this.serializePublicQuotation(quotation),
      canDecide: quotation.status === SalesQuotationStatus.APPROVED_TO_SEND || quotation.status === SalesQuotationStatus.SENT || quotation.status === SalesQuotationStatus.VIEWED,
    };
  }

  async recordCustomerDecision(command: RecordCustomerDecisionDto, clientMetadata: Record<string, string | undefined>) {
    const now = new Date();
    const resolved = await this.resolvePublicToken(command.token, true);
    const quotation = resolved.quotation;
    if (!CUSTOMER_VISIBLE_STATUSES.includes(quotation.status)) {
      throw new BadRequestException(GENERIC_TOKEN_ERROR);
    }
    if (command.decision === CustomerDecisionType.CLARIFICATION_REQUESTED && !command.comment) {
      throw new BadRequestException("A clarification request requires a comment");
    }
    const terminal = command.decision === CustomerDecisionType.ACCEPTED || command.decision === CustomerDecisionType.DECLINED;
    const targetStatus = command.decision === CustomerDecisionType.ACCEPTED
      ? SalesQuotationStatus.CUSTOMER_ACCEPTED
      : command.decision === CustomerDecisionType.DECLINED
        ? SalesQuotationStatus.CUSTOMER_DECLINED
        : quotation.status;
    const evidence = {
      quotationId: quotation.id,
      quotationChecksum: quotation.snapshotChecksum,
      decision: command.decision,
      comment: command.comment?.trim() ?? null,
      occurredAt: now.toISOString(),
      method: "SYNTHETIC_PREVIEW_TOKEN",
    };

    const accepted = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.quotationApprovalToken.updateMany({
        where: { id: resolved.token.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now, attempts: { increment: 1 } },
      });
      if (claimed.count !== 1) return null;
      const decision = await tx.customerDecision.create({
        data: {
          tenantId: quotation.tenantId,
          quotationId: quotation.id,
          approvalTokenId: resolved.token.id,
          decision: command.decision,
          ...(command.comment ? { comment: command.comment.trim() } : {}),
          identityEvidence: { method: "SYNTHETIC_PREVIEW_TOKEN", verified: false },
          clientMetadata: this.sanitizeClientMetadata(clientMetadata),
          evidenceChecksum: stableChecksum(evidence),
        },
      });
      if (terminal) {
        await tx.salesQuotation.update({ where: { id: quotation.id }, data: { status: targetStatus } });
      }
      await tx.quotationApprovalToken.updateMany({ where: { quotationId: quotation.id, id: { not: resolved.token.id }, consumedAt: null, revokedAt: null }, data: { revokedAt: now } });
      await tx.auditEvent.create({ data: { tenantId: quotation.tenantId, action: `SALES_QUOTATION_CUSTOMER_${command.decision}`, entityType: "SalesQuotation", entityId: quotation.id, metadata: { evidenceChecksum: stableChecksum(evidence), syntheticPreview: true } } });
      return decision;
    });
    if (!accepted) throw new BadRequestException(GENERIC_TOKEN_ERROR);
    return {
      receipt: {
        quotationNumber: quotation.quotationNumber,
        revision: quotation.revision,
        decision: accepted.decision,
        recordedAt: accepted.createdAt.toISOString(),
        message: "Your decision was recorded. It does not create a reservation or payment obligation.",
      },
    };
  }

  private async resolvePublicToken(tokenValue: string, forDecision: boolean) {
    const now = new Date();
    const token = await this.prisma.quotationApprovalToken.findUnique({
      where: { tokenHash: hashValue(tokenValue) },
      include: { quotation: { include: this.publicInclude() } },
    });
    if (!token || token.purpose !== TOKEN_PURPOSE || token.revokedAt || token.consumedAt || token.expiresAt <= now) {
      throw new BadRequestException(GENERIC_TOKEN_ERROR);
    }
    if (token.quotation.expiresAt <= now) {
      await this.prisma.salesQuotation.updateMany({ where: { id: token.quotation.id, status: { in: [SalesQuotationStatus.APPROVED_TO_SEND, SalesQuotationStatus.SENT, SalesQuotationStatus.VIEWED] } }, data: { status: SalesQuotationStatus.EXPIRED } });
      throw new BadRequestException(GENERIC_TOKEN_ERROR);
    }
    if (forDecision && !CUSTOMER_VISIBLE_STATUSES.includes(token.quotation.status)) {
      throw new BadRequestException(GENERIC_TOKEN_ERROR);
    }
    return { token, quotation: token.quotation };
  }

  private async requireAccessibleLead(user: AuthContext, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId, ...(this.canSeeAll(user) ? {} : { assignedToId: user.userId }) },
      include: { customer: true, project: true, unit: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  private async requireAccessibleQuotation(user: AuthContext, quotationId: string, includeDetail: boolean) {
    const leadScope = this.canSeeAll(user) ? {} : { lead: { assignedToId: user.userId } };
    const quotation = await this.prisma.salesQuotation.findFirst({
      where: { id: quotationId, tenantId: user.tenantId, ...leadScope },
      include: includeDetail ? this.detailInclude() : this.summaryInclude(),
    });
    if (!quotation) throw new NotFoundException("Quotation not found");
    return quotation;
  }

  private async currentPublishedPrice(tenantId: string, unitId: string) {
    const now = new Date();
    const price = await this.prisma.unitPriceRevision.findFirst({
      where: { tenantId, unitId, status: UnitPriceRevisionStatus.PUBLISHED, OR: [{ validFrom: null }, { validFrom: { lte: now } }], AND: [{ OR: [{ validTo: null }, { validTo: { gt: now } }] }] },
      orderBy: [{ revision: "desc" }],
    });
    if (!price) throw new ConflictException("No current published unit price is available");
    return price;
  }

  private async requirePaymentPlan(tenantId: string, projectId: string, paymentPlanId: string) {
    const plan = await this.prisma.paymentPlan.findFirst({ where: { id: paymentPlanId, tenantId, projectId }, include: { installments: { orderBy: { sequence: "asc" } } } });
    if (!plan) throw new NotFoundException("Payment plan not found");
    return plan;
  }

  private async requireSnapshotSources(tenantId: string, quotation: { unitId: string; projectId: string; paymentPlanId: string; customerId: string }) {
    const [price, paymentPlan, unit] = await Promise.all([
      this.currentPublishedPrice(tenantId, quotation.unitId),
      this.requirePaymentPlan(tenantId, quotation.projectId, quotation.paymentPlanId),
      this.prisma.unit.findFirst({ where: { id: quotation.unitId, tenantId }, include: { project: true } }),
    ]);
    if (!unit || unit.status !== UnitStatus.AVAILABLE) throw new ConflictException("The quotation unit is no longer available");
    const customer = await this.prisma.customer.findFirst({ where: { id: quotation.customerId, tenantId } });
    if (!customer) throw new ConflictException("The quotation customer is unavailable");
    return { price, paymentPlan, unit, customer };
  }

  private buildSnapshot(quotation: { id: string; quotationNumber: string; revision: number; termsSnapshot: unknown; expiresAt: Date }, source: Awaited<ReturnType<QuotationService["requireSnapshotSources"]>>) {
    const terms = quotation.termsSnapshot && typeof quotation.termsSnapshot === "object" ? quotation.termsSnapshot : { body: "" };
    const price = {
      sourcePriceRevisionId: source.price.id,
      revision: source.price.revision,
      basePriceMinor: asMinor(source.price.basePriceMinor),
      listPriceMinor: asMinor(source.price.listPriceMinor),
      currency: source.price.currency,
      validFrom: source.price.validFrom?.toISOString() ?? null,
      validTo: source.price.validTo?.toISOString() ?? null,
    };
    const paymentPlan = {
      paymentPlanId: source.paymentPlan.id,
      installments: source.paymentPlan.installments.map((installment) => ({ sequence: installment.sequence, shareBasisPoints: installment.shareBasisPoints, label: installment.label ?? null })),
    };
    const customer = { customerId: source.customer.id, displayName: [source.customer.firstName, source.customer.lastName].filter(Boolean).join(" "), email: source.customer.email };
    const unit = {
      unitId: source.unit.id,
      code: source.unit.code,
      number: source.unit.number,
      grossArea: asDecimal(source.unit.grossArea),
      netArea: asDecimal(source.unit.netArea),
      bedrooms: source.unit.bedrooms,
      bathrooms: source.unit.bathrooms,
      projectId: source.unit.project.id,
      projectName: source.unit.project.name,
      projectCode: source.unit.project.code,
    };
    const canonical = { quotationId: quotation.id, quotationNumber: quotation.quotationNumber, revision: quotation.revision, expiresAt: quotation.expiresAt.toISOString(), price, paymentPlan, customer, unit, terms };
    return { price, paymentPlan, customer, unit, terms, checksum: stableChecksum(canonical), previewChecksum: stableChecksum({ version: "quotation-preview-v1", canonical }) };
  }

  private summaryInclude() {
    return { lead: { select: { id: true, assignedToId: true } }, customer: { select: { firstName: true, lastName: true, email: true } }, project: { select: { code: true, name: true } }, unit: { select: { code: true, number: true } } } as const;
  }

  private detailInclude() {
    return { ...this.summaryInclude(), paymentPlan: { include: { installments: { orderBy: { sequence: "asc" } } } }, sourcePriceRevision: true, customerDecisions: { orderBy: { createdAt: "asc" } } } as const;
  }

  private publicInclude() {
    return { customerDecisions: { orderBy: { createdAt: "asc" } } } as const;
  }

  private serializeSummary(quotation: any) {
    return {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      revision: quotation.revision,
      status: quotation.status,
      expiresAt: quotation.expiresAt.toISOString(),
      currency: quotation.currency,
      customer: quotation.customer ? { displayName: [quotation.customer.firstName, quotation.customer.lastName].filter(Boolean).join(" ") } : null,
      project: quotation.project,
      unit: quotation.unit,
      leadId: quotation.leadId,
      snapshotChecksum: quotation.snapshotChecksum,
      updatedAt: quotation.updatedAt.toISOString(),
    };
  }

  private serializeDetail(quotation: any) {
    return {
      ...this.serializeSummary(quotation),
      createdById: quotation.createdById,
      reviewedById: quotation.reviewedById,
      approvedToSendById: quotation.approvedToSendById,
      reviewedAt: quotation.reviewedAt?.toISOString() ?? null,
      approvedToSendAt: quotation.approvedToSendAt?.toISOString() ?? null,
      priceSnapshot: quotation.priceSnapshot,
      paymentPlanSnapshot: quotation.paymentPlanSnapshot,
      customerSnapshot: quotation.customerSnapshot,
      unitSnapshot: quotation.unitSnapshot,
      termsSnapshot: quotation.termsSnapshot,
      previewChecksum: quotation.previewChecksum,
      sourcePriceRevisionId: quotation.sourcePriceRevisionId,
      paymentPlanId: quotation.paymentPlanId,
      decisions: quotation.customerDecisions?.map((decision: any) => ({ decision: decision.decision, comment: decision.comment, createdAt: decision.createdAt.toISOString(), evidenceChecksum: decision.evidenceChecksum })) ?? [],
    };
  }

  private serializePublicQuotation(quotation: any) {
    return {
      quotationNumber: quotation.quotationNumber,
      revision: quotation.revision,
      status: quotation.status,
      expiresAt: quotation.expiresAt.toISOString(),
      currency: quotation.currency,
      priceSnapshot: quotation.priceSnapshot,
      paymentPlanSnapshot: quotation.paymentPlanSnapshot,
      customerSnapshot: quotation.customerSnapshot,
      unitSnapshot: quotation.unitSnapshot,
      termsSnapshot: quotation.termsSnapshot,
      snapshotChecksum: quotation.snapshotChecksum,
      customerDecisions: quotation.customerDecisions?.map((decision: any) => ({ decision: decision.decision, comment: decision.comment, createdAt: decision.createdAt.toISOString() })) ?? [],
    };
  }

  private canSeeAll(user: AuthContext) {
    return user.permissions.includes("commercial:quotation:read-all") || user.permissions.includes("commercial:lead:view-all");
  }

  private requireManager(user: AuthContext) {
    if (!user.permissions.includes("commercial:quotation:review")) {
      throw new ForbiddenException("Quotation review permission is required");
    }
  }

  private requireFutureExpiry(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() + 5 * 60_000) {
      throw new BadRequestException("Quotation expiry must be at least five minutes in the future");
    }
    return date;
  }

  private nextQuotationNumber() {
    return `${QUOTATION_NUMBER_PREFIX}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
  }

  private sanitizeClientMetadata(metadata: Record<string, string | undefined>) {
    const result: Record<string, string> = {};
    for (const key of ["userAgent", "ipAddress"]) {
      const value = metadata[key];
      if (value) result[key] = value.slice(0, 256);
    }
    return result;
  }
}
