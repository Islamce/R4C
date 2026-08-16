export const commercialExceptionThresholds = {
  staleLeadDays: 7,
  expiringHoldHours: 24,
} as const;

export type CommercialExceptionType =
  | "STALE_LEAD"
  | "EXPIRING_HOLD";

export type CommercialExceptionSeverity = "INFO" | "WARNING" | "CRITICAL";
