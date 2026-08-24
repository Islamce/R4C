import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ContactCommunicationPreference,
  CrmTaskStatus,
  CustomerDecisionStatus,
  OpportunityStage,
  Prisma,
  QuotationRevisionStatus,
} from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ApproveRevisionDto,
  ConvertLeadDto,
  CreateActivityDto,
  CreateContactDto,
  CreateOpportunityDto,
  CreateQuotationDto,
  CreateRevisionDto,
  CreateTaskDto,
  RecordDecisionDto,
  UpdateOpportunityStageDto,
  UpdateTaskStatusDto,
} from "./crm.dto";

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listContacts(tenantId: string, ownerId?: string) {
    return this.prisma.contact.findMany({
      where: { tenantId, ...(ownerId ? { ownerId } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { customer: true, lead: true, owner: { select: { id: true, displayName: true, email: true } } },
    });
  }

  async createContact(tenantId: string, actorId: string, command: CreateContactDto) {
    const ownerId = command.ownerId ?? actorId;
    await this.requireMember(tenantId, ownerId);
    await this.requireScopedReferences(tenantId, command);
    const normalized = normalizeIdentity(command.email, command.phone);
    await this.assertContactIsUnique(tenantId, normalized.emailNormalized, normalized.phoneNormalized);
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        ownerId,
        firstName: command.firstName.trim(),
        lastName: command.lastName?.trim() || undefined,
        email: command.email?.trim() || undefined,
        emailNormalized: normalized.emailNormalized,
        phone: command.phone?.trim() || undefined,
        phoneNormalized: normalized.phoneNormalized,
        communicationPreference: command.communicationPreference ?? ContactCommunicationPreference.PHONE,
        source: command.source?.trim() || undefined,
        customerId: command.customerId,
        leadId: command.leadId,
      },
    });
    await this.audit.record({ tenantId, actorId, action: "CONTACT_CREATED", entityType: "Contact", entityId: contact.id, metadata: { ownerId } });
    return contact;
  }

  async convertLead(tenantId: string, actorId: string, leadId: string, command: ConvertLeadDto) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, tenantId }, include: { customer: true } });
    if (!lead) throw new NotFoundException("Lead not found");
    const existing = await this.prisma.contact.findFirst({ where: { tenantId, leadId } });
    if (existing) return { contact: existing, created: false };
    if (!lead.customer) throw new ConflictException("Lead must be linked to a Customer before conversion");
    const ownerId = command.ownerId ?? lead.assignedToId;
    await this.requireMember(tenantId, ownerId);
    const normalized = normalizeIdentity(lead.customer.email, lead.customer.phone);
    await this.assertContactIsUnique(tenantId, normalized.emailNormalized, normalized.phoneNormalized);
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        leadId,
        customerId: lead.customerId,
        ownerId,
        firstName: lead.customer.firstName,
        lastName: lead.customer.lastName,
        email: lead.customer.email,
        emailNormalized: normalized.emailNormalized,
        phone: lead.customer.phone,
        phoneNormalized: normalized.phoneNormalized,
        communicationPreference: ContactCommunicationPreference.PHONE,
        source: lead.source,
      },
    });
    await this.audit.record({ tenantId, actorId, action: "LEAD_CONVERTED_TO_CONTACT", entityType: "Lead", entityId: leadId, metadata: { contactId: contact.id, ownerId } });
    return { contact, created: true };
  }

  listOpportunities(tenantId: string, ownerId?: string) {
    return this.prisma.opportunity.findMany({
      where: { tenantId, ...(ownerId ? { ownerId } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { contact: true, customer: true, lead: true, project: true, unit: true, owner: { select: { id: true, displayName: true, email: true } } },
    });
  }

  async createOpportunity(tenantId: string, actorId: string, command: CreateOpportunityDto) {
    const ownerId = command.ownerId ?? actorId;
    await this.requireMember(tenantId, ownerId);
    await this.requireScopedReferences(tenantId, command);
    const opportunity = await this.prisma.opportunity.create({
      data: {
        tenantId,
        ownerId,
        name: command.name.trim(),
        leadId: command.leadId,
        customerId: command.customerId,
        contactId: command.contactId,
        projectId: command.projectId,
        unitId: command.unitId,
        stage: command.stage ?? OpportunityStage.QUALIFICATION,
        expectedValueMinor: command.expectedValueMinor === undefined ? undefined : BigInt(command.expectedValueMinor),
        currency: command.currency?.trim().toUpperCase(),
        source: command.source?.trim(),
      },
    });
    await this.audit.record({ tenantId, actorId, action: "OPPORTUNITY_CREATED", entityType: "Opportunity", entityId: opportunity.id, metadata: { stage: opportunity.stage, ownerId } });
    return opportunity;
  }

  async updateOpportunityStage(tenantId: string, actorId: string, opportunityId: string, command: UpdateOpportunityStageDto) {
    const current = await this.prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
    if (!current) throw new NotFoundException("Opportunity not found");
    if (!isValidStageTransition(current.stage, command.stage)) throw new ConflictException(`Invalid opportunity transition ${current.stage} -> ${command.stage}`);
    const closed = isTerminalStage(command.stage);
    const opportunity = await this.prisma.opportunity.update({ where: { id: opportunityId }, data: { stage: command.stage, closedAt: closed ? new Date() : null } });
    await this.audit.record({ tenantId, actorId, action: "OPPORTUNITY_STAGE_CHANGED", entityType: "Opportunity", entityId: opportunityId, metadata: { from: current.stage, to: command.stage } });
    return opportunity;
  }

  listActivities(tenantId: string, opportunityId?: string) {
    return this.prisma.crmActivity.findMany({ where: { tenantId, ...(opportunityId ? { opportunityId } : {}) }, orderBy: { createdAt: "desc" }, include: { actor: { select: { id: true, displayName: true } } } });
  }

  async createActivity(tenantId: string, actorId: string, command: CreateActivityDto) {
    await this.requireScopedReferences(tenantId, command);
    const activity = await this.prisma.crmActivity.create({ data: { tenantId, actorId, ...command } });
    await this.audit.record({ tenantId, actorId, action: "CRM_ACTIVITY_CREATED", entityType: "CrmActivity", entityId: activity.id, metadata: { type: activity.type } });
    return activity;
  }

  listTasks(tenantId: string, assigneeId?: string) {
    return this.prisma.crmTask.findMany({ where: { tenantId, ...(assigneeId ? { assigneeId } : {}) }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] });
  }

  async createTask(tenantId: string, actorId: string, command: CreateTaskDto) {
    await this.requireMember(tenantId, command.assigneeId);
    await this.requireScopedReferences(tenantId, command);
    const task = await this.prisma.crmTask.create({ data: { tenantId, createdById: actorId, title: command.title.trim(), description: command.description, priority: command.priority, dueAt: command.dueAt ? new Date(command.dueAt) : undefined, assigneeId: command.assigneeId, contactId: command.contactId, leadId: command.leadId, opportunityId: command.opportunityId, quotationId: command.quotationId, reservationId: command.reservationId, projectId: command.projectId, unitId: command.unitId } });
    await this.audit.record({ tenantId, actorId, action: "CRM_TASK_CREATED", entityType: "CrmTask", entityId: task.id, metadata: { assigneeId: task.assigneeId } });
    return task;
  }

  async updateTaskStatus(tenantId: string, actorId: string, taskId: string, command: UpdateTaskStatusDto) {
    const task = await this.prisma.crmTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException("CRM task not found");
    const completed = command.status === CrmTaskStatus.COMPLETED;
    const updated = await this.prisma.crmTask.update({ where: { id: taskId }, data: { status: command.status, completedAt: completed ? new Date() : command.status === CrmTaskStatus.OPEN ? null : task.completedAt } });
    await this.audit.record({ tenantId, actorId, action: "CRM_TASK_STATUS_CHANGED", entityType: "CrmTask", entityId: taskId, metadata: { from: task.status, to: command.status } });
    return updated;
  }

  async createQuotation(tenantId: string, actorId: string, command: CreateQuotationDto) {
    await this.requireScopedReferences(tenantId, command);
    const ownerId = command.ownerId ?? actorId;
    await this.requireMember(tenantId, ownerId);
    return this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({ data: { tenantId, opportunityId: command.opportunityId, leadId: command.leadId, customerId: command.customerId, projectId: command.projectId, unitId: command.unitId, ownerId } });
      const revision = await tx.quotationRevision.create({ data: { tenantId, quotationId: quotation.id, revision: 1, snapshot: command.snapshot as Prisma.InputJsonValue, createdById: actorId } });
      await this.audit.record({ tenantId, actorId, action: "QUOTATION_CREATED", entityType: "Quotation", entityId: quotation.id, metadata: { revisionId: revision.id } });
      return { quotation, revision };
    });
  }

  async createQuotationRevision(tenantId: string, actorId: string, quotationId: string, command: CreateRevisionDto) {
    const quotation = await this.prisma.quotation.findFirst({ where: { id: quotationId, tenantId } });
    if (!quotation) throw new NotFoundException("Quotation not found");
    return this.prisma.$transaction(async (tx) => {
      const revision = quotation.currentRevision + 1;
      await tx.quotationRevision.updateMany({ where: { quotationId, tenantId, status: { in: [QuotationRevisionStatus.DRAFT, QuotationRevisionStatus.APPROVAL_PENDING, QuotationRevisionStatus.APPROVED, QuotationRevisionStatus.SENT] } }, data: { status: QuotationRevisionStatus.SUPERSEDED, supersededAt: new Date() } });
      const created = await tx.quotationRevision.create({ data: { tenantId, quotationId, revision, snapshot: command.snapshot as Prisma.InputJsonValue, createdById: actorId } });
      await tx.quotation.update({ where: { id: quotationId }, data: { currentRevision: revision, status: "DRAFT" } });
      await this.audit.record({ tenantId, actorId, action: "QUOTATION_REVISION_CREATED", entityType: "QuotationRevision", entityId: created.id, metadata: { quotationId, revision } });
      return created;
    });
  }

  async decideQuotation(tenantId: string, actorId: string, revisionId: string, command: RecordDecisionDto) {
    const revision = await this.prisma.quotationRevision.findFirst({ where: { id: revisionId, tenantId } });
    if (!revision) throw new NotFoundException("Quotation revision not found");
    if (revision.status === QuotationRevisionStatus.SUPERSEDED) throw new ConflictException("Superseded quotation revisions cannot receive decisions");
    const existing = await this.prisma.customerDecision.findUnique({ where: { quotationRevisionId: revisionId } });
    if (existing) throw new ConflictException("A customer decision already exists for this quotation revision");
    const decision = await this.prisma.customerDecision.create({ data: { tenantId, quotationRevisionId: revisionId, status: command.status, decidedById: actorId, note: command.note } });
    const quotationStatus = command.status === CustomerDecisionStatus.ACCEPTED ? "ACCEPTED" : command.status === CustomerDecisionStatus.DECLINED ? "DECLINED" : "REVISION_REQUESTED";
    await this.prisma.quotation.update({ where: { id: revision.quotationId }, data: { status: quotationStatus } });
    await this.audit.record({ tenantId, actorId, action: "QUOTATION_CUSTOMER_DECISION_RECORDED", entityType: "CustomerDecision", entityId: decision.id, metadata: { revisionId, status: command.status } });
    return decision;
  }

  async approveQuotationRevision(tenantId: string, actorId: string, revisionId: string, command: ApproveRevisionDto) {
    const revision = await this.prisma.quotationRevision.findFirst({ where: { id: revisionId, tenantId } });
    if (!revision) throw new NotFoundException("Quotation revision not found");
    if (revision.status === QuotationRevisionStatus.SUPERSEDED) throw new ConflictException("Superseded quotation revisions cannot be approved");
    if (command.status !== QuotationRevisionStatus.APPROVED && command.status !== QuotationRevisionStatus.SENT) throw new ConflictException("Revision status endpoint only supports APPROVED or SENT");
    if (command.status === QuotationRevisionStatus.SENT && revision.status !== QuotationRevisionStatus.APPROVED && revision.status !== QuotationRevisionStatus.SENT) throw new ConflictException("A quotation revision must be approved before it is sent");
    const updated = await this.prisma.quotationRevision.update({ where: { id: revisionId }, data: { status: command.status, approvedAt: command.status === QuotationRevisionStatus.APPROVED ? new Date() : revision.approvedAt, sentAt: command.status === QuotationRevisionStatus.SENT ? new Date() : revision.sentAt } });
    await this.audit.record({ tenantId, actorId, action: "QUOTATION_REVISION_STATUS_CHANGED", entityType: "QuotationRevision", entityId: revisionId, metadata: { from: revision.status, to: command.status } });
    return updated;
  }

  private async assertContactIsUnique(tenantId: string, emailNormalized?: string, phoneNormalized?: string) {
    const or = [emailNormalized ? { emailNormalized } : undefined, phoneNormalized ? { phoneNormalized } : undefined].filter(Boolean) as { emailNormalized?: string; phoneNormalized?: string }[];
    if (!or.length) return;
    const duplicate = await this.prisma.contact.findFirst({ where: { tenantId, OR: or } });
    if (duplicate) throw new ConflictException("A contact with the same normalized email or phone already exists in this tenant");
  }

  private async requireMember(tenantId: string, userId: string) {
    const member = await this.prisma.tenantMembership.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
    if (!member) throw new NotFoundException("User is not a member of this tenant");
  }

  private async requireScopedReferences(tenantId: string, command: object) {
    const input = command as Record<string, unknown>;
    const checks: Array<Promise<unknown>> = [];
    const add = (id: unknown, lookup: () => Promise<unknown>) => {
      if (typeof id === "string") checks.push(lookup());
    };
    add(input.customerId, () => this.prisma.customer.findFirst({ where: { id: input.customerId as string, tenantId } }));
    add(input.leadId, () => this.prisma.lead.findFirst({ where: { id: input.leadId as string, tenantId } }));
    add(input.projectId, () => this.prisma.project.findFirst({ where: { id: input.projectId as string, tenantId } }));
    add(input.unitId, () => this.prisma.unit.findFirst({ where: { id: input.unitId as string, tenantId } }));
    add(input.contactId, () => this.prisma.contact.findFirst({ where: { id: input.contactId as string, tenantId } }));
    add(input.opportunityId, () => this.prisma.opportunity.findFirst({ where: { id: input.opportunityId as string, tenantId } }));
    add(input.quotationId, () => this.prisma.quotation.findFirst({ where: { id: input.quotationId as string, tenantId } }));
    add(input.reservationId, () => this.prisma.reservation.findFirst({ where: { id: input.reservationId as string, tenantId } }));
    const found = await Promise.all(checks);
    if (found.some((record) => !record)) throw new NotFoundException("One or more CRM references were not found in this tenant");
  }
}

function normalizeIdentity(email?: string, phone?: string) {
  return {
    emailNormalized: email?.trim().toLowerCase() || undefined,
    phoneNormalized: phone?.replace(/[^0-9+]/g, "") || undefined,
  };
}

function isTerminalStage(stage: OpportunityStage) {
  return stage === OpportunityStage.WON || stage === OpportunityStage.LOST || stage === OpportunityStage.DISQUALIFIED;
}

function isValidStageTransition(from: OpportunityStage, to: OpportunityStage) {
  if (from === to) return true;
  if (isTerminalStage(from)) return false;
  const order: OpportunityStage[] = [OpportunityStage.QUALIFICATION, OpportunityStage.DISCOVERY, OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION, OpportunityStage.RESERVED, OpportunityStage.WON];
  if (to === OpportunityStage.LOST || to === OpportunityStage.DISQUALIFIED) return true;
  return order.indexOf(to) >= order.indexOf(from);
}
