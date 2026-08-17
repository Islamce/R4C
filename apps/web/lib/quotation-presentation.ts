import type { BuyerQuotation, CustomerDecisionType, QuotationStatus, SalesQuotation } from "./quotation-api";

export type QuotationLocale = "en" | "ar";
type SnapshotQuotation = Pick<SalesQuotation | BuyerQuotation, "currency" | "priceSnapshot" | "paymentPlanSnapshot">;

const statusLabels: Record<QuotationLocale, Record<QuotationStatus, string>> = {
  en: {
    DRAFT: "Draft", INTERNAL_REVIEW: "Internal review", APPROVED_TO_SEND: "Approved to send", SENT: "Sent", VIEWED: "Viewed",
    CUSTOMER_ACCEPTED: "Customer accepted", CUSTOMER_DECLINED: "Customer declined", EXPIRED: "Expired", WITHDRAWN: "Withdrawn", SUPERSEDED: "Superseded",
  },
  ar: {
    DRAFT: "مسودة", INTERNAL_REVIEW: "مراجعة داخلية", APPROVED_TO_SEND: "معتمد للإرسال", SENT: "مرسل", VIEWED: "تمت المعاينة",
    CUSTOMER_ACCEPTED: "قبل العميل", CUSTOMER_DECLINED: "رفض العميل", EXPIRED: "منتهي الصلاحية", WITHDRAWN: "مسحوب", SUPERSEDED: "مستبدل",
  },
};

const installmentFallbacks: Record<QuotationLocale, string[]> = {
  en: ["Reservation", "Construction", "Handover"],
  ar: ["دفعة الحجز", "أثناء الإنشاء", "عند التسليم"],
};

export const customerVisibleStatuses: QuotationStatus[] = ["APPROVED_TO_SEND", "SENT", "VIEWED"];
export const revisableStatuses: QuotationStatus[] = ["APPROVED_TO_SEND", "SENT", "VIEWED", "WITHDRAWN", "EXPIRED"];

export function quotationMoney(quotation: SnapshotQuotation, locale: QuotationLocale) {
  const minor = quotation.priceSnapshot && typeof quotation.priceSnapshot === "object" && "listPriceMinor" in quotation.priceSnapshot
    ? Number(quotation.priceSnapshot.listPriceMinor ?? 0)
    : 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency", currency: quotation.currency, maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function quotationDate(value: string, locale: QuotationLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}

export function quotationStatusLabel(status: QuotationStatus, locale: QuotationLocale) {
  return statusLabels[locale][status];
}

export function quotationStatusClass(status: QuotationStatus) {
  return `quotation-status quotation-status-${status.toLowerCase().replaceAll("_", "-")}`;
}

export function snapshotInstallments(quotation: SnapshotQuotation, locale: QuotationLocale, useLocaleFallback = false) {
  const items = quotation.paymentPlanSnapshot && typeof quotation.paymentPlanSnapshot === "object" && Array.isArray(quotation.paymentPlanSnapshot.installments)
    ? quotation.paymentPlanSnapshot.installments
    : [];
  return items.map((item, index) => {
    const record = item && typeof item === "object" ? item as { label?: unknown; shareBasisPoints?: unknown } : {};
    const sourceLabel = typeof record.label === "string" && record.label.trim() ? record.label : null;
    return {
      label: useLocaleFallback ? installmentFallbacks[locale][index] ?? (locale === "ar" ? "دفعة" : "Installment") : sourceLabel ?? (locale === "ar" ? "دفعة" : "Installment"),
      percentage: Number(record.shareBasisPoints ?? 0) / 100,
    };
  });
}

export function decisionHint(decision: CustomerDecisionType | null, locale: QuotationLocale) {
  const copy = locale === "ar"
    ? {
      prompt: "اختر ردًا واحدًا قبل تسجيل قرارك.",
      accepted: "أنت تسجل قبول عرض السعر. يتولى فريق مخول منفصل أي حجز.",
      declined: "أنت تسجل رفض عرض السعر. يمكنك إضافة سبب عند الحاجة.",
      clarification: "أخبر فريق المبيعات بما يحتاج إلى توضيح. الرسالة مطلوبة.",
    }
    : {
      prompt: "Choose one response before recording your decision.",
      accepted: "You are recording acceptance of this quotation. A separate authorized team must handle any reservation.",
      declined: "You are recording that this quotation is declined. You may add a reason if helpful.",
      clarification: "Tell the sales team what needs clarification. A message is required.",
    };
  if (decision === "ACCEPTED") return copy.accepted;
  if (decision === "DECLINED") return copy.declined;
  if (decision === "CLARIFICATION_REQUESTED") return copy.clarification;
  return copy.prompt;
}
