import { Injectable, NotFoundException } from "@nestjs/common";
import { LeadStatus, Prisma, UnitHoldStatus, UnitStatus } from "@prisma/client";
import { AuthContext } from "../common/auth-context";
import { PrismaService } from "../prisma/prisma.service";
import {
  commercialExceptionThresholds,
  type CommercialExceptionSeverity,
  type CommercialExceptionType,
} from "./commercial-aggregation.config";

const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.APPOINTMENT,
  LeadStatus.NEGOTIATION,
  LeadStatus.RESERVED,
];

const INVENTORY_STATUSES: UnitStatus[] = [
  UnitStatus.DRAFT,
  UnitStatus.UNRELEASED,
  UnitStatus.AVAILABLE,
  UnitStatus.HELD,
  UnitStatus.RESERVED,
  UnitStatus.SOLD,
  UnitStatus.BLOCKED,
  UnitStatus.WITHDRAWN,
];

const canSeeAllLeads = (permissions: readonly string[]) => permissions.includes("commercial:lead:view-all");
const canSeeTurnover = (permissions: readonly string[]) => permissions.includes("turnover:read");

export interface CommercialOverview {
  generatedAt: string;
  tenantId: string;
  scope: { projectId: string | null; projects: number };
  provenance: {
    inventory: "GOVERNED_LIVE";
    pipeline: "GOVERNED_LIVE" | "PARTIAL";
    closing: "NOT_MODELED" | "PARTIAL";
    transfer: "NOT_MODELED";
  };
  inventory: Record<string, number>;
  pipeline: { visible: boolean; total: number | null; byStatus: Record<string, number> | null };
  commercialValue: { currency: string | null; confirmedReservationsMinor: string | null; status: "DERIVED" | "NOT_EVALUABLE" | "UNAVAILABLE" };
  closing: { status: "PARTIAL" | "NOT_MODELED"; activePackages: number | null; readyPackages: number | null; blockedRequirements: number | null };
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

export interface CommercialException {
  id: string;
  tenantId: string;
  type: CommercialExceptionType;
  severity: CommercialExceptionSeverity;
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

@Injectable()
export class CommercialAggregationService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(user: AuthContext, projectId?: string): Promise<CommercialOverview> {
    if (projectId) await this.requireProject(user.tenantId, projectId);
    const projectWhere: Prisma.ProjectWhereInput = { tenantId: user.tenantId, ...(projectId ? { id: projectId } : {}) };
    const unitWhere: Prisma.UnitWhereInput = { tenantId: user.tenantId, ...(projectId ? { projectId } : {}) };
    const leadScope = canSeeAllLeads(user.permissions) ? {} : { assignedToId: user.userId };
    const leadWhere: Prisma.LeadWhereInput = { tenantId: user.tenantId, ...leadScope, ...(projectId ? { projectId } : {}) };

    const [projects, unitGroups, leads, activeHolds, confirmedReservations, turnover] = await Promise.all([
      this.prisma.project.findMany({ where: projectWhere, select: { id: true, code: true, name: true, status: true }, orderBy: { code: "asc" } }),
      this.prisma.unit.groupBy({ by: ["projectId", "status"], where: unitWhere, _count: { _all: true } }),
      canSeeAllLeads(user.permissions) || user.permissions.includes("commercial:lead:view-own")
        ? this.prisma.lead.groupBy({ by: ["projectId", "status"], where: leadWhere, _count: { _all: true } })
        : Promise.resolve([]),
      this.prisma.unitHold.findMany({ where: { tenantId: user.tenantId, status: UnitHoldStatus.ACTIVE, unit: projectId ? { projectId } : undefined }, select: { unit: { select: { projectId: true } } } }),
      this.prisma.reservation.findMany({ where: { tenantId: user.tenantId, status: "CONFIRMED", unit: projectId ? { projectId } : undefined }, select: { unit: { select: { projectId: true } }, listPriceSnapshotMinor: true, currency: true } }),
      canSeeTurnover(user.permissions)
        ? this.turnoverCounts(user.tenantId, projectId)
        : Promise.resolve(null),
    ]);

    const statusCounts = new Map<string, number>();
    for (const item of unitGroups) statusCounts.set(item.status, (statusCounts.get(item.status) ?? 0) + item._count._all);
    const inventory = Object.fromEntries(INVENTORY_STATUSES.map((status) => [status.toLowerCase(), statusCounts.get(status) ?? 0]));
    inventory.total = INVENTORY_STATUSES.reduce((sum, status) => sum + (statusCounts.get(status) ?? 0), 0);

    const leadCounts = new Map<string, number>();
    for (const item of leads) leadCounts.set(item.status, (leadCounts.get(item.status) ?? 0) + item._count._all);
    const pipelineVisible = canSeeAllLeads(user.permissions) || user.permissions.includes("commercial:lead:view-own");

    const currencies = new Set(confirmedReservations.map((item) => item.currency));
    let commercialValue: CommercialOverview["commercialValue"];
    if (!confirmedReservations.length) {
      commercialValue = { currency: null, confirmedReservationsMinor: "0", status: "DERIVED" };
    } else if (currencies.size === 1) {
      const currency = confirmedReservations[0]!.currency;
      const total = confirmedReservations.reduce((sum, item) => sum + item.listPriceSnapshotMinor, 0n);
      commercialValue = { currency, confirmedReservationsMinor: total.toString(), status: "DERIVED" };
    } else {
      commercialValue = { currency: null, confirmedReservationsMinor: null, status: "NOT_EVALUABLE" };
    }

    const projectSummaries = projects.map((project) => {
      const counts = new Map<string, number>();
      for (const item of unitGroups.filter((group) => group.projectId === project.id)) counts.set(item.status, item._count._all);
      return {
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        units: {
          total: INVENTORY_STATUSES.reduce((sum, status) => sum + (counts.get(status) ?? 0), 0),
          available: counts.get(UnitStatus.AVAILABLE) ?? 0,
          held: counts.get(UnitStatus.HELD) ?? 0,
          reserved: counts.get(UnitStatus.RESERVED) ?? 0,
          sold: counts.get(UnitStatus.SOLD) ?? 0,
        },
        leads: pipelineVisible ? leads.filter((item) => item.projectId === project.id).reduce((sum, item) => sum + item._count._all, 0) : null,
        activeHolds: activeHolds.filter((hold) => hold.unit.projectId === project.id).length,
        confirmedReservations: confirmedReservations.filter((reservation) => reservation.unit.projectId === project.id).length,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      tenantId: user.tenantId,
      scope: { projectId: projectId ?? null, projects: projects.length },
      provenance: { inventory: "GOVERNED_LIVE", pipeline: pipelineVisible ? "GOVERNED_LIVE" : "PARTIAL", closing: turnover ? "PARTIAL" : "NOT_MODELED", transfer: "NOT_MODELED" },
      inventory,
      pipeline: { visible: pipelineVisible, total: pipelineVisible ? [...leadCounts.values()].reduce((sum, value) => sum + value, 0) : null, byStatus: pipelineVisible ? Object.fromEntries(leadCounts) : null },
      commercialValue,
      closing: turnover ?? { status: "NOT_MODELED", activePackages: null, readyPackages: null, blockedRequirements: null },
      projects: projectSummaries,
    };
  }

  async exceptions(user: AuthContext, filters: { projectId?: string; type?: CommercialExceptionType; severity?: CommercialExceptionSeverity; limit?: number }) {
    if (filters.projectId) await this.requireProject(user.tenantId, filters.projectId);
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const exceptions = [
      ...(await this.staleLeadExceptions(user, filters.projectId)),
      ...(await this.expiringHoldExceptions(user, filters.projectId)),
    ].filter((item) => !filters.type || item.type === filters.type).filter((item) => !filters.severity || item.severity === filters.severity);
    return { generatedAt: new Date().toISOString(), tenantId: user.tenantId, items: exceptions.slice(0, limit), limit };
  }

  private async staleLeadExceptions(user: AuthContext, projectId?: string): Promise<CommercialException[]> {
    if (!canSeeAllLeads(user.permissions) && !user.permissions.includes("commercial:lead:view-own")) return [];
    const since = new Date(Date.now() - commercialExceptionThresholds.staleLeadDays * 24 * 60 * 60 * 1000);
    const leads = await this.prisma.lead.findMany({
      where: { tenantId: user.tenantId, ...(canSeeAllLeads(user.permissions) ? {} : { assignedToId: user.userId }), ...(projectId ? { projectId } : {}), status: { in: ACTIVE_LEAD_STATUSES } },
      select: { id: true, projectId: true, unitId: true, assignedToId: true, status: true, createdAt: true, updatedAt: true, activities: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, createdAt: true } } },
      take: 500,
    });
    return leads.flatMap((lead) => {
      const lastActivity = lead.activities[0]?.createdAt ?? lead.updatedAt ?? lead.createdAt;
      if (lastActivity > since) return [];
      const ageDays = Math.floor((Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      return [{ id: `STALE_LEAD:${lead.id}`, tenantId: user.tenantId, type: "STALE_LEAD", severity: ageDays >= commercialExceptionThresholds.staleLeadDays * 2 ? "CRITICAL" : "WARNING", object: { projectId: lead.projectId ?? undefined, unitId: lead.unitId ?? undefined, leadId: lead.id }, ownerId: lead.assignedToId, title: "Lead requires follow-up", reason: `No qualifying sales activity recorded for ${ageDays} days.`, occurredAt: lastActivity.toISOString(), ageDays, nextAction: { code: "OPEN_LEAD", label: "Open lead", route: lead.id }, evidence: [{ sourceType: "Lead", sourceId: lead.id }, ...(lead.activities[0] ? [{ sourceType: "SalesActivity", sourceId: lead.activities[0].id }] : [])] } satisfies CommercialException];
    });
  }

  private async expiringHoldExceptions(user: AuthContext, projectId?: string): Promise<CommercialException[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + commercialExceptionThresholds.expiringHoldHours * 60 * 60 * 1000);
    const holds = await this.prisma.unitHold.findMany({ where: { tenantId: user.tenantId, status: UnitHoldStatus.ACTIVE, holdExpiresAt: { lte: threshold }, unit: projectId ? { projectId } : undefined }, select: { id: true, leadId: true, holdExpiresAt: true, createdAt: true, unit: { select: { id: true, projectId: true, code: true } } }, take: 500 });
    return holds.map((hold) => {
      const expired = hold.holdExpiresAt <= now;
      return { id: `EXPIRING_HOLD:${hold.id}`, tenantId: user.tenantId, type: "EXPIRING_HOLD", severity: expired ? "CRITICAL" : "WARNING", object: { projectId: hold.unit.projectId, unitId: hold.unit.id, leadId: hold.leadId, holdId: hold.id }, title: expired ? "Hold has expired" : "Hold is expiring", reason: expired ? `Hold for ${hold.unit.code} passed its expiry timestamp.` : `Hold for ${hold.unit.code} expires within ${commercialExceptionThresholds.expiringHoldHours} hours.`, occurredAt: hold.createdAt.toISOString(), dueAt: hold.holdExpiresAt.toISOString(), nextAction: { code: "REVIEW_HOLD", label: "Review hold", route: hold.id }, evidence: [{ sourceType: "UnitHold", sourceId: hold.id }, { sourceType: "Unit", sourceId: hold.unit.id }] } satisfies CommercialException;
    });
  }

  private async turnoverCounts(tenantId: string, projectId?: string) {
    if (!projectId) return { status: "PARTIAL" as const, activePackages: null, readyPackages: null, blockedRequirements: null };
    const [activePackages, readyPackages, blockedRequirements] = await Promise.all([
      this.prisma.handoverPackage.count({ where: { tenantId, projectId, status: { in: ["DRAFT", "SUBMITTED", "RETURNED"] } } }),
      this.prisma.handoverPackage.count({ where: { tenantId, projectId, status: "ACCEPTED" } }),
      this.prisma.handoverRequirement.count({ where: { tenantId, handoverPackage: { projectId }, status: { in: ["MISSING", "REJECTED"] } } }),
    ]);
    return { status: "PARTIAL" as const, activePackages, readyPackages, blockedRequirements };
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } });
    if (!project) throw new NotFoundException("Project not found");
  }
}
