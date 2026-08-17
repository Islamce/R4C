CREATE TYPE "SalesQuotationStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'APPROVED_TO_SEND', 'SENT', 'VIEWED', 'CUSTOMER_ACCEPTED', 'CUSTOMER_DECLINED', 'EXPIRED', 'WITHDRAWN', 'SUPERSEDED');
CREATE TYPE "CustomerDecisionType" AS ENUM ('ACCEPTED', 'DECLINED', 'CLARIFICATION_REQUESTED');
CREATE TYPE "QuotationDeliveryStatus" AS ENUM ('QUEUED', 'DISPATCHED', 'DELIVERED', 'FAILED');

CREATE TABLE "SalesQuotation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationNumber" VARCHAR(48) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "leadId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sourcePriceRevisionId" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "SalesQuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "termsSnapshot" JSONB,
    "priceSnapshot" JSONB,
    "paymentPlanSnapshot" JSONB,
    "customerSnapshot" JSONB,
    "unitSnapshot" JSONB,
    "snapshotChecksum" VARCHAR(128),
    "previewChecksum" VARCHAR(128),
    "renderedDocumentKey" VARCHAR(512),
    "renderedDocumentChecksum" VARCHAR(128),
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedToSendById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedToSendAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalesQuotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationApprovalToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "purpose" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotationApprovalToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "approvalTokenId" TEXT,
    "decision" "CustomerDecisionType" NOT NULL,
    "comment" TEXT,
    "identityEvidence" JSONB,
    "clientMetadata" JSONB,
    "evidenceChecksum" VARCHAR(128),
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "QuotationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "recipientMasked" VARCHAR(320) NOT NULL,
    "providerMessageId" VARCHAR(320),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesQuotation_tenantId_quotationNumber_revision_key" ON "SalesQuotation"("tenantId", "quotationNumber", "revision");
CREATE INDEX "SalesQuotation_tenantId_status_expiresAt_idx" ON "SalesQuotation"("tenantId", "status", "expiresAt");
CREATE INDEX "SalesQuotation_tenantId_leadId_createdAt_idx" ON "SalesQuotation"("tenantId", "leadId", "createdAt");
CREATE INDEX "SalesQuotation_tenantId_customerId_createdAt_idx" ON "SalesQuotation"("tenantId", "customerId", "createdAt");
CREATE INDEX "SalesQuotation_tenantId_unitId_status_idx" ON "SalesQuotation"("tenantId", "unitId", "status");
CREATE UNIQUE INDEX "QuotationApprovalToken_tokenHash_key" ON "QuotationApprovalToken"("tokenHash");
CREATE INDEX "QuotationApprovalToken_tenantId_quotationId_expiresAt_idx" ON "QuotationApprovalToken"("tenantId", "quotationId", "expiresAt");
CREATE INDEX "CustomerDecision_tenantId_quotationId_createdAt_idx" ON "CustomerDecision"("tenantId", "quotationId", "createdAt");
CREATE INDEX "QuotationDelivery_tenantId_quotationId_status_createdAt_idx" ON "QuotationDelivery"("tenantId", "quotationId", "status", "createdAt");

ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_sourcePriceRevisionId_tenantId_fkey" FOREIGN KEY ("sourcePriceRevisionId", "tenantId") REFERENCES "UnitPriceRevision"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_paymentPlanId_tenantId_fkey" FOREIGN KEY ("paymentPlanId", "tenantId") REFERENCES "PaymentPlan"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_approvedToSendById_fkey" FOREIGN KEY ("approvedToSendById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "SalesQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuotationApprovalToken" ADD CONSTRAINT "QuotationApprovalToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuotationApprovalToken" ADD CONSTRAINT "QuotationApprovalToken_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_approvalTokenId_fkey" FOREIGN KEY ("approvalTokenId") REFERENCES "QuotationApprovalToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerDecision" ADD CONSTRAINT "CustomerDecision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuotationDelivery" ADD CONSTRAINT "QuotationDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuotationDelivery" ADD CONSTRAINT "QuotationDelivery_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
