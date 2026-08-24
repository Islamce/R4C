import { clientApi } from "./client-api";

export type OpportunityStage = "QUALIFICATION" | "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "RESERVED" | "WON" | "LOST" | "DISQUALIFIED";
export type CrmActivityType = "CALL" | "EMAIL" | "WHATSAPP" | "MEETING" | "SITE_VISIT" | "NOTE" | "STATUS_CHANGE" | "QUOTATION_SENT" | "CUSTOMER_DECISION";
export type CrmTaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type CrmTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type QuotationRevisionStatus = "DRAFT" | "APPROVAL_PENDING" | "APPROVED" | "SENT" | "SUPERSEDED" | "ACCEPTED" | "DECLINED" | "EXPIRED";
export type CustomerDecisionStatus = "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVISION_REQUESTED";

export interface CrmContact {
  id: string;
  tenantId: string;
  customerId: string | null;
  leadId: string | null;
  ownerId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  communicationPreference: string;
  source: string | null;
  updatedAt: string;
}

export interface CrmOpportunity {
  id: string;
  tenantId: string;
  name: string;
  stage: OpportunityStage;
  expectedValueMinor: string | number | null;
  currency: string | null;
  leadId: string | null;
  customerId: string | null;
  contactId: string | null;
  projectId: string | null;
  unitId: string | null;
  ownerId: string;
  updatedAt: string;
  contact: CrmContact | null;
  customer: { id: string; firstName: string; lastName: string | null; email: string; phone: string } | null;
  project: { id: string; code: string; name: string } | null;
  unit: { id: string; code: string; number: string; status: string } | null;
  owner: { id: string; displayName: string; email: string };
}

export interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  status: CrmTaskStatus;
  priority: CrmTaskPriority;
  dueAt: string | null;
  assigneeId: string;
  opportunityId: string | null;
  contactId: string | null;
  createdAt: string;
}

export interface CrmActivity {
  id: string;
  type: CrmActivityType;
  notes: string;
  opportunityId: string | null;
  contactId: string | null;
  createdAt: string;
  actor: { id: string; displayName: string };
}

const path = (suffix: string) => `/api/backend/crm/${suffix}`;
const json = (method: "POST" | "PATCH", body: Record<string, unknown>): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const crmApi = {
  contacts: (ownerId?: string) => clientApi<CrmContact[]>(path(`contacts${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ""}`)),
  createContact: (body: Record<string, unknown>) => clientApi<CrmContact>(path("contacts"), json("POST", body)),
  convertLead: (leadId: string, body: Record<string, unknown> = {}) => clientApi<{ contact: CrmContact; created: boolean }>(path(`leads/${encodeURIComponent(leadId)}/convert`), json("POST", body)),
  opportunities: (ownerId?: string) => clientApi<CrmOpportunity[]>(path(`opportunities${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ""}`)),
  createOpportunity: (body: Record<string, unknown>) => clientApi<CrmOpportunity>(path("opportunities"), json("POST", body)),
  updateOpportunityStage: (id: string, stage: OpportunityStage) => clientApi<CrmOpportunity>(path(`opportunities/${encodeURIComponent(id)}/stage`), json("PATCH", { stage })),
  activities: (opportunityId?: string) => clientApi<CrmActivity[]>(path(`activities${opportunityId ? `?opportunityId=${encodeURIComponent(opportunityId)}` : ""}`)),
  createActivity: (body: Record<string, unknown>) => clientApi<CrmActivity>(path("activities"), json("POST", body)),
  tasks: (assigneeId?: string) => clientApi<CrmTask[]>(path(`tasks${assigneeId ? `?assigneeId=${encodeURIComponent(assigneeId)}` : ""}`)),
  createTask: (body: Record<string, unknown>) => clientApi<CrmTask>(path("tasks"), json("POST", body)),
  updateTaskStatus: (id: string, status: CrmTaskStatus) => clientApi<CrmTask>(path(`tasks/${encodeURIComponent(id)}/status`), json("PATCH", { status })),
  createQuotation: (body: Record<string, unknown>) => clientApi<{ quotation: { id: string; status: string; currentRevision: number }; revision: { id: string; revision: number; status: QuotationRevisionStatus } }>(path("quotations"), json("POST", body)),
  createRevision: (quotationId: string, snapshot: Record<string, unknown>) => clientApi<{ id: string; revision: number; status: QuotationRevisionStatus }>(path(`quotations/${encodeURIComponent(quotationId)}/revisions`), json("POST", { snapshot })),
  updateRevisionStatus: (revisionId: string, status: "APPROVED" | "SENT") => clientApi<{ id: string; status: QuotationRevisionStatus }>(path(`quotation-revisions/${encodeURIComponent(revisionId)}/status`), json("PATCH", { status })),
  recordDecision: (revisionId: string, status: CustomerDecisionStatus, note?: string) => clientApi<{ id: string; status: CustomerDecisionStatus }>(path(`quotation-revisions/${encodeURIComponent(revisionId)}/decision`), json("POST", { status, note })),
};
