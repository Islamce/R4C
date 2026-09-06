CREATE TABLE "SavedLeadView" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "displayMode" VARCHAR(16) NOT NULL DEFAULT 'split',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "columns" TEXT[] NOT NULL,
    "sortBy" VARCHAR(32) NOT NULL DEFAULT 'updatedAt',
    "sortDirection" VARCHAR(4) NOT NULL DEFAULT 'desc',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedLeadView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedLeadView_tenantId_userId_name_key" ON "SavedLeadView"("tenantId", "userId", "name");
CREATE UNIQUE INDEX "SavedLeadView_id_tenantId_key" ON "SavedLeadView"("id", "tenantId");
CREATE INDEX "SavedLeadView_tenantId_userId_isDefault_idx" ON "SavedLeadView"("tenantId", "userId", "isDefault");
ALTER TABLE "SavedLeadView" ADD CONSTRAINT "SavedLeadView_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedLeadView" ADD CONSTRAINT "SavedLeadView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
