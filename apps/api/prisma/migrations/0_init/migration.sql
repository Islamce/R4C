-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'DENIED', 'FAILURE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('PENDING', 'APPROVED', 'RETURNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BimModelStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "BimJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "BimSpatialType" AS ENUM ('PROJECT', 'SITE', 'BUILDING', 'STOREY', 'SPACE', 'ZONE', 'OTHER');

-- CreateEnum
CREATE TYPE "BimArtifactStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ScheduleDependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CostEntryType" AS ENUM ('COMMITMENT', 'ACTUAL');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MaterialTakeoffStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MaterialTakeoffSource" AS ENUM ('MANUAL', 'BIM', 'SAP');

-- CreateEnum
CREATE TYPE "ProcurementOrderStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "QualityPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "QualityInspectionStatus" AS ENUM ('SCHEDULED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityInspectionResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "QualityFindingType" AS ENUM ('NCR', 'PUNCH', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "QualityFindingSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "QualityFindingStatus" AS ENUM ('OPEN', 'ACTIONED', 'READY_FOR_VERIFICATION', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "QualityActionStatus" AS ENUM ('OPEN', 'COMPLETED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SafetyPermitType" AS ENUM ('HOT_WORK', 'CONFINED_SPACE', 'EXCAVATION', 'LIFTING', 'ELECTRICAL', 'WORK_AT_HEIGHT', 'GENERAL');

-- CreateEnum
CREATE TYPE "SafetyPermitStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SafetyEventType" AS ENUM ('HAZARD', 'OBSERVATION', 'NEAR_MISS', 'INCIDENT');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SafetyEventStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'ACTIONED', 'READY_FOR_CLOSURE', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "SafetyActionStatus" AS ENUM ('OPEN', 'COMPLETED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "CommissioningPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CommissioningTestStatus" AS ENUM ('SCHEDULED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissioningTestResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "HandoverPackageStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "HandoverRequirementStatus" AS ENUM ('MISSING', 'PROVIDED', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("tenantId","userId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeScheduleId" TEXT,
    "activeBudgetId" TEXT,
    "activeMaterialTakeoffId" TEXT,
    "activeQualityPlanId" TEXT,
    "activeCommissioningPlanId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "WbsNode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "plannedFrom" TIMESTAMP(3),
    "plannedTo" TIMESTAMP(3),
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 0,

    CONSTRAINT "WbsNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsNodeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "fromStatus" "WorkflowStatus" NOT NULL,
    "toStatus" "WorkflowStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "outcome" "AuditOutcome" NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "documentType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "revision" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "storageChecksum" TEXT,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "reviewDecision" "ReviewDecision" NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentDistribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "distributedById" TEXT NOT NULL,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimModel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ifcSchema" TEXT,
    "status" "BimModelStatus" NOT NULL DEFAULT 'PENDING',
    "elementCount" INTEGER NOT NULL DEFAULT 0,
    "spatialNodeCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BimModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimProcessingJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bimModelId" TEXT NOT NULL,
    "status" "BimJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BimProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimSpatialNode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bimModelId" TEXT NOT NULL,
    "parentId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "globalId" TEXT,
    "spatialType" "BimSpatialType" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BimSpatialNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimElement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bimModelId" TEXT NOT NULL,
    "spatialNodeId" TEXT,
    "globalId" TEXT NOT NULL,
    "ifcType" TEXT NOT NULL,
    "name" TEXT,
    "tag" TEXT,
    "predefinedType" TEXT,

    CONSTRAINT "BimElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimProperty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "propertySet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "unit" TEXT,

    CONSTRAINT "BimProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimWbsLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "linkedById" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BimWbsLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimGeometryArtifact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bimModelId" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'GLB',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'model/gltf-binary',
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "storageEtag" TEXT,
    "status" "BimArtifactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BimGeometryArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WbsProgressUpdate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "note" TEXT,
    "status" "ProgressStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reportedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,

    CONSTRAINT "WbsProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataDate" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedFinish" TIMESTAMP(3) NOT NULL,
    "weight" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleDependency" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "predecessorActivityId" TEXT NOT NULL,
    "successorActivityId" TEXT NOT NULL,
    "type" "ScheduleDependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "lagDays" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ScheduleDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBudget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "costCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitRate" DECIMAL(18,4) NOT NULL,
    "budgetAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLedgerEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "entryType" "CostEntryType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "category" TEXT,
    "specification" TEXT,
    "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTakeoff" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MaterialTakeoffStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialTakeoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTakeoffLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "takeoffId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "source" "MaterialTakeoffSource" NOT NULL DEFAULT 'MANUAL',
    "sourceReference" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "wastePercent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "requiredQuantity" DECIMAL(18,4) NOT NULL,
    "requiredOn" TIMESTAMP(3),

    CONSTRAINT "MaterialTakeoffLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "vendorCode" TEXT,
    "vendorName" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "ProcurementOrderStatus" NOT NULL DEFAULT 'OPEN',
    "placedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcurementOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementOrderLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procurementOrderId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "materialId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "costLedgerEntryId" TEXT,
    "orderedQuantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "lineAmount" DECIMAL(18,2) NOT NULL,
    "promisedOn" TIMESTAMP(3),

    CONSTRAINT "ProcurementOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "wbsNodeId" TEXT,
    "procurementOrderLineId" TEXT,
    "movementType" "MaterialMovementType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "quantityDelta" DECIMAL(18,4) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "QualityPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityCheckpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "qualityPlanId" TEXT NOT NULL,
    "wbsNodeId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "ifcType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QualityCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "QualityInspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "result" "QualityInspectionResult",
    "notes" TEXT,
    "inspectedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "inspectionId" TEXT,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "type" "QualityFindingType" NOT NULL,
    "severity" "QualityFindingSeverity" NOT NULL,
    "status" "QualityFindingStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "raisedById" TEXT NOT NULL,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "QualityActionStatus" NOT NULL DEFAULT 'OPEN',
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNote" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectionId" TEXT,
    "findingId" TEXT,
    "documentVersionId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "type" "SafetyPermitType" NOT NULL,
    "status" "SafetyPermitStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "controls" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "activatedById" TEXT,
    "closedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "closeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "type" "SafetyEventType" NOT NULL,
    "severity" "SafetySeverity" NOT NULL,
    "status" "SafetyEventStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "reportedById" TEXT NOT NULL,
    "investigatedById" TEXT,
    "closedById" TEXT,
    "investigationAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "immediateActions" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "safetyEventId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "SafetyActionStatus" NOT NULL DEFAULT 'OPEN',
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNote" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "safetyPermitId" TEXT,
    "safetyEventId" TEXT,
    "documentVersionId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissioningPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CommissioningPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissioningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissioningCheckpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commissioningPlanId" TEXT NOT NULL,
    "wbsNodeId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "ifcType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommissioningCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissioningTest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "CommissioningTestStatus" NOT NULL DEFAULT 'SCHEDULED',
    "result" "CommissioningTestResult",
    "readings" JSONB,
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissioningTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissioningEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commissioningTestId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissioningEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverPackage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "bimElementId" TEXT,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "status" "HandoverPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "handoverPackageId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" "HandoverRequirementStatus" NOT NULL DEFAULT 'MISSING',
    "documentVersionId" TEXT,
    "providedById" TEXT,
    "providedAt" TIMESTAMP(3),
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HandoverRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_code_key" ON "Role"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "TenantMembership_roleId_idx" ON "TenantMembership"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_activeScheduleId_key" ON "Project"("activeScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_activeBudgetId_key" ON "Project"("activeBudgetId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_activeMaterialTakeoffId_key" ON "Project"("activeMaterialTakeoffId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_activeQualityPlanId_key" ON "Project"("activeQualityPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_activeCommissioningPlanId_key" ON "Project"("activeCommissioningPlanId");

-- CreateIndex
CREATE INDEX "Project_tenantId_status_idx" ON "Project"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_tenantId_code_key" ON "Project"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "WbsNode_tenantId_projectId_parentId_idx" ON "WbsNode"("tenantId", "projectId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "WbsNode_projectId_code_key" ON "WbsNode"("projectId", "code");

-- CreateIndex
CREATE INDEX "WorkItem_tenantId_projectId_workflowStatus_idx" ON "WorkItem"("tenantId", "projectId", "workflowStatus");

-- CreateIndex
CREATE INDEX "WorkflowTransition_tenantId_workItemId_createdAt_idx" ON "WorkflowTransition"("tenantId", "workItemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_tenantId_idx" ON "RefreshToken"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_entityType_entityId_idx" ON "AuditEvent"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_currentVersionId_key" ON "Document"("currentVersionId");

-- CreateIndex
CREATE INDEX "Document_tenantId_projectId_status_idx" ON "Document"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Document_projectId_code_key" ON "Document"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_storageKey_key" ON "DocumentVersion"("storageKey");

-- CreateIndex
CREATE INDEX "DocumentVersion_tenantId_documentId_createdAt_idx" ON "DocumentVersion"("tenantId", "documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "DocumentComment_tenantId_versionId_createdAt_idx" ON "DocumentComment"("tenantId", "versionId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReview_tenantId_decision_decidedAt_idx" ON "DocumentReview"("tenantId", "decision", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentReview_versionId_reviewerId_key" ON "DocumentReview"("versionId", "reviewerId");

-- CreateIndex
CREATE INDEX "DocumentDistribution_tenantId_versionId_distributedAt_idx" ON "DocumentDistribution"("tenantId", "versionId", "distributedAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_tenantId_status_createdAt_idx" ON "NotificationOutbox"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BimModel_documentVersionId_key" ON "BimModel"("documentVersionId");

-- CreateIndex
CREATE INDEX "BimModel_tenantId_projectId_status_idx" ON "BimModel"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "BimProcessingJob_tenantId_status_createdAt_idx" ON "BimProcessingJob"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BimProcessingJob_bimModelId_createdAt_idx" ON "BimProcessingJob"("bimModelId", "createdAt");

-- CreateIndex
CREATE INDEX "BimSpatialNode_tenantId_bimModelId_parentId_idx" ON "BimSpatialNode"("tenantId", "bimModelId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BimSpatialNode_bimModelId_sourceKey_key" ON "BimSpatialNode"("bimModelId", "sourceKey");

-- CreateIndex
CREATE INDEX "BimElement_tenantId_bimModelId_ifcType_idx" ON "BimElement"("tenantId", "bimModelId", "ifcType");

-- CreateIndex
CREATE INDEX "BimElement_spatialNodeId_idx" ON "BimElement"("spatialNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BimElement_bimModelId_globalId_key" ON "BimElement"("bimModelId", "globalId");

-- CreateIndex
CREATE INDEX "BimProperty_tenantId_propertySet_name_idx" ON "BimProperty"("tenantId", "propertySet", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BimProperty_elementId_propertySet_name_key" ON "BimProperty"("elementId", "propertySet", "name");

-- CreateIndex
CREATE INDEX "BimWbsLink_tenantId_wbsNodeId_idx" ON "BimWbsLink"("tenantId", "wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BimWbsLink_elementId_wbsNodeId_key" ON "BimWbsLink"("elementId", "wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BimGeometryArtifact_bimModelId_key" ON "BimGeometryArtifact"("bimModelId");

-- CreateIndex
CREATE UNIQUE INDEX "BimGeometryArtifact_storageKey_key" ON "BimGeometryArtifact"("storageKey");

-- CreateIndex
CREATE INDEX "BimGeometryArtifact_tenantId_status_idx" ON "BimGeometryArtifact"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WbsProgressUpdate_tenantId_wbsNodeId_status_reportedAt_idx" ON "WbsProgressUpdate"("tenantId", "wbsNodeId", "status", "reportedAt");

-- CreateIndex
CREATE INDEX "ProjectSchedule_tenantId_projectId_status_idx" ON "ProjectSchedule"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_projectId_revision_key" ON "ProjectSchedule"("projectId", "revision");

-- CreateIndex
CREATE INDEX "ScheduleActivity_tenantId_scheduleId_plannedStart_plannedFi_idx" ON "ScheduleActivity"("tenantId", "scheduleId", "plannedStart", "plannedFinish");

-- CreateIndex
CREATE INDEX "ScheduleActivity_wbsNodeId_idx" ON "ScheduleActivity"("wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleActivity_scheduleId_externalId_key" ON "ScheduleActivity"("scheduleId", "externalId");

-- CreateIndex
CREATE INDEX "ScheduleDependency_tenantId_scheduleId_idx" ON "ScheduleDependency"("tenantId", "scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleDependency_successorActivityId_idx" ON "ScheduleDependency"("successorActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDependency_scheduleId_predecessorActivityId_success_key" ON "ScheduleDependency"("scheduleId", "predecessorActivityId", "successorActivityId", "type");

-- CreateIndex
CREATE INDEX "ProjectBudget_tenantId_projectId_status_idx" ON "ProjectBudget"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBudget_projectId_revision_key" ON "ProjectBudget"("projectId", "revision");

-- CreateIndex
CREATE INDEX "BudgetLine_tenantId_budgetId_wbsNodeId_idx" ON "BudgetLine"("tenantId", "budgetId", "wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_budgetId_costCode_wbsNodeId_key" ON "BudgetLine"("budgetId", "costCode", "wbsNodeId");

-- CreateIndex
CREATE INDEX "CostLedgerEntry_tenantId_projectId_entryType_occurredAt_idx" ON "CostLedgerEntry"("tenantId", "projectId", "entryType", "occurredAt");

-- CreateIndex
CREATE INDEX "CostLedgerEntry_wbsNodeId_occurredAt_idx" ON "CostLedgerEntry"("wbsNodeId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CostLedgerEntry_projectId_entryType_externalId_key" ON "CostLedgerEntry"("projectId", "entryType", "externalId");

-- CreateIndex
CREATE INDEX "Material_tenantId_status_description_idx" ON "Material"("tenantId", "status", "description");

-- CreateIndex
CREATE UNIQUE INDEX "Material_tenantId_code_key" ON "Material"("tenantId", "code");

-- CreateIndex
CREATE INDEX "MaterialTakeoff_tenantId_projectId_status_idx" ON "MaterialTakeoff"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialTakeoff_projectId_revision_key" ON "MaterialTakeoff"("projectId", "revision");

-- CreateIndex
CREATE INDEX "MaterialTakeoffLine_tenantId_takeoffId_materialId_idx" ON "MaterialTakeoffLine"("tenantId", "takeoffId", "materialId");

-- CreateIndex
CREATE INDEX "MaterialTakeoffLine_wbsNodeId_requiredOn_idx" ON "MaterialTakeoffLine"("wbsNodeId", "requiredOn");

-- CreateIndex
CREATE INDEX "MaterialTakeoffLine_bimElementId_idx" ON "MaterialTakeoffLine"("bimElementId");

-- CreateIndex
CREATE INDEX "ProcurementOrder_tenantId_projectId_status_placedAt_idx" ON "ProcurementOrder"("tenantId", "projectId", "status", "placedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementOrder_projectId_externalId_key" ON "ProcurementOrder"("projectId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementOrderLine_costLedgerEntryId_key" ON "ProcurementOrderLine"("costLedgerEntryId");

-- CreateIndex
CREATE INDEX "ProcurementOrderLine_tenantId_materialId_promisedOn_idx" ON "ProcurementOrderLine"("tenantId", "materialId", "promisedOn");

-- CreateIndex
CREATE INDEX "ProcurementOrderLine_wbsNodeId_idx" ON "ProcurementOrderLine"("wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementOrderLine_procurementOrderId_lineNumber_key" ON "ProcurementOrderLine"("procurementOrderId", "lineNumber");

-- CreateIndex
CREATE INDEX "InventoryLocation_tenantId_projectId_isActive_idx" ON "InventoryLocation"("tenantId", "projectId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_projectId_code_key" ON "InventoryLocation"("projectId", "code");

-- CreateIndex
CREATE INDEX "MaterialMovement_tenantId_projectId_materialId_occurredAt_idx" ON "MaterialMovement"("tenantId", "projectId", "materialId", "occurredAt");

-- CreateIndex
CREATE INDEX "MaterialMovement_locationId_materialId_occurredAt_idx" ON "MaterialMovement"("locationId", "materialId", "occurredAt");

-- CreateIndex
CREATE INDEX "MaterialMovement_procurementOrderLineId_idx" ON "MaterialMovement"("procurementOrderLineId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialMovement_projectId_externalId_key" ON "MaterialMovement"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "QualityPlan_tenantId_projectId_status_idx" ON "QualityPlan"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QualityPlan_projectId_revision_key" ON "QualityPlan"("projectId", "revision");

-- CreateIndex
CREATE INDEX "QualityCheckpoint_tenantId_qualityPlanId_sortOrder_idx" ON "QualityCheckpoint"("tenantId", "qualityPlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "QualityCheckpoint_wbsNodeId_idx" ON "QualityCheckpoint"("wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityCheckpoint_qualityPlanId_code_key" ON "QualityCheckpoint"("qualityPlanId", "code");

-- CreateIndex
CREATE INDEX "QualityInspection_tenantId_projectId_status_scheduledFor_idx" ON "QualityInspection"("tenantId", "projectId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "QualityInspection_checkpointId_status_idx" ON "QualityInspection"("checkpointId", "status");

-- CreateIndex
CREATE INDEX "QualityInspection_wbsNodeId_idx" ON "QualityInspection"("wbsNodeId");

-- CreateIndex
CREATE INDEX "QualityInspection_bimElementId_idx" ON "QualityInspection"("bimElementId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_projectId_externalId_key" ON "QualityInspection"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "QualityFinding_tenantId_projectId_status_severity_idx" ON "QualityFinding"("tenantId", "projectId", "status", "severity");

-- CreateIndex
CREATE INDEX "QualityFinding_inspectionId_idx" ON "QualityFinding"("inspectionId");

-- CreateIndex
CREATE INDEX "QualityFinding_wbsNodeId_status_idx" ON "QualityFinding"("wbsNodeId", "status");

-- CreateIndex
CREATE INDEX "QualityFinding_bimElementId_status_idx" ON "QualityFinding"("bimElementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QualityFinding_projectId_externalId_key" ON "QualityFinding"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "QualityAction_tenantId_findingId_status_idx" ON "QualityAction"("tenantId", "findingId", "status");

-- CreateIndex
CREATE INDEX "QualityAction_assignedToId_status_dueAt_idx" ON "QualityAction"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "QualityEvidence_tenantId_inspectionId_idx" ON "QualityEvidence"("tenantId", "inspectionId");

-- CreateIndex
CREATE INDEX "QualityEvidence_tenantId_findingId_idx" ON "QualityEvidence"("tenantId", "findingId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityEvidence_inspectionId_documentVersionId_key" ON "QualityEvidence"("inspectionId", "documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityEvidence_findingId_documentVersionId_key" ON "QualityEvidence"("findingId", "documentVersionId");

-- CreateIndex
CREATE INDEX "SafetyPermit_tenantId_projectId_status_validUntil_idx" ON "SafetyPermit"("tenantId", "projectId", "status", "validUntil");

-- CreateIndex
CREATE INDEX "SafetyPermit_wbsNodeId_status_idx" ON "SafetyPermit"("wbsNodeId", "status");

-- CreateIndex
CREATE INDEX "SafetyPermit_bimElementId_status_idx" ON "SafetyPermit"("bimElementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermit_projectId_externalId_key" ON "SafetyPermit"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "SafetyEvent_tenantId_projectId_status_severity_idx" ON "SafetyEvent"("tenantId", "projectId", "status", "severity");

-- CreateIndex
CREATE INDEX "SafetyEvent_wbsNodeId_status_idx" ON "SafetyEvent"("wbsNodeId", "status");

-- CreateIndex
CREATE INDEX "SafetyEvent_bimElementId_status_idx" ON "SafetyEvent"("bimElementId", "status");

-- CreateIndex
CREATE INDEX "SafetyEvent_occurredAt_idx" ON "SafetyEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyEvent_projectId_externalId_key" ON "SafetyEvent"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "SafetyAction_tenantId_safetyEventId_status_idx" ON "SafetyAction"("tenantId", "safetyEventId", "status");

-- CreateIndex
CREATE INDEX "SafetyAction_assignedToId_status_dueAt_idx" ON "SafetyAction"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "SafetyEvidence_tenantId_safetyPermitId_idx" ON "SafetyEvidence"("tenantId", "safetyPermitId");

-- CreateIndex
CREATE INDEX "SafetyEvidence_tenantId_safetyEventId_idx" ON "SafetyEvidence"("tenantId", "safetyEventId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyEvidence_safetyPermitId_documentVersionId_key" ON "SafetyEvidence"("safetyPermitId", "documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyEvidence_safetyEventId_documentVersionId_key" ON "SafetyEvidence"("safetyEventId", "documentVersionId");

-- CreateIndex
CREATE INDEX "CommissioningPlan_tenantId_projectId_status_idx" ON "CommissioningPlan"("tenantId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommissioningPlan_projectId_revision_key" ON "CommissioningPlan"("projectId", "revision");

-- CreateIndex
CREATE INDEX "CommissioningCheckpoint_tenantId_commissioningPlanId_sortOr_idx" ON "CommissioningCheckpoint"("tenantId", "commissioningPlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "CommissioningCheckpoint_wbsNodeId_idx" ON "CommissioningCheckpoint"("wbsNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissioningCheckpoint_commissioningPlanId_code_key" ON "CommissioningCheckpoint"("commissioningPlanId", "code");

-- CreateIndex
CREATE INDEX "CommissioningTest_tenantId_projectId_status_scheduledFor_idx" ON "CommissioningTest"("tenantId", "projectId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "CommissioningTest_checkpointId_status_idx" ON "CommissioningTest"("checkpointId", "status");

-- CreateIndex
CREATE INDEX "CommissioningTest_wbsNodeId_status_idx" ON "CommissioningTest"("wbsNodeId", "status");

-- CreateIndex
CREATE INDEX "CommissioningTest_bimElementId_status_idx" ON "CommissioningTest"("bimElementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommissioningTest_projectId_externalId_key" ON "CommissioningTest"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "CommissioningEvidence_tenantId_commissioningTestId_idx" ON "CommissioningEvidence"("tenantId", "commissioningTestId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissioningEvidence_commissioningTestId_documentVersionId_key" ON "CommissioningEvidence"("commissioningTestId", "documentVersionId");

-- CreateIndex
CREATE INDEX "HandoverPackage_tenantId_projectId_status_idx" ON "HandoverPackage"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "HandoverPackage_wbsNodeId_status_idx" ON "HandoverPackage"("wbsNodeId", "status");

-- CreateIndex
CREATE INDEX "HandoverPackage_bimElementId_status_idx" ON "HandoverPackage"("bimElementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverPackage_projectId_externalId_key" ON "HandoverPackage"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "HandoverRequirement_tenantId_handoverPackageId_status_idx" ON "HandoverRequirement"("tenantId", "handoverPackageId", "status");

-- CreateIndex
CREATE INDEX "HandoverRequirement_documentVersionId_idx" ON "HandoverRequirement"("documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverRequirement_handoverPackageId_code_key" ON "HandoverRequirement"("handoverPackageId", "code");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_activeScheduleId_fkey" FOREIGN KEY ("activeScheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_activeBudgetId_fkey" FOREIGN KEY ("activeBudgetId") REFERENCES "ProjectBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_activeMaterialTakeoffId_fkey" FOREIGN KEY ("activeMaterialTakeoffId") REFERENCES "MaterialTakeoff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_activeQualityPlanId_fkey" FOREIGN KEY ("activeQualityPlanId") REFERENCES "QualityPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_activeCommissioningPlanId_fkey" FOREIGN KEY ("activeCommissioningPlanId") REFERENCES "CommissioningPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WbsNode" ADD CONSTRAINT "WbsNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WbsNode" ADD CONSTRAINT "WbsNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentDistribution" ADD CONSTRAINT "DocumentDistribution_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentDistribution" ADD CONSTRAINT "DocumentDistribution_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimModel" ADD CONSTRAINT "BimModel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimModel" ADD CONSTRAINT "BimModel_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimProcessingJob" ADD CONSTRAINT "BimProcessingJob_bimModelId_fkey" FOREIGN KEY ("bimModelId") REFERENCES "BimModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimSpatialNode" ADD CONSTRAINT "BimSpatialNode_bimModelId_fkey" FOREIGN KEY ("bimModelId") REFERENCES "BimModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimSpatialNode" ADD CONSTRAINT "BimSpatialNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BimSpatialNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimElement" ADD CONSTRAINT "BimElement_bimModelId_fkey" FOREIGN KEY ("bimModelId") REFERENCES "BimModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimElement" ADD CONSTRAINT "BimElement_spatialNodeId_fkey" FOREIGN KEY ("spatialNodeId") REFERENCES "BimSpatialNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimProperty" ADD CONSTRAINT "BimProperty_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "BimElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimWbsLink" ADD CONSTRAINT "BimWbsLink_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "BimElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimWbsLink" ADD CONSTRAINT "BimWbsLink_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimWbsLink" ADD CONSTRAINT "BimWbsLink_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimGeometryArtifact" ADD CONSTRAINT "BimGeometryArtifact_bimModelId_fkey" FOREIGN KEY ("bimModelId") REFERENCES "BimModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WbsProgressUpdate" ADD CONSTRAINT "WbsProgressUpdate_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WbsProgressUpdate" ADD CONSTRAINT "WbsProgressUpdate_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WbsProgressUpdate" ADD CONSTRAINT "WbsProgressUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleActivity" ADD CONSTRAINT "ScheduleActivity_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleActivity" ADD CONSTRAINT "ScheduleActivity_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDependency" ADD CONSTRAINT "ScheduleDependency_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDependency" ADD CONSTRAINT "ScheduleDependency_predecessorActivityId_fkey" FOREIGN KEY ("predecessorActivityId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDependency" ADD CONSTRAINT "ScheduleDependency_successorActivityId_fkey" FOREIGN KEY ("successorActivityId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "ProjectBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLedgerEntry" ADD CONSTRAINT "CostLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLedgerEntry" ADD CONSTRAINT "CostLedgerEntry_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLedgerEntry" ADD CONSTRAINT "CostLedgerEntry_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLedgerEntry" ADD CONSTRAINT "CostLedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoff" ADD CONSTRAINT "MaterialTakeoff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoff" ADD CONSTRAINT "MaterialTakeoff_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoffLine" ADD CONSTRAINT "MaterialTakeoffLine_takeoffId_fkey" FOREIGN KEY ("takeoffId") REFERENCES "MaterialTakeoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoffLine" ADD CONSTRAINT "MaterialTakeoffLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoffLine" ADD CONSTRAINT "MaterialTakeoffLine_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeoffLine" ADD CONSTRAINT "MaterialTakeoffLine_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrder" ADD CONSTRAINT "ProcurementOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrder" ADD CONSTRAINT "ProcurementOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrderLine" ADD CONSTRAINT "ProcurementOrderLine_procurementOrderId_fkey" FOREIGN KEY ("procurementOrderId") REFERENCES "ProcurementOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrderLine" ADD CONSTRAINT "ProcurementOrderLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrderLine" ADD CONSTRAINT "ProcurementOrderLine_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrderLine" ADD CONSTRAINT "ProcurementOrderLine_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementOrderLine" ADD CONSTRAINT "ProcurementOrderLine_costLedgerEntryId_fkey" FOREIGN KEY ("costLedgerEntryId") REFERENCES "CostLedgerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_procurementOrderLineId_fkey" FOREIGN KEY ("procurementOrderLineId") REFERENCES "ProcurementOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityPlan" ADD CONSTRAINT "QualityPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityPlan" ADD CONSTRAINT "QualityPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheckpoint" ADD CONSTRAINT "QualityCheckpoint_qualityPlanId_fkey" FOREIGN KEY ("qualityPlanId") REFERENCES "QualityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheckpoint" ADD CONSTRAINT "QualityCheckpoint_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "QualityCheckpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "QualityInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFinding" ADD CONSTRAINT "QualityFinding_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "QualityFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityEvidence" ADD CONSTRAINT "QualityEvidence_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "QualityInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityEvidence" ADD CONSTRAINT "QualityEvidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "QualityFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityEvidence" ADD CONSTRAINT "QualityEvidence_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityEvidence" ADD CONSTRAINT "QualityEvidence_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermit" ADD CONSTRAINT "SafetyPermit_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_investigatedById_fkey" FOREIGN KEY ("investigatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAction" ADD CONSTRAINT "SafetyAction_safetyEventId_fkey" FOREIGN KEY ("safetyEventId") REFERENCES "SafetyEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAction" ADD CONSTRAINT "SafetyAction_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAction" ADD CONSTRAINT "SafetyAction_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAction" ADD CONSTRAINT "SafetyAction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvidence" ADD CONSTRAINT "SafetyEvidence_safetyPermitId_fkey" FOREIGN KEY ("safetyPermitId") REFERENCES "SafetyPermit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvidence" ADD CONSTRAINT "SafetyEvidence_safetyEventId_fkey" FOREIGN KEY ("safetyEventId") REFERENCES "SafetyEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvidence" ADD CONSTRAINT "SafetyEvidence_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEvidence" ADD CONSTRAINT "SafetyEvidence_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningPlan" ADD CONSTRAINT "CommissioningPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningPlan" ADD CONSTRAINT "CommissioningPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningCheckpoint" ADD CONSTRAINT "CommissioningCheckpoint_commissioningPlanId_fkey" FOREIGN KEY ("commissioningPlanId") REFERENCES "CommissioningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningCheckpoint" ADD CONSTRAINT "CommissioningCheckpoint_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "CommissioningCheckpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningEvidence" ADD CONSTRAINT "CommissioningEvidence_commissioningTestId_fkey" FOREIGN KEY ("commissioningTestId") REFERENCES "CommissioningTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningEvidence" ADD CONSTRAINT "CommissioningEvidence_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningEvidence" ADD CONSTRAINT "CommissioningEvidence_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPackage" ADD CONSTRAINT "HandoverPackage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPackage" ADD CONSTRAINT "HandoverPackage_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPackage" ADD CONSTRAINT "HandoverPackage_bimElementId_fkey" FOREIGN KEY ("bimElementId") REFERENCES "BimElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPackage" ADD CONSTRAINT "HandoverPackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverPackage" ADD CONSTRAINT "HandoverPackage_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverRequirement" ADD CONSTRAINT "HandoverRequirement_handoverPackageId_fkey" FOREIGN KEY ("handoverPackageId") REFERENCES "HandoverPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverRequirement" ADD CONSTRAINT "HandoverRequirement_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverRequirement" ADD CONSTRAINT "HandoverRequirement_providedById_fkey" FOREIGN KEY ("providedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
