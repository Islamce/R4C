# R4C Commercial Live Aggregation Contract

## Design decision

The first live increment uses request-time derived aggregates. It does not add a persistent exception table, migration, cache, warehouse, event bus, or materialized view. Every response includes `generatedAt`, tenant-scoped records, stable exception codes, source evidence, and component-level provenance. Exceptions are derived from governed records and resolve automatically when their trigger condition no longer holds.

## `GET /api/v1/commercial/overview`

The endpoint requires `commercial:read`. An optional `projectId` filter is allowed. The service always constrains project, unit, lead, hold, reservation, and turnover reads to the authenticated tenant.

```ts
interface CommercialOverview {
  generatedAt: string;
  tenantId: string;
  scope: { projectId: string | null; projects: number };
  provenance: {
    inventory: "GOVERNED_LIVE";
    pipeline: "GOVERNED_LIVE" | "PARTIAL";
    closing: "NOT_MODELED" | "PARTIAL";
    transfer: "NOT_MODELED";
  };
  inventory: {
    total: number;
    draft: number;
    unreleased: number;
    available: number;
    held: number;
    reserved: number;
    sold: number;
    blocked: number;
    withdrawn: number;
  };
  pipeline: {
    visible: boolean;
    total: number | null;
    byStatus: Record<string, number> | null;
  };
  commercialValue: {
    currency: string | null;
    confirmedReservationsMinor: string | null;
    status: "DERIVED" | "NOT_EVALUABLE" | "UNAVAILABLE";
  };
  closing: {
    status: "PARTIAL" | "NOT_MODELED";
    activePackages: number | null;
    readyPackages: number | null;
    blockedRequirements: number | null;
  };
  projects: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    units: { total: number; available: number; held: number; reserved: number; sold: number };
    leads: number | null;
    activeHolds: number;
    confirmedReservations: number;
  }>;
}
```

## `GET /api/v1/commercial/exceptions`

The endpoint requires `commercial:read`. It accepts bounded filters: `projectId`, `severity`, `type`, and `limit` (1–100). Every exception is derived on request and includes the source records and a deterministic next action when a valid route exists.

```ts
interface CommercialException {
  id: string;
  tenantId: string;
  type:
    | "STALE_LEAD"
    | "EXPIRING_HOLD"
    | "MISSING_BUYER_EVIDENCE"
    | "CLOSING_BLOCKED";
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
}
```

## Supported rules

`STALE_LEAD` is derived when a visible lead is in an active status and its latest qualifying activity is older than the configured stale threshold. `EXPIRING_HOLD` is derived from an active hold whose expiry is within the configured threshold, with critical severity for expired-but-active records. `MISSING_BUYER_EVIDENCE` and `CLOSING_BLOCKED` are only emitted when an implemented governed record exposes the blocker; presentation-only title-transfer rows are excluded. Explicit follow-up due dates, reservation approval-pending states, pricing review, and title-transfer exceptions are not emitted because the current domain does not model them.

## Configuration

The thresholds are centralized in `commercial-exception.config.ts`. The current safe defaults are seven days for stale leads and 24 hours for expiring holds, matching the attached implementation direction. These values are visible configuration rather than hidden constants. A founder decision is required before treating them as permanent business policy.
