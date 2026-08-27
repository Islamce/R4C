import { clientApi } from "./client-api";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "APPOINTMENT" | "NEGOTIATION" | "RESERVED" | "WON" | "LOST" | "DISQUALIFIED";
export type ActivityType = "CALL" | "EMAIL" | "WHATSAPP" | "MEETING" | "SITE_VISIT" | "FOLLOW_UP" | "NOTE";

export interface CommercialLead {
  id: string;
  customerId: string | null;
  projectId: string | null;
  unitId: string | null;
  assignedToId: string;
  source: string;
  status: LeadStatus;
  customer: { id: string; firstName: string; lastName: string | null; phone: string; email: string } | null;
  project: { id: string; code: string; name: string } | null;
  unit: { id: string; code: string; number: string } | null;
  assignedTo: { id: string; displayName: string };
  enquiryConsent: ConsentRecord;
  marketingConsent: ConsentRecord;
  createdAt: string;
}

interface ConsentRecord {
  granted: boolean;
  at: string | null;
  channel: string | null;
  purpose: string | null;
}

export interface LeadPage { items: CommercialLead[]; total: number; page: number; pageSize: number }
export interface SalesActivity { id: string; type: ActivityType; notes: string; createdAt: string; actor: { id: string; displayName: string } }
export interface SalesAssignee { id: string; displayName: string; role: { code: string; name: string } }
export interface UnitPrice { id: string; listPriceMinor: string; basePriceMinor: string; currency: string; status: string }
export interface PaymentPlan { id: string; projectId: string; installments: Array<{ id: string; sequence: number; shareBasisPoints: number; label: string | null }> }
export interface UnitContext {
  id: string;
  projectId: string;
  code: string;
  number: string;
  status: string;
  grossArea: string;
  bedrooms: number;
  bathrooms: number;
  building: { code: string; name: string };
  floor: { code: string; name: string };
  unitType: { code: string; name: string };
  descriptions: Record<"project" | "phase" | "unitType", { value: string | null; locale: "en" | "ar" | null; fallbackUsed: boolean }>;
}
export interface UnitHold { id: string; unitId: string; leadId: string; status: string; holdExpiresAt: string }
export interface Reservation { id: string; status: string; currency: string; basePriceSnapshotMinor: string; listPriceSnapshotMinor: string; reservationAmountMinor: string; sourcePriceRevisionId: string; paymentPlanId: string; confirmedAt: string }
export interface SalesTask { id: string; title: string; description: string | null; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; dueAt: string; assignee: { id: string; displayName: string }; createdBy: { id: string; displayName: string } }
export interface TransferDocument { id: string; documentType: string; status: "MISSING" | "UPLOADED" | "VERIFIED" | "REJECTED" | "NOT_APPLICABLE"; storageKey: string | null; notes: string | null }
export interface TransferCase {
  id: string;
  status: "DOCUMENTS_PENDING" | "UNDER_REVIEW" | "APPROVED" | "READY_FOR_AUTHORITY" | "COMPLETED" | "RETURNED";
  readiness: number;
  project: { id: string; code: string; name: string };
  reservation: Pick<Reservation, "id" | "status" | "currency" | "confirmedAt"> & {
    customer: CommercialLead["customer"];
    unit: Pick<UnitContext, "id" | "code" | "number">;
  };
  documents: TransferDocument[];
}
export interface CommercialDispatch { id: string; status: "QUEUED" | "SENT" | "FAILED"; recipientEmail: string; subject: string; assetIds: string[]; createdAt: string }

function commercialPath(path: string) {
  return `/api/backend/commercial/${path}`;
}

export const commercialApi = {
  leads: (all: boolean) => clientApi<LeadPage>(commercialPath(all ? "leads/all?pageSize=100" : "leads?pageSize=100")),
  lead: (id: string, all: boolean) => clientApi<CommercialLead>(commercialPath(all ? `leads/all/${id}` : `leads/${id}`)),
  createCustomer: (body: Record<string, unknown>) => clientApi<{ customer: CommercialLead["customer"]; reused: boolean }>(commercialPath("customers"), json("POST", body)),
  createLead: (body: Record<string, unknown>) => clientApi<CommercialLead>(commercialPath("leads"), json("POST", body)),
  advanceLead: (id: string, status: LeadStatus) => clientApi<CommercialLead>(commercialPath(`leads/${id}/status`), json("PATCH", { status })),
  disqualifyLead: (id: string) => clientApi<CommercialLead>(commercialPath(`leads/${id}/disqualify`), { method: "POST" }),
  reassignLead: (id: string, assignedToId: string) => clientApi<CommercialLead>(commercialPath(`leads/${id}/assignee`), json("PATCH", { assignedToId })),
  assignees: () => clientApi<SalesAssignee[]>(commercialPath("assignees")),
  activities: (leadId: string) => clientApi<SalesActivity[]>(commercialPath(`leads/${leadId}/activities`)),
  logActivity: (leadId: string, body: Record<string, unknown>) => clientApi<SalesActivity>(commercialPath(`leads/${leadId}/activities`), json("POST", body)),
  unit: (id: string, locale: string) => clientApi<UnitContext>(commercialPath(`units/${id}?locale=${encodeURIComponent(locale)}`)),
  prices: (id: string) => clientApi<UnitPrice[]>(commercialPath(`units/${id}/prices`)),
  paymentPlans: (projectId: string) => clientApi<PaymentPlan[]>(commercialPath(`projects/${projectId}/payment-plans`)),
  createHold: (body: Record<string, unknown>) => clientApi<UnitHold>(commercialPath("holds"), json("POST", body)),
  releaseHold: (id: string) => clientApi<UnitHold>(commercialPath(`holds/${id}/cancel`), { method: "POST" }),
  confirmReservation: (id: string, paymentPlanId: string) => clientApi<Reservation>(commercialPath(`holds/${id}/confirm`), json("POST", { paymentPlanId })),
  tasks: () => clientApi<SalesTask[]>(commercialPath("tasks")),
  createTask: (body: Record<string, unknown>) => clientApi<SalesTask>(commercialPath("tasks"), json("POST", body)),
  updateTask: (id: string, body: Record<string, unknown>) => clientApi<SalesTask>(commercialPath(`tasks/${id}`), json("PATCH", body)),
  transferCases: () => clientApi<TransferCase[]>(commercialPath("transfer-cases")),
  createTransferCase: (reservationId: string) => clientApi<TransferCase>(commercialPath("transfer-cases"), json("POST", { reservationId })),
  reviewTransferDocument: (id: string, body: Record<string, unknown>) => clientApi<TransferDocument>(commercialPath(`transfer-documents/${id}`), json("PATCH", body)),
  reviewTransferCase: (id: string, status: string) => clientApi<TransferCase>(commercialPath(`transfer-cases/${id}/status`), json("PATCH", { status })),
  createDispatch: (body: Record<string, unknown>) => clientApi<CommercialDispatch>(commercialPath("dispatches"), json("POST", body)),
};

function json(method: "POST" | "PATCH", body: Record<string, unknown>): RequestInit {
  return { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}
