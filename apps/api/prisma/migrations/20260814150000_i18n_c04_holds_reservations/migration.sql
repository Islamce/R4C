-- CreateEnum
CREATE TYPE "TranslationLocale" AS ENUM ('en', 'ar');

-- CreateEnum
CREATE TYPE "UnitHoldStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'CONVERTED_TO_SALE');

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "locale" "TranslationLocale";

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" VARCHAR(64) NOT NULL,
    "entityId" TEXT NOT NULL,
    "locale" "TranslationLocale" NOT NULL,
    "field" VARCHAR(64) NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitHold" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "UnitHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "holdExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "sourcePriceRevisionId" TEXT NOT NULL,
    "basePriceSnapshotMinor" BIGINT NOT NULL,
    "listPriceSnapshotMinor" BIGINT NOT NULL,
    "reservationAmountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "convertedToSaleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Translation_tenantId_entityType_entityId_field_idx" ON "Translation"("tenantId", "entityType", "entityId", "field");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_tenantId_entityType_entityId_locale_field_key" ON "Translation"("tenantId", "entityType", "entityId", "locale", "field");

-- CreateIndex
CREATE INDEX "UnitHold_tenantId_unitId_status_holdExpiresAt_idx" ON "UnitHold"("tenantId", "unitId", "status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "UnitHold_tenantId_leadId_status_idx" ON "UnitHold"("tenantId", "leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UnitHold_id_tenantId_key" ON "UnitHold"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_holdId_key" ON "Reservation"("holdId");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_unitId_status_idx" ON "Reservation"("tenantId", "unitId", "status");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_leadId_status_idx" ON "Reservation"("tenantId", "leadId", "status");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_customerId_status_idx" ON "Reservation"("tenantId", "customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_id_tenantId_key" ON "Reservation"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_id_tenantId_key" ON "PaymentPlan"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitPriceRevision_id_tenantId_key" ON "UnitPriceRevision"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitHold" ADD CONSTRAINT "UnitHold_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitHold" ADD CONSTRAINT "UnitHold_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitHold" ADD CONSTRAINT "UnitHold_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitHold" ADD CONSTRAINT "UnitHold_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "UnitHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "Unit"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "Lead"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_paymentPlanId_tenantId_fkey" FOREIGN KEY ("paymentPlanId", "tenantId") REFERENCES "PaymentPlan"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sourcePriceRevisionId_tenantId_fkey" FOREIGN KEY ("sourcePriceRevisionId", "tenantId") REFERENCES "UnitPriceRevision"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

