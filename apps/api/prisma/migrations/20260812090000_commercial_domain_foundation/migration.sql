CREATE TYPE "DevelopmentPhaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "UnitStatus" AS ENUM ('DRAFT', 'UNRELEASED', 'AVAILABLE', 'HELD', 'RESERVED', 'SOLD', 'BLOCKED', 'WITHDRAWN');

CREATE TABLE "DevelopmentPhase" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "DevelopmentPhaseStatus" NOT NULL DEFAULT 'DRAFT',
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "launchDate" TIMESTAMP(3),
  "expectedCompletionDate" TIMESTAMP(3),
  "salesOpenAt" TIMESTAMP(3),
  "salesCloseAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DevelopmentPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Building" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "phaseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Floor" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "buildingId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "floorNumber" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UnitType" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bedrooms" INTEGER NOT NULL,
  "bathrooms" INTEGER NOT NULL,
  "defaultArea" DECIMAL(12,2),
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UnitType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "phaseId" TEXT NOT NULL,
  "buildingId" TEXT NOT NULL,
  "floorId" TEXT NOT NULL,
  "unitTypeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "status" "UnitStatus" NOT NULL DEFAULT 'DRAFT',
  "grossArea" DECIMAL(12,2) NOT NULL,
  "netArea" DECIMAL(12,2),
  "bedrooms" INTEGER NOT NULL,
  "bathrooms" INTEGER NOT NULL,
  "orientation" TEXT,
  "view" TEXT,
  "parkingCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Project_id_tenantId_key" ON "Project"("id", "tenantId");
CREATE UNIQUE INDEX "DevelopmentPhase_projectId_code_key" ON "DevelopmentPhase"("projectId", "code");
CREATE UNIQUE INDEX "DevelopmentPhase_id_projectId_tenantId_key" ON "DevelopmentPhase"("id", "projectId", "tenantId");
CREATE INDEX "DevelopmentPhase_tenantId_projectId_status_sequence_idx" ON "DevelopmentPhase"("tenantId", "projectId", "status", "sequence");
CREATE UNIQUE INDEX "Building_projectId_code_key" ON "Building"("projectId", "code");
CREATE UNIQUE INDEX "Building_id_projectId_tenantId_key" ON "Building"("id", "projectId", "tenantId");
CREATE UNIQUE INDEX "Building_id_projectId_phaseId_tenantId_key" ON "Building"("id", "projectId", "phaseId", "tenantId");
CREATE UNIQUE INDEX "Building_id_tenantId_key" ON "Building"("id", "tenantId");
CREATE INDEX "Building_tenantId_projectId_phaseId_idx" ON "Building"("tenantId", "projectId", "phaseId");
CREATE UNIQUE INDEX "Floor_buildingId_code_key" ON "Floor"("buildingId", "code");
CREATE UNIQUE INDEX "Floor_buildingId_floorNumber_key" ON "Floor"("buildingId", "floorNumber");
CREATE UNIQUE INDEX "Floor_id_buildingId_tenantId_key" ON "Floor"("id", "buildingId", "tenantId");
CREATE INDEX "Floor_tenantId_buildingId_sequence_idx" ON "Floor"("tenantId", "buildingId", "sequence");
CREATE UNIQUE INDEX "UnitType_projectId_code_key" ON "UnitType"("projectId", "code");
CREATE UNIQUE INDEX "UnitType_id_projectId_tenantId_key" ON "UnitType"("id", "projectId", "tenantId");
CREATE INDEX "UnitType_tenantId_projectId_idx" ON "UnitType"("tenantId", "projectId");
CREATE UNIQUE INDEX "Unit_projectId_code_key" ON "Unit"("projectId", "code");
CREATE UNIQUE INDEX "Unit_floorId_number_key" ON "Unit"("floorId", "number");
CREATE INDEX "Unit_tenantId_projectId_phaseId_buildingId_floorId_idx" ON "Unit"("tenantId", "projectId", "phaseId", "buildingId", "floorId");
CREATE INDEX "Unit_tenantId_projectId_status_unitTypeId_idx" ON "Unit"("tenantId", "projectId", "status", "unitTypeId");

ALTER TABLE "DevelopmentPhase" ADD CONSTRAINT "DevelopmentPhase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DevelopmentPhase" ADD CONSTRAINT "DevelopmentPhase_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Building" ADD CONSTRAINT "Building_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Building" ADD CONSTRAINT "Building_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Building" ADD CONSTRAINT "Building_phaseId_projectId_tenantId_fkey" FOREIGN KEY ("phaseId", "projectId", "tenantId") REFERENCES "DevelopmentPhase"("id", "projectId", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_tenantId_fkey" FOREIGN KEY ("buildingId", "tenantId") REFERENCES "Building"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitType" ADD CONSTRAINT "UnitType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitType" ADD CONSTRAINT "UnitType_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_projectId_tenantId_fkey" FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_phaseId_projectId_tenantId_fkey" FOREIGN KEY ("phaseId", "projectId", "tenantId") REFERENCES "DevelopmentPhase"("id", "projectId", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_buildingId_projectId_phaseId_tenantId_fkey" FOREIGN KEY ("buildingId", "projectId", "phaseId", "tenantId") REFERENCES "Building"("id", "projectId", "phaseId", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_floorId_buildingId_tenantId_fkey" FOREIGN KEY ("floorId", "buildingId", "tenantId") REFERENCES "Floor"("id", "buildingId", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_unitTypeId_projectId_tenantId_fkey" FOREIGN KEY ("unitTypeId", "projectId", "tenantId") REFERENCES "UnitType"("id", "projectId", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
