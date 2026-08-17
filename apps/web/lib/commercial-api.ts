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

export interface CommercialOverview {
  generatedAt: string;
  tenantId: string;
  scope: { projectId: string | null; projects: number };
  provenance: { inventory: "GOVERNED_LIVE"; pipeline: "GOVERNED_LIVE" | "PARTIAL"; closing: "NOT_MODELED" | "PARTIAL"; transfer: "NOT_MODELED" };
  inventory: Record<string, number>;
  pipeline: { visible: boolean; total: number | null; byStatus: Record<string, number> | null };
  commercialValue: { currency: string | null; confirmedReservationsMinor: string | null; status: "DERIVED" | "NOT_EVALUABLE" | "UNAVAILABLE" };
  closing: { status: "PARTIAL" | "NOT_MODELED"; activePackages: number | null; readyPackages: number | null; blockedRequirements: number | null };
  projects: Array<{ id: string; code: string; name: string; status: string; units: { total: number; available: number; held: number; reserved: number; sold: number }; leads: number | null; activeHolds: number; confirmedReservations: number }>;
}

export type CommercialException = {
  id: string;
  tenantId: string;
  type: "STALE_LEAD" | "EXPIRING_HOLD";
  severity: "INFO" | "WARNING" | "CRITICAL";
  object: { projectId?: string; unitId?: string; leadId?: string; holdId?: string };
  ownerId?: string;
  title: string;
  reason: string;
  occurredAt: string;
  dueAt?: string;
  ageDays?: number;
  exposure?: { amount: string; currency: string };
  nextAction?: { code: string; label: string; route: string };
  evidence: Array<{ sourceType: string; sourceId: string }>;
};

export interface CommercialExceptionPage { generatedAt: string; tenantId: string; items: CommercialException[]; limit: number }

function commercialPath(path: string) {
  return `/api/backend/commercial/${path}`;
}

export const commercialApi = {
  overview: (projectId?: string) => clientApi<CommercialOverview>(commercialPath(`overview${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`)),
  exceptions: (params?: { projectId?: string; limit?: number }) => clientApi<CommercialExceptionPage>(commercialPath(`exceptions?${new URLSearchParams({ ...(params?.projectId ? { projectId: params.projectId } : {}), limit: String(params?.limit ?? 50) }).toString()}`)),
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
};

function json(method: "POST" | "PATCH", body: Record<string, unknown>): RequestInit {
  return { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}
