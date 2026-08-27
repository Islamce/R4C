-- CreateEnum
CREATE TYPE "SalesTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TransferCaseStatus" AS ENUM ('DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'READY_FOR_AUTHORITY', 'COMPLETED', 'RETURNED');

-- CreateEnum
CREATE TYPE "TransferDocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CommercialDispatchStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "SalesTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "SalesTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SalesTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "status" "TransferCaseStatus" NOT NULL DEFAULT 'DOCUMENTS_PENDING',
    "readiness" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transferCaseId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" "TransferDocumentStatus" NOT NULL DEFAULT 'MISSING',
    "storageKey" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialDispatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "assetIds" JSONB NOT NULL,
    "status" "CommercialDispatchStatus" NOT NULL DEFAULT 'QUEUED',
    "createdById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTask_tenantId_assigneeId_status_dueAt_idx" ON "SalesTask"("tenantId", "assigneeId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "SalesTask_tenantId_projectId_leadId_idx" ON "SalesTask"("tenantId", "projectId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTask_id_tenantId_key" ON "SalesTask"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferCase_reservationId_key" ON "TransferCase"("reservationId");

-- CreateIndex
CREATE INDEX "TransferCase_tenantId_projectId_status_idx" ON "TransferCase"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TransferCase_id_tenantId_key" ON "TransferCase"("id", "tenantId");

-- CreateIndex
CREATE INDEX "TransferDocument_tenantId_transferCaseId_status_idx" ON "TransferDocument"("tenantId", "transferCaseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TransferDocument_transferCaseId_documentType_key" ON "TransferDocument"("transferCaseId", "documentType");

-- CreateIndex
CREATE INDEX "CommercialDispatch_tenantId_projectId_customerId_status_idx" ON "CommercialDispatch"("tenantId", "projectId", "customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialDispatch_id_tenantId_key" ON "CommercialDispatch"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDocument" ADD CONSTRAINT "TransferDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDocument" ADD CONSTRAINT "TransferDocument_transferCaseId_tenantId_fkey" FOREIGN KEY ("transferCaseId", "tenantId") REFERENCES "TransferCase"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDocument" ADD CONSTRAINT "TransferDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDispatch" ADD CONSTRAINT "CommercialDispatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDispatch" ADD CONSTRAINT "CommercialDispatch_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDispatch" ADD CONSTRAINT "CommercialDispatch_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDispatch" ADD CONSTRAINT "CommercialDispatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
