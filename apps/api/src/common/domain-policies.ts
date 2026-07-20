export type CommissioningResult =
  | "PASS"
  | "FAIL"
  | "CONDITIONAL"
  | "NOT_APPLICABLE"
  | null;

export type SafetyEventType = "HAZARD" | "OBSERVATION" | "NEAR_MISS" | "INCIDENT";
export type SafetySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TurnoverState =
  | "NOT_STARTED"
  | "COMMISSIONING"
  | "BLOCKED"
  | "READY_FOR_HANDOVER"
  | "HANDED_OVER";

export function actorsAreIndependent(firstActorId: string, secondActorId: string) {
  return firstActorId !== secondActorId;
}

export function canAcceptCommissioningResult(result: CommissioningResult) {
  return result === "PASS" || result === "NOT_APPLICABLE";
}

export function safetyInvestigationRequired(
  type: SafetyEventType,
  severity: SafetySeverity,
) {
  return (
    type === "INCIDENT" ||
    type === "NEAR_MISS" ||
    severity === "HIGH" ||
    severity === "CRITICAL"
  );
}

export function resolveTurnoverState(input: {
  testStatus?: string | null;
  testResult?: CommissioningResult;
  acceptedPackage: boolean;
}): TurnoverState {
  if (!input.testStatus) return "NOT_STARTED";
  if (
    input.testStatus === "REJECTED" ||
    input.testResult === "FAIL" ||
    input.testResult === "CONDITIONAL"
  ) {
    return "BLOCKED";
  }
  if (input.testStatus === "SCHEDULED" || input.testStatus === "SUBMITTED") {
    return "COMMISSIONING";
  }
  if (input.testStatus === "ACCEPTED" && input.testResult === "PASS") {
    return input.acceptedPackage ? "HANDED_OVER" : "READY_FOR_HANDOVER";
  }
  return "NOT_STARTED";
}
