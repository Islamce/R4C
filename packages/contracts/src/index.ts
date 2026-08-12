export type ProjectStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

export interface ProjectSummary {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: ProjectStatus;
}

export type WorkflowStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RETURNED"
  | "APPROVED"
  | "COMPLETED";

export type DevelopmentPhaseStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export type UnitStatus =
  | "DRAFT"
  | "UNRELEASED"
  | "AVAILABLE"
  | "HELD"
  | "RESERVED"
  | "SOLD"
  | "BLOCKED"
  | "WITHDRAWN";

export interface CommercialPhaseSummary {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  name: string;
  status: DevelopmentPhaseStatus;
  sequence: number;
}

export interface CommercialUnitSummary {
  id: string;
  tenantId: string;
  projectId: string;
  phaseId: string;
  buildingId: string;
  floorId: string;
  unitTypeId: string;
  code: string;
  number: string;
  status: UnitStatus;
  grossArea: string;
  netArea: string | null;
  bedrooms: number;
  bathrooms: number;
  parkingCount: number;
}

export interface CommercialUnitSearch {
  projectId: string;
  phaseId?: string;
  buildingId?: string;
  floorId?: string;
  unitTypeId?: string;
  status?: UnitStatus;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: string;
  maxArea?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
