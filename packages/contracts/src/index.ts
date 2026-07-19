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
