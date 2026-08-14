-- CreateEnum
CREATE TYPE "UnitPriceRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "UnitPriceRevision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "basePriceMinor" BIGINT NOT NULL,
    "listPriceMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" "UnitPriceRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitPriceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlanInstallment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "shareBasisPoints" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMedia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingMedia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMedia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitPriceRevision_tenantId_unitId_status_validFrom_idx" ON "UnitPriceRevision"("tenantId", "unitId", "status", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "UnitPriceRevision_unitId_revision_key" ON "UnitPriceRevision"("unitId", "revision");

-- CreateIndex
CREATE INDEX "PaymentPlan_tenantId_projectId_idx" ON "PaymentPlan"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "PaymentPlanInstallment_tenantId_paymentPlanId_sequence_idx" ON "PaymentPlanInstallment"("tenantId", "paymentPlanId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlanInstallment_paymentPlanId_sequence_key" ON "PaymentPlanInstallment"("paymentPlanId", "sequence");

-- CreateIndex
CREATE INDEX "ProjectMedia_tenantId_projectId_sortOrder_createdAt_idx" ON "ProjectMedia"("tenantId", "projectId", "sortOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMedia_projectId_documentVersionId_key" ON "ProjectMedia"("projectId", "documentVersionId");

-- CreateIndex
CREATE INDEX "BuildingMedia_tenantId_buildingId_sortOrder_createdAt_idx" ON "BuildingMedia"("tenantId", "buildingId", "sortOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingMedia_buildingId_documentVersionId_key" ON "BuildingMedia"("buildingId", "documentVersionId");

-- CreateIndex
CREATE INDEX "UnitMedia_tenantId_unitId_sortOrder_createdAt_idx" ON "UnitMedia"("tenantId", "unitId", "sortOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMedia_unitId_documentVersionId_key" ON "UnitMedia"("unitId", "documentVersionId");

-- AddForeignKey
ALTER TABLE "UnitPriceRevision" ADD CONSTRAINT "UnitPriceRevision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitPriceRevision" ADD CONSTRAINT "UnitPriceRevision_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitPriceRevision" ADD CONSTRAINT "UnitPriceRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlanInstallment" ADD CONSTRAINT "PaymentPlanInstallment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlanInstallment" ADD CONSTRAINT "PaymentPlanInstallment_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingMedia" ADD CONSTRAINT "BuildingMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingMedia" ADD CONSTRAINT "BuildingMedia_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingMedia" ADD CONSTRAINT "BuildingMedia_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMedia" ADD CONSTRAINT "UnitMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMedia" ADD CONSTRAINT "UnitMedia_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMedia" ADD CONSTRAINT "UnitMedia_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

