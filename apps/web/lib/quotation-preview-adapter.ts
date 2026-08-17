import type { CommercialLead, PaymentPlan } from "./commercial-api";
import type { BuyerQuotation, QuotationStatus, SalesQuotation } from "./quotation-api";

const baseSnapshot = {
  priceSnapshot: { listPriceMinor: "125000000", basePriceMinor: "118500000", currency: "SAR", revision: 4 },
  paymentPlanSnapshot: {
    installments: [
      { sequence: 1, shareBasisPoints: 1000, label: "Reservation" },
      { sequence: 2, shareBasisPoints: 4000, label: "Construction" },
      { sequence: 3, shareBasisPoints: 5000, label: "Handover" },
    ],
  },
  customerSnapshot: { displayName: "Noura Al Harbi", email: "noura.preview@example.test" },
  unitSnapshot: {
    code: "B2-804", number: "804", bedrooms: 3, bathrooms: 3, grossArea: "176.4",
    projectName: "Al Rawdah Residences", projectCode: "AL-RAWD-01",
  },
  termsSnapshot: { body: "Preview terms: subject to controlled internal reservation handoff. Customer acceptance does not reserve the unit or create a payment obligation." },
  snapshotChecksum: "uat-quotation-checksum-20260817",
};

export const syntheticSalesQuotation: SalesQuotation = {
  id: "synthetic-quotation-001",
  quotationNumber: "SQ-20260817-DEMO01",
  revision: 1,
  status: "APPROVED_TO_SEND",
  expiresAt: "2026-09-30T15:00:00.000Z",
  currency: "SAR",
  leadId: "synthetic-lead-001",
  customer: { displayName: "Noura Al Harbi" },
  project: { code: "AL-RAWD-01", name: "Al Rawdah Residences" },
  unit: { code: "B2-804", number: "804" },
  createdById: "synthetic-agent",
  reviewedById: "synthetic-manager",
  approvedToSendById: "synthetic-manager",
  reviewedAt: "2026-08-17T09:00:00.000Z",
  approvedToSendAt: "2026-08-17T09:10:00.000Z",
  previewChecksum: "uat-preview-checksum-20260817",
  decisions: [],
  updatedAt: "2026-08-17T09:10:00.000Z",
  ...baseSnapshot,
};

export const syntheticCommercialLead: CommercialLead = {
  id: "synthetic-lead-001",
  customerId: "synthetic-customer-001",
  projectId: "synthetic-project-001",
  unitId: "synthetic-unit-001",
  assignedToId: "synthetic-agent",
  source: "DESIGN_UAT",
  status: "NEGOTIATION",
  customer: { id: "synthetic-customer-001", firstName: "Noura", lastName: "Al Harbi", phone: "+966500000000", email: "noura.preview@example.test" },
  project: { id: "synthetic-project-001", code: "AL-RAWD-01", name: "Al Rawdah Residences" },
  unit: { id: "synthetic-unit-001", code: "B2-804", number: "804" },
  assignedTo: { id: "synthetic-agent", displayName: "UAT Sales Agent" },
  enquiryConsent: { granted: true, at: "2026-08-17T09:00:00.000Z", channel: "UAT", purpose: "DESIGN_PREVIEW" },
  marketingConsent: { granted: false, at: null, channel: null, purpose: null },
  createdAt: "2026-08-17T09:00:00.000Z",
};

export const syntheticPaymentPlans: PaymentPlan[] = [{
  id: "synthetic-payment-plan-001",
  projectId: "synthetic-project-001",
  installments: [
    { id: "synthetic-installment-1", sequence: 1, shareBasisPoints: 1000, label: "Reservation" },
    { id: "synthetic-installment-2", sequence: 2, shareBasisPoints: 4000, label: "Construction" },
    { id: "synthetic-installment-3", sequence: 3, shareBasisPoints: 5000, label: "Handover" },
  ],
}];

export function syntheticBuyerQuotation(status: QuotationStatus = "APPROVED_TO_SEND"): BuyerQuotation {
  return {
    quotationNumber: syntheticSalesQuotation.quotationNumber,
    revision: syntheticSalesQuotation.revision,
    status,
    expiresAt: syntheticSalesQuotation.expiresAt,
    currency: syntheticSalesQuotation.currency,
    priceSnapshot: baseSnapshot.priceSnapshot,
    paymentPlanSnapshot: baseSnapshot.paymentPlanSnapshot,
    customerSnapshot: baseSnapshot.customerSnapshot,
    unitSnapshot: baseSnapshot.unitSnapshot,
    termsSnapshot: { body: "This controlled preview is subject to internal reservation handoff. Acceptance records interest only and does not reserve the unit or create a payment obligation." },
    snapshotChecksum: "uat-preview-checksum-20260817",
    customerDecisions: [],
  };
}
