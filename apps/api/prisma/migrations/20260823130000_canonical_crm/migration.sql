-- Canonical R4C CRM: additive Contact, Opportunity, Activity, Task, Quotation, Revision, and CustomerDecision domain.
-- No existing table or column is dropped or rewritten.

CREATE TYPE "ContactCommunicationPreference" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP', 'SMS', 'NONE');
CREATE TYPE "OpportunityStage" AS ENUM ('QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'RESERVED', 'WON', 'LOST', 'DISQUALIFIED');
CREATE TYPE "CrmActivityType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'SITE_VISIT', 'NOTE', 'STATUS_CHANGE', 'QUOTATION_SENT', 'CUSTOMER_DECISION');
CREATE TYPE "CrmTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CrmTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'APPROVAL_PENDING', 'APPROVED', 'SENT', 'REVISION_REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "QuotationRevisionStatus" AS ENUM ('DRAFT', 'APPROVAL_PENDING', 'APPROVED', 'SENT', 'SUPERSEDED', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "CustomerDecisionStatus" AS ENUM ('ACCEPTED', 'DECLINED', 'EXPIRED', 'REVISION_REQUESTED');

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "leadId" TEXT,
    "ownerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "emailNormalized" TEXT,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "communicationPreference" "ContactCommunicationPreference" NOT NULL DEFAULT 'PHONE',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "contactId" TEXT,
    "projectId" TEXT,
    "unitId" TEXT,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'QUALIFICATION',
    "expectedValueMinor" BIGINT,
    "currency" VARCHAR(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "notes" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "quotationId" TEXT,
    "reservationId" TEXT,
    "projectId" TEXT,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CrmTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "quotationId" TEXT,
    "reservationId" TEXT,
    "projectId" TEXT,
    "unitId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "projectId" TEXT,
    "unitId" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "QuotationRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationRevisionId" TEXT NOT NULL,
    "status" "CustomerDecisionStatus" NOT NULL,
    "decidedById" TEXT,
    "note" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contact_tenantId_emailNormalized_key" ON "Contact"("tenantId", "emailNormalized");
CREATE UNIQUE INDEX "Contact_tenantId_phoneNormalized_key" ON "Contact"("tenantId", "phoneNormalized");
CREATE UNIQUE INDEX "Contact_id_tenantId_key" ON "Contact"("id", "tenantId");
CREATE UNIQUE INDEX "Opportunity_id_tenantId_key" ON "Opportunity"("id", "tenantId");
CREATE UNIQUE INDEX "Quotation_id_tenantId_key" ON "Quotation"("id", "tenantId");
CREATE UNIQUE INDEX "QuotationRevision_quotationId_revision_key" ON "QuotationRevision"("quotationId", "revision");
CREATE UNIQUE INDEX "QuotationRevision_id_tenantId_key" ON "QuotationRevision"("id", "tenantId");
CREATE UNIQUE INDEX "CustomerDecision_quotationRevisionId_key" ON "CustomerDecision"("quotationRevisionId");
CREATE UNIQUE INDEX "CustomerDecision_id_tenantId_key" ON "CustomerDecision"("id", "tenantId");

CREATE INDEX "Contact_tenantId_customerId_createdAt_idx" ON "Contact"("tenantId", "customerId", "createdAt");
CREATE INDEX "Contact_tenantId_leadId_createdAt_idx" ON "Contact"("tenantId", "leadId", "createdAt");
CREATE INDEX "Opportunity_tenantId_ownerId_stage_updatedAt_idx" ON "Opportunity"("tenantId", "ownerId", "stage", "updatedAt");
CREATE INDEX "Opportunity_tenantId_customerId_stage_idx" ON "Opportunity"("tenantId", "customerId", "stage");
CREATE INDEX "Opportunity_tenantId_projectId_unitId_idx" ON "Opportunity"("tenantId", "projectId", "unitId");
CREATE INDEX "CrmActivity_tenantId_contactId_createdAt_idx" ON "CrmActivity"("tenantId", "contactId", "createdAt");
CREATE INDEX "CrmActivity_tenantId_leadId_createdAt_idx" ON "CrmActivity"("tenantId", "leadId", "createdAt");
CREATE INDEX "CrmActivity_tenantId_opportunityId_createdAt_idx" ON "CrmActivity"("tenantId", "opportunityId", "createdAt");
CREATE INDEX "CrmTask_tenantId_assigneeId_status_dueAt_idx" ON "CrmTask"("tenantId", "assigneeId", "status", "dueAt");
CREATE INDEX "CrmTask_tenantId_opportunityId_status_idx" ON "CrmTask"("tenantId", "opportunityId", "status");
CREATE INDEX "Quotation_tenantId_opportunityId_status_idx" ON "Quotation"("tenantId", "opportunityId", "status");
CREATE INDEX "Quotation_tenantId_leadId_status_idx" ON "Quotation"("tenantId", "leadId", "status");
CREATE INDEX "QuotationRevision_tenantId_quotationId_status_idx" ON "QuotationRevision"("tenantId", "quotationId", "status");
CREATE INDEX "CustomerDecision_tenantId_quotationRevisionId_status_idx" ON "CustomerDecision"("tenantId", "quotationRevisionId", "status");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "Contact"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "Contact"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_opportunityId_tenantId_fkey" FOREIGN KEY ("opportunityId", "tenantId") REFERENCES "Opportunity"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_quotationId_tenantId_fkey" FOREIGN KEY ("quotationId", "tenantId") REFERENCES "Quotation"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_reservationId_tenantId_fkey" FOREIGN KEY ("reservationId", "tenantId") REFERENCES "Reservation"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "Contact"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_opportunityId_tenantId_fkey" FOREIGN KEY ("opportunityId", "tenantId") REFERENCES "Opportunity"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_quotationId_tenantId_fkey" FOREIGN KEY ("quotationId", "tenantId") REFERENCES "Quotation"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_reservationId_tenantId_fkey" FOREIGN KEY ("reservationId", "tenantId") REFERENCES "Reservation"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_opportunityId_tenantId_fkey" FOREIGN KEY ("opportunityId", "tenantId") REFERENCES "Opportunity"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_quotationId_tenantId_fkey" FOREIGN KEY ("quotationId", "tenantId") REFERENCES "Quotation"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_quotationRevisionId_tenantId_fkey" FOREIGN KEY ("quotationRevisionId", "tenantId") REFERENCES "QuotationRevision"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
