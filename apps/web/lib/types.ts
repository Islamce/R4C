import type { ProjectSummary } from "../../../packages/contracts/src/index";

export type ProjectStatus = ProjectSummary["status"] | "ARCHIVED";

export interface ProjectRecord extends Omit<ProjectSummary, "status"> {
  status: ProjectStatus;
  description: string | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    wbsNodes: number;
    workItems: number;
  };
}

export interface WbsNodeRecord {
  id: string;
  tenantId: string;
  projectId: string;
  parentId: string | null;
  code: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    children: number;
    workItems: number;
    bimLinks: number;
  };
  progressUpdates: Array<{
    percent: string;
    reportedAt: string;
  }>;
}

export interface ProjectDetailPayload {
  project: ProjectRecord;
  wbs: WbsNodeRecord[];
}

export type ProgressStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ProgressActor {
  id: string;
  displayName: string;
}

export interface WbsProgressUpdateRecord {
  id: string;
  tenantId: string;
  wbsNodeId: string;
  percent: string;
  note: string | null;
  status: ProgressStatus;
  reportedById: string;
  reviewedById: string | null;
  reportedAt: string;
  reviewedAt: string | null;
  reviewComment: string | null;
  reportedBy: ProgressActor;
  reviewedBy: ProgressActor | null;
}

export interface SubmitProgressPayload {
  percent: number;
  note?: string;
}

export interface ReviewProgressPayload {
  decision: "APPROVED" | "REJECTED";
  comment?: string;
}

export type MoneyString = string;

export interface CostControlBudget {
  id: string;
  name: string;
  revision: string;
  currency: string;
}

export interface CostControlSummary {
  budgetAtCompletion: MoneyString;
  plannedValue: MoneyString;
  earnedValue: MoneyString;
  actualCost: MoneyString;
  commitments: MoneyString;
  forecastExposure: MoneyString;
  costVariance: MoneyString;
  scheduleVariance: MoneyString;
  cpi: number | null;
  spi: number | null;
  estimateAtCompletion: MoneyString | null;
  estimateToComplete: MoneyString | null;
  varianceAtCompletion: MoneyString | null;
}

export interface CostControlNode {
  wbsNodeId: string;
  code: string;
  name: string;
  budget: MoneyString;
  plannedProgress: number;
  actualProgress: number;
  plannedValue: MoneyString;
  earnedValue: MoneyString;
  committed: MoneyString;
  actualCost: MoneyString;
  costVariance: MoneyString;
  scheduleVariance: MoneyString;
  forecastExposure: MoneyString;
}

export interface CostControlResponse {
  budget: CostControlBudget | null;
  asOf: string;
  summary: CostControlSummary | null;
  nodes: CostControlNode[];
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: SessionUser;
}
