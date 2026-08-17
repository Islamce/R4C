export type QuotationStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "APPROVED_TO_SEND"
  | "SENT"
  | "VIEWED"
  | "CUSTOMER_ACCEPTED"
  | "CUSTOMER_DECLINED"
  | "EXPIRED"
  | "WITHDRAWN"
  | "SUPERSEDED";

export type CustomerDecisionType = "ACCEPTED" | "DECLINED" | "CLARIFICATION_REQUESTED";

export type SalesQuotation = {
  id: string;
  quotationNumber: string;
  revision: number;
  status: QuotationStatus;
  expiresAt: string;
  currency: string;
  leadId: string;
  customer: { displayName: string } | null;
  project: { code: string; name: string } | null;
  unit: { code: string; number: string } | null;
  createdById?: string;
  reviewedById?: string | null;
  approvedToSendById?: string | null;
  reviewedAt?: string | null;
  approvedToSendAt?: string | null;
  snapshotChecksum?: string | null;
  previewChecksum?: string | null;
  priceSnapshot?: Record<string, unknown> | null;
  paymentPlanSnapshot?: Record<string, unknown> | null;
  customerSnapshot?: Record<string, unknown> | null;
  unitSnapshot?: Record<string, unknown> | null;
  termsSnapshot?: { body?: string } | null;
  sourcePriceRevisionId?: string;
  paymentPlanId?: string;
  decisions?: Array<{ decision: CustomerDecisionType; comment: string | null; createdAt: string; evidenceChecksum?: string | null }>;
  updatedAt: string;
};

export type BuyerQuotation = {
  quotationNumber: string;
  revision: number;
  status: QuotationStatus;
  expiresAt: string;
  currency: string;
  priceSnapshot: Record<string, unknown> | null;
  paymentPlanSnapshot: Record<string, unknown> | null;
  customerSnapshot: Record<string, unknown> | null;
  unitSnapshot: Record<string, unknown> | null;
  termsSnapshot: { body?: string } | null;
  snapshotChecksum: string | null;
  customerDecisions: Array<{ decision: CustomerDecisionType; comment: string | null; createdAt: string }>;
};

export type StaffQuotationCommand = {
  leadId: string;
  paymentPlanId: string;
  expiresAt: string;
  terms?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? String((body as { message: unknown }).message) : "Quotation request failed";
    throw new Error(message);
  }
  return body as T;
}

export const quotationApi = {
  list: (query = "") => request<SalesQuotation[]>(`/api/backend/quotations${query}`),
  detail: (quotationId: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}`),
  create: (command: StaffQuotationCommand) => request<SalesQuotation>("/api/backend/quotations", { method: "POST", body: JSON.stringify(command) }),
  update: (quotationId: string, command: Partial<StaffQuotationCommand>) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}`, { method: "PATCH", body: JSON.stringify(command) }),
  submit: (quotationId: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/submit`, { method: "POST", body: "{}" }),
  returnToDraft: (quotationId: string, reason: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/return`, { method: "POST", body: JSON.stringify({ reason }) }),
  approveToSend: (quotationId: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/approve-to-send`, { method: "POST", body: "{}" }),
  withdraw: (quotationId: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/withdraw`, { method: "POST", body: "{}" }),
  revision: (quotationId: string) => request<SalesQuotation>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/revision`, { method: "POST", body: "{}" }),
  preview: (quotationId: string) => request<{ kind: string; label: string; quotation: SalesQuotation; checksum: string }>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/preview-document`),
  syntheticPreviewLink: (quotationId: string, ttlMinutes = 60) => request<{ token: string; expiresAt: string; mode: string }>(`/api/backend/quotations/${encodeURIComponent(quotationId)}/synthetic-preview-link`, { method: "POST", body: JSON.stringify({ ttlMinutes }) }),
  resolveBuyer: (token: string) => request<{ mode: string; label: string; quotation: BuyerQuotation; canDecide: boolean }>("/api/buyer/quotation/resolve", { method: "POST", body: JSON.stringify({ token }) }),
  recordBuyerDecision: (token: string, decision: CustomerDecisionType, comment?: string) => request<{ receipt: { quotationNumber: string; revision: number; decision: CustomerDecisionType; recordedAt: string; message: string } }>("/api/buyer/quotation/decision", { method: "POST", body: JSON.stringify({ token, decision, ...(comment ? { comment } : {}) }) }),
};
