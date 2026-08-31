-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNormalized" VARCHAR(32) NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneVerification_tenantId_phoneNormalized_createdAt_idx" ON "PhoneVerification"("tenantId", "phoneNormalized", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerification_expiresAt_idx" ON "PhoneVerification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneVerification_id_tenantId_key" ON "PhoneVerification"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
