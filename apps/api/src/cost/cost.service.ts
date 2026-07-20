import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBudgetDto, CreateCostEntryDto } from "./cost.dto";

interface WbsCostMetric {
  wbsNodeId: string;
  code: string;
  name: string;
  budget: string;
  plannedProgress: number;
  actualProgress: number;
  plannedValue: string;
  earnedValue: string;
  committed: string;
  actualCost: string;
  costVariance: string;
  scheduleVariance: string;
  forecastExposure: string;
}

@Injectable()
export class CostService {
  constructor(private readonly prisma: PrismaService) {}

  async budgets(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.projectBudget.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async activeBudget(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeBudgetId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeBudgetId) throw new NotFoundException("No published budget exists");

    const budget = await this.prisma.projectBudget.findFirstOrThrow({
      where: { id: project.activeBudgetId, tenantId, projectId },
      include: {
        lines: {
          orderBy: [{ costCode: "asc" }, { description: "asc" }],
          include: { wbsNode: { select: { code: true, name: true } } },
        },
      },
    });
    return {
      ...budget,
      totalBudget: this.money(
        budget.lines.reduce(
          (sum, line) => sum.plus(line.budgetAmount),
          new Prisma.Decimal(0),
        ),
      ),
    };
  }

  async createBudget(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateBudgetDto,
  ) {
    await this.requireProject(tenantId, projectId);
    const revision = command.revision.trim();
    const lineKeys = command.lines.map(
      (line) => `${line.costCode.trim()}|${line.wbsNodeId}`,
    );
    if (new Set(lineKeys).size !== lineKeys.length) {
      throw new BadRequestException("Cost code and WBS combinations must be unique");
    }

    const wbsNodeIds = [...new Set(command.lines.map((line) => line.wbsNodeId))];
    const wbsCount = await this.prisma.wbsNode.count({
      where: { id: { in: wbsNodeIds }, tenantId, projectId },
    });
    if (wbsCount !== wbsNodeIds.length) {
      throw new BadRequestException("Every budget line must reference this project WBS");
    }

    const normalizedLines = command.lines.map((line) => {
      const quantity = new Prisma.Decimal(line.quantity);
      const unitRate = new Prisma.Decimal(line.unitRate);
      if (quantity.lte(0)) throw new BadRequestException("Budget quantities must be positive");
      if (unitRate.lt(0)) throw new BadRequestException("Budget unit rates cannot be negative");
      return {
        tenantId,
        wbsNodeId: line.wbsNodeId,
        costCode: line.costCode.trim().toUpperCase(),
        description: line.description.trim(),
        quantity,
        unit: line.unit.trim().toUpperCase(),
        unitRate,
        budgetAmount: quantity.mul(unitRate).toDecimalPlaces(2),
      };
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const budget = await tx.projectBudget.create({
          data: {
            tenantId,
            projectId,
            createdById: actorId,
            name: command.name.trim(),
            revision,
            currency: command.currency,
          },
        });
        await tx.budgetLine.createMany({
          data: normalizedLines.map((line) => ({ ...line, budgetId: budget.id })),
        });
        const totalBudget = normalizedLines.reduce(
          (sum, line) => sum.plus(line.budgetAmount),
          new Prisma.Decimal(0),
        );
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "PROJECT_BUDGET_CREATED",
            entityType: "ProjectBudget",
            entityId: budget.id,
            metadata: {
              projectId,
              revision,
              currency: command.currency,
              lines: normalizedLines.length,
              totalBudget: this.money(totalBudget),
            },
          },
        });
        return {
          ...(await tx.projectBudget.findUniqueOrThrow({
            where: { id: budget.id },
            include: { _count: { select: { lines: true } } },
          })),
          totalBudget: this.money(totalBudget),
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Budget revision or line already exists");
      }
      throw error;
    }
  }

  async publishBudget(
    tenantId: string,
    projectId: string,
    budgetId: string,
    actorId: string,
  ) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id: budgetId, tenantId, projectId },
      include: { _count: { select: { lines: true } } },
    });
    if (!budget) throw new NotFoundException("Budget revision not found");
    if (budget.status !== "DRAFT") {
      throw new ConflictException("Only a draft budget can be published");
    }
    if (!budget._count.lines) throw new ConflictException("An empty budget cannot be published");

    return this.prisma.$transaction(
      async (tx) => {
        const lockedProject = await tx.project.updateMany({
          where: { id: projectId, tenantId },
          data: { activeBudgetId: budgetId },
        });
        if (lockedProject.count !== 1) throw new NotFoundException("Project not found");

        await tx.projectBudget.updateMany({
          where: {
            tenantId,
            projectId,
            id: { not: budgetId },
            status: "PUBLISHED",
          },
          data: { status: "SUPERSEDED" },
        });
        const published = await tx.projectBudget.updateMany({
          where: { id: budgetId, tenantId, projectId, status: "DRAFT" },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        if (published.count !== 1) {
          throw new ConflictException("Budget state changed concurrently");
        }

        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "PROJECT_BUDGET_PUBLISHED",
            entityType: "ProjectBudget",
            entityId: budgetId,
            metadata: { projectId, revision: budget.revision, currency: budget.currency },
          },
        });
        return tx.projectBudget.findUniqueOrThrow({
          where: { id: budgetId },
          include: { _count: { select: { lines: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async postEntry(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateCostEntryDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: {
        activeBudget: {
          select: { id: true, currency: true },
        },
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeBudget) {
      throw new ConflictException("Publish a budget before posting cost entries");
    }
    if (command.currency !== project.activeBudget.currency) {
      throw new BadRequestException("Cost entry currency must match the active budget");
    }

    const wbs = await this.prisma.wbsNode.findFirst({
      where: { id: command.wbsNodeId, tenantId, projectId },
      select: { id: true },
    });
    if (!wbs) throw new NotFoundException("WBS node not found in this project");

    if (command.budgetLineId) {
      const line = await this.prisma.budgetLine.findFirst({
        where: {
          id: command.budgetLineId,
          tenantId,
          budgetId: project.activeBudget.id,
          wbsNodeId: command.wbsNodeId,
        },
        select: { id: true },
      });
      if (!line) {
        throw new BadRequestException(
          "Budget line must belong to the active budget and selected WBS",
        );
      }
    }

    const amount = new Prisma.Decimal(command.amount).toDecimalPlaces(2);
    if (amount.eq(0)) throw new BadRequestException("Cost entry amount cannot be zero");

    try {
      return await this.prisma.$transaction(async (tx) => {
        const entry = await tx.costLedgerEntry.create({
          data: {
            tenantId,
            projectId,
            createdById: actorId,
            wbsNodeId: command.wbsNodeId,
            ...(command.budgetLineId ? { budgetLineId: command.budgetLineId } : {}),
            entryType: command.entryType,
            externalId: command.externalId.trim(),
            description: command.description.trim(),
            amount,
            currency: command.currency,
            occurredAt: new Date(command.occurredAt),
          },
        });
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: `COST_${command.entryType}_POSTED`,
            entityType: "CostLedgerEntry",
            entityId: entry.id,
            metadata: {
              projectId,
              wbsNodeId: entry.wbsNodeId,
              externalId: entry.externalId,
              amount: this.money(amount),
              currency: entry.currency,
            },
          },
        });
        return { ...entry, amount: this.money(entry.amount) };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Cost entry external ID already exists");
      }
      throw error;
    }
  }

  async ledger(tenantId: string, projectId: string, page: number, limit: number) {
    await this.requireProject(tenantId, projectId);
    const take = Math.min(Math.max(limit, 1), 200);
    const currentPage = Math.max(page, 1);
    const where = { tenantId, projectId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.costLedgerEntry.count({ where }),
      this.prisma.costLedgerEntry.findMany({
        where,
        skip: (currentPage - 1) * take,
        take,
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        include: {
          wbsNode: { select: { id: true, code: true, name: true } },
          budgetLine: { select: { id: true, costCode: true, description: true } },
          createdBy: { select: { id: true, displayName: true } },
        },
      }),
    ]);
    return {
      total,
      page: currentPage,
      limit: take,
      rows: rows.map((row) => ({ ...row, amount: this.money(row.amount) })),
    };
  }

  async control(tenantId: string, projectId: string, requestedDate?: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeBudgetId: true, activeScheduleId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    const asOf = requestedDate ? this.parseDateOnly(requestedDate) : new Date();

    if (!project.activeBudgetId) {
      return { budget: null, asOf: asOf.toISOString(), summary: null, wbs: [] };
    }

    const budget = await this.prisma.projectBudget.findFirstOrThrow({
      where: {
        id: project.activeBudgetId,
        tenantId,
        projectId,
        status: "PUBLISHED",
      },
      include: {
        lines: {
          include: {
            wbsNode: {
              select: {
                code: true,
                name: true,
                progressUpdates: {
                  where: { status: "APPROVED", reportedAt: { lte: asOf } },
                  orderBy: { reportedAt: "desc" },
                  take: 1,
                  select: { percent: true },
                },
              },
            },
          },
        },
      },
    });

    const wbsNodeIds = [...new Set(budget.lines.map((line) => line.wbsNodeId))];
    const [activities, ledgerGroups] = await Promise.all([
      project.activeScheduleId
        ? this.prisma.scheduleActivity.findMany({
            where: {
              tenantId,
              scheduleId: project.activeScheduleId,
              wbsNodeId: { in: wbsNodeIds },
            },
            select: {
              wbsNodeId: true,
              plannedStart: true,
              plannedFinish: true,
              weight: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.costLedgerEntry.groupBy({
        by: ["wbsNodeId", "entryType"],
        where: { tenantId, projectId, occurredAt: { lte: asOf } },
        _sum: { amount: true },
      }),
    ]);

    const activitiesByWbs = new Map<string, typeof activities>();
    for (const activity of activities) {
      const rows = activitiesByWbs.get(activity.wbsNodeId) ?? [];
      rows.push(activity);
      activitiesByWbs.set(activity.wbsNodeId, rows);
    }
    const ledgerByWbs = new Map<string, { committed: Prisma.Decimal; actual: Prisma.Decimal }>();
    for (const group of ledgerGroups) {
      const current = ledgerByWbs.get(group.wbsNodeId) ?? {
        committed: new Prisma.Decimal(0),
        actual: new Prisma.Decimal(0),
      };
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      if (group.entryType === "COMMITMENT") current.committed = amount;
      else current.actual = amount;
      ledgerByWbs.set(group.wbsNodeId, current);
    }

    const lineGroups = new Map<string, typeof budget.lines>();
    for (const line of budget.lines) {
      const rows = lineGroups.get(line.wbsNodeId) ?? [];
      rows.push(line);
      lineGroups.set(line.wbsNodeId, rows);
    }

    let bac = new Prisma.Decimal(0);
    let pv = new Prisma.Decimal(0);
    let ev = new Prisma.Decimal(0);
    let ac = new Prisma.Decimal(0);
    let committed = new Prisma.Decimal(0);
    let exposure = new Prisma.Decimal(0);
    const wbs: WbsCostMetric[] = [];

    for (const [wbsNodeId, lines] of lineGroups) {
      const budgetAmount = lines.reduce(
        (sum, line) => sum.plus(line.budgetAmount),
        new Prisma.Decimal(0),
      );
      const progress = Number(lines[0]?.wbsNode.progressUpdates[0]?.percent ?? 0);
      const plannedProgress = this.plannedProgress(
        asOf,
        activitiesByWbs.get(wbsNodeId) ?? [],
      );
      const plannedValue = budgetAmount.mul(plannedProgress).div(100);
      const earnedValue = budgetAmount.mul(progress).div(100);
      const ledger = ledgerByWbs.get(wbsNodeId) ?? {
        committed: new Prisma.Decimal(0),
        actual: new Prisma.Decimal(0),
      };
      const costVariance = earnedValue.minus(ledger.actual);
      const scheduleVariance = earnedValue.minus(plannedValue);
      const forecastExposure = ledger.actual.greaterThan(ledger.committed)
        ? ledger.actual
        : ledger.committed;

      bac = bac.plus(budgetAmount);
      pv = pv.plus(plannedValue);
      ev = ev.plus(earnedValue);
      ac = ac.plus(ledger.actual);
      committed = committed.plus(ledger.committed);
      exposure = exposure.plus(forecastExposure);
      wbs.push({
        wbsNodeId,
        code: lines[0]!.wbsNode.code,
        name: lines[0]!.wbsNode.name,
        budget: this.money(budgetAmount),
        plannedProgress: this.percent(plannedProgress),
        actualProgress: this.percent(progress),
        plannedValue: this.money(plannedValue),
        earnedValue: this.money(earnedValue),
        committed: this.money(ledger.committed),
        actualCost: this.money(ledger.actual),
        costVariance: this.money(costVariance),
        scheduleVariance: this.money(scheduleVariance),
        forecastExposure: this.money(forecastExposure),
      });
    }

    const cpi = ac.gt(0) ? ev.div(ac).toNumber() : null;
    const spi = pv.gt(0) ? ev.div(pv).toNumber() : null;
    const eac = cpi !== null && cpi > 0 ? bac.div(cpi) : null;

    return {
      budget: {
        id: budget.id,
        name: budget.name,
        revision: budget.revision,
        currency: budget.currency,
      },
      asOf: asOf.toISOString(),
      summary: {
        budgetAtCompletion: this.money(bac),
        plannedValue: this.money(pv),
        earnedValue: this.money(ev),
        actualCost: this.money(ac),
        commitments: this.money(committed),
        forecastExposure: this.money(exposure),
        costVariance: this.money(ev.minus(ac)),
        scheduleVariance: this.money(ev.minus(pv)),
        cpi: cpi === null ? null : this.ratio(cpi),
        spi: spi === null ? null : this.ratio(spi),
        estimateAtCompletion: eac ? this.money(eac) : null,
        estimateToComplete: eac ? this.money(eac.minus(ac)) : null,
        varianceAtCompletion: eac ? this.money(bac.minus(eac)) : null,
      },
      wbs: wbs.sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  async fiveDState(tenantId: string, bimModelId: string, requestedDate?: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      select: { projectId: true },
    });
    if (!model) throw new NotFoundException("BIM model not found");

    const control = await this.control(tenantId, model.projectId, requestedDate);
    if (!control.budget) {
      return { budget: null, asOf: control.asOf, summary: null, elements: [] };
    }

    const metrics = new Map(control.wbs.map((metric) => [metric.wbsNodeId, metric]));
    const wbsNodeIds = [...metrics.keys()];
    const [elements, weightGroups] = await Promise.all([
      this.prisma.bimElement.findMany({
        where: { tenantId, bimModelId },
        select: {
          globalId: true,
          wbsLinks: {
            where: { wbsNodeId: { in: wbsNodeIds } },
            select: { wbsNodeId: true, weight: true },
          },
        },
      }),
      this.prisma.bimWbsLink.groupBy({
        by: ["wbsNodeId"],
        where: { tenantId, wbsNodeId: { in: wbsNodeIds } },
        _sum: { weight: true },
      }),
    ]);
    const totalWeights = new Map(
      weightGroups.map((group) => [
        group.wbsNodeId,
        Number(group._sum.weight ?? 0),
      ]),
    );

    const states = elements.map((element) => {
      let budget = 0;
      let earnedValue = 0;
      let actualCost = 0;
      let commitments = 0;
      for (const link of element.wbsLinks) {
        const metric = metrics.get(link.wbsNodeId);
        const totalWeight = totalWeights.get(link.wbsNodeId) ?? 0;
        if (!metric || totalWeight <= 0) continue;
        const share = Number(link.weight) / totalWeight;
        budget += Number(metric.budget) * share;
        earnedValue += Number(metric.earnedValue) * share;
        actualCost += Number(metric.actualCost) * share;
        commitments += Number(metric.committed) * share;
      }
      const costVariance = earnedValue - actualCost;
      const overrunThreshold = Math.max(budget * 0.05, 1);
      const costState =
        budget <= 0
          ? "UNBUDGETED"
          : costVariance < -overrunThreshold
            ? "OVERRUN"
            : commitments > budget
              ? "OVERCOMMITTED"
              : "CONTROLLED";
      return {
        globalId: element.globalId,
        costState,
        currency: control.budget.currency,
        budget: this.numberMoney(budget),
        earnedValue: this.numberMoney(earnedValue),
        actualCost: this.numberMoney(actualCost),
        commitments: this.numberMoney(commitments),
        costVariance: this.numberMoney(costVariance),
      };
    });

    return {
      budget: control.budget,
      asOf: control.asOf,
      summary: control.summary,
      elements: states,
    };
  }

  private plannedProgress(
    date: Date,
    activities: Array<{
      plannedStart: Date;
      plannedFinish: Date;
      weight: Prisma.Decimal;
    }>,
  ) {
    const totalWeight = activities.reduce(
      (sum, activity) => sum + Number(activity.weight),
      0,
    );
    if (totalWeight <= 0) return 0;
    return (
      activities.reduce(
        (sum, activity) =>
          sum +
          this.expectedAt(date, activity.plannedStart, activity.plannedFinish) *
            Number(activity.weight),
        0,
      ) / totalWeight
    );
  }

  private expectedAt(date: Date, start: Date, finish: Date) {
    if (date <= start) return 0;
    if (date >= finish) return 100;
    const duration = finish.getTime() - start.getTime();
    if (duration <= 0) return 100;
    return ((date.getTime() - start.getTime()) / duration) * 100;
  }

  private parseDateOnly(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("Cost-control date must use YYYY-MM-DD");
    }
    const start = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(start.getTime()) ||
      start.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException("Invalid cost-control date");
    }
    return new Date(`${value}T23:59:59.999Z`);
  }

  private money(value: Prisma.Decimal) {
    return value.toDecimalPlaces(2).toFixed(2);
  }

  private numberMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private percent(value: number) {
    return Math.round(value * 100) / 100;
  }

  private ratio(value: number) {
    return Math.round(value * 1000) / 1000;
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
