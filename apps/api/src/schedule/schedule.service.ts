import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateScheduleDto } from "./schedule.dto";

type PlannedState = "UNSCHEDULED" | "FUTURE" | "ACTIVE" | "PLANNED_COMPLETE";

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.projectSchedule.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { activities: true, dependencies: true } },
      },
    });
  }

  async active(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeScheduleId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeScheduleId) throw new NotFoundException("No published schedule exists");

    return this.prisma.projectSchedule.findFirstOrThrow({
      where: { id: project.activeScheduleId, tenantId, projectId },
      include: {
        activities: { orderBy: [{ plannedStart: "asc" }, { externalId: "asc" }] },
        dependencies: {
          include: {
            predecessor: { select: { externalId: true } },
            successor: { select: { externalId: true } },
          },
        },
      },
    });
  }

  async create(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateScheduleDto,
  ) {
    await this.requireProject(tenantId, projectId);
    this.validateNetwork(command);

    const wbsNodeIds = [...new Set(command.activities.map((activity) => activity.wbsNodeId))];
    const wbsCount = await this.prisma.wbsNode.count({
      where: { id: { in: wbsNodeIds }, tenantId, projectId },
    });
    if (wbsCount !== wbsNodeIds.length) {
      throw new BadRequestException("Every activity must reference a WBS node in this project");
    }

    const existing = await this.prisma.projectSchedule.findFirst({
      where: { projectId, revision: command.revision.trim() },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Schedule revision already exists");

    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.projectSchedule.create({
        data: {
          tenantId,
          projectId,
          createdById: actorId,
          name: command.name.trim(),
          revision: command.revision.trim(),
          dataDate: new Date(command.dataDate),
        },
      });

      await tx.scheduleActivity.createMany({
        data: command.activities.map((activity) => ({
          tenantId,
          scheduleId: schedule.id,
          wbsNodeId: activity.wbsNodeId,
          externalId: activity.externalId.trim(),
          name: activity.name.trim(),
          plannedStart: new Date(activity.plannedStart),
          plannedFinish: new Date(activity.plannedFinish),
          weight: activity.weight ?? 1,
        })),
      });

      const storedActivities = await tx.scheduleActivity.findMany({
        where: { scheduleId: schedule.id },
        select: { id: true, externalId: true },
      });
      const activityIds = new Map(
        storedActivities.map((activity) => [activity.externalId, activity.id]),
      );

      if (command.dependencies.length) {
        await tx.scheduleDependency.createMany({
          data: command.dependencies.map((dependency) => ({
            tenantId,
            scheduleId: schedule.id,
            predecessorActivityId: activityIds.get(
              dependency.predecessorExternalId.trim(),
            )!,
            successorActivityId: activityIds.get(dependency.successorExternalId.trim())!,
            type: dependency.type,
            lagDays: dependency.lagDays ?? 0,
          })),
        });
      }

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "PROJECT_SCHEDULE_CREATED",
          entityType: "ProjectSchedule",
          entityId: schedule.id,
          metadata: {
            projectId,
            revision: schedule.revision,
            activities: command.activities.length,
            dependencies: command.dependencies.length,
          },
        },
      });

      return tx.projectSchedule.findUniqueOrThrow({
        where: { id: schedule.id },
        include: { _count: { select: { activities: true, dependencies: true } } },
      });
    });
  }

  async publish(
    tenantId: string,
    projectId: string,
    scheduleId: string,
    actorId: string,
  ) {
    const schedule = await this.prisma.projectSchedule.findFirst({
      where: { id: scheduleId, tenantId, projectId },
      include: { _count: { select: { activities: true } } },
    });
    if (!schedule) throw new NotFoundException("Schedule revision not found");
    if (schedule.status !== "DRAFT") {
      throw new ConflictException("Only a draft schedule can be published");
    }
    if (!schedule._count.activities) {
      throw new ConflictException("An empty schedule cannot be published");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const lockedProject = await tx.project.updateMany({
          where: { id: projectId, tenantId },
          data: { activeScheduleId: scheduleId },
        });
        if (lockedProject.count !== 1) throw new NotFoundException("Project not found");

        await tx.projectSchedule.updateMany({
          where: {
            tenantId,
            projectId,
            id: { not: scheduleId },
            status: "PUBLISHED",
          },
          data: { status: "SUPERSEDED" },
        });

        const published = await tx.projectSchedule.updateMany({
          where: { id: scheduleId, tenantId, projectId, status: "DRAFT" },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        if (published.count !== 1) {
          throw new ConflictException("Schedule state changed concurrently");
        }

        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "PROJECT_SCHEDULE_PUBLISHED",
            entityType: "ProjectSchedule",
            entityId: scheduleId,
            metadata: { projectId, revision: schedule.revision },
          },
        });

        return tx.projectSchedule.findUniqueOrThrow({
          where: { id: scheduleId },
          include: { _count: { select: { activities: true, dependencies: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async fourDState(tenantId: string, bimModelId: string, requestedDate?: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            activeSchedule: {
              include: {
                activities: {
                  orderBy: [{ plannedStart: "asc" }, { externalId: "asc" }],
                },
              },
            },
          },
        },
      },
    });
    if (!model) throw new NotFoundException("BIM model not found");

    const schedule = model.project.activeSchedule;
    if (!schedule || schedule.status !== "PUBLISHED") {
      return { schedule: null, selectedDate: null, summary: null, elements: [] };
    }

    const requested = requestedDate
      ? this.parseDateOnly(requestedDate)
      : new Date(schedule.dataDate);
    const starts = schedule.activities.map((activity) => activity.plannedStart.getTime());
    const finishes = schedule.activities.map((activity) => activity.plannedFinish.getTime());
    const scheduleStart = new Date(Math.min(...starts));
    const scheduleFinish = new Date(Math.max(...finishes));
    const selectedDate = new Date(
      Math.min(
        scheduleFinish.getTime(),
        Math.max(scheduleStart.getTime(), requested.getTime()),
      ),
    );

    const elements = await this.prisma.bimElement.findMany({
      where: { tenantId, bimModelId },
      select: {
        globalId: true,
        wbsLinks: {
          select: {
            weight: true,
            wbsNode: {
              select: {
                scheduleActivities: { where: { scheduleId: schedule.id } },
                progressUpdates: {
                  where: { status: "APPROVED" },
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

    const states = elements.map((element) => {
      const windows = element.wbsLinks.flatMap((link) =>
        link.wbsNode.scheduleActivities.map((activity) => ({
          start: activity.plannedStart,
          finish: activity.plannedFinish,
          weight: Number(activity.weight) * Number(link.weight),
        })),
      );
      if (!windows.length) {
        return {
          globalId: element.globalId,
          scheduled: false,
          plannedState: "UNSCHEDULED" as PlannedState,
          plannedStart: null,
          plannedFinish: null,
          expectedProgress: null,
          actualProgress: null,
          variance: null,
        };
      }

      const plannedStart = new Date(Math.min(...windows.map((window) => window.start.getTime())));
      const plannedFinish = new Date(
        Math.max(...windows.map((window) => window.finish.getTime())),
      );
      const plannedState: PlannedState =
        selectedDate < plannedStart
          ? "FUTURE"
          : selectedDate >= plannedFinish
            ? "PLANNED_COMPLETE"
            : "ACTIVE";

      const totalPlanWeight = windows.reduce((sum, window) => sum + window.weight, 0);
      const expectedProgress =
        totalPlanWeight > 0
          ? windows.reduce(
              (sum, window) =>
                sum + this.expectedAt(selectedDate, window.start, window.finish) * window.weight,
              0,
            ) / totalPlanWeight
          : 0;

      const reported = element.wbsLinks.filter(
        (link) => link.wbsNode.progressUpdates.length > 0,
      );
      const totalActualWeight = reported.reduce(
        (sum, link) => sum + Number(link.weight),
        0,
      );
      const actualProgress =
        totalActualWeight > 0
          ? reported.reduce(
              (sum, link) =>
                sum +
                Number(link.weight) *
                  Number(link.wbsNode.progressUpdates[0]?.percent ?? 0),
              0,
            ) / totalActualWeight
          : null;
      const roundedExpected = this.round(expectedProgress);
      const roundedActual =
        actualProgress === null ? null : this.round(actualProgress);

      return {
        globalId: element.globalId,
        scheduled: true,
        plannedState,
        plannedStart: plannedStart.toISOString(),
        plannedFinish: plannedFinish.toISOString(),
        expectedProgress: roundedExpected,
        actualProgress: roundedActual,
        variance:
          roundedActual === null ? null : this.round(roundedActual - roundedExpected),
      };
    });

    return {
      schedule: {
        id: schedule.id,
        name: schedule.name,
        revision: schedule.revision,
        dataDate: schedule.dataDate.toISOString(),
        start: scheduleStart.toISOString(),
        finish: scheduleFinish.toISOString(),
      },
      selectedDate: selectedDate.toISOString(),
      summary: {
        elements: states.length,
        scheduled: states.filter((state) => state.scheduled).length,
        future: states.filter((state) => state.plannedState === "FUTURE").length,
        active: states.filter((state) => state.plannedState === "ACTIVE").length,
        plannedComplete: states.filter(
          (state) => state.plannedState === "PLANNED_COMPLETE",
        ).length,
        behind: states.filter(
          (state) => state.variance !== null && state.variance < -10,
        ).length,
      },
      elements: states,
    };
  }

  private validateNetwork(command: CreateScheduleDto) {
    const ids = command.activities.map((activity) => activity.externalId.trim());
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Activity external IDs must be unique");
    }

    for (const activity of command.activities) {
      if (new Date(activity.plannedStart) > new Date(activity.plannedFinish)) {
        throw new BadRequestException(
          `Activity ${activity.externalId} finishes before it starts`,
        );
      }
    }

    const known = new Set(ids);
    const graph = new Map(ids.map((id) => [id, [] as string[]]));
    const indegree = new Map(ids.map((id) => [id, 0]));
    const dependencyKeys = new Set<string>();
    for (const dependency of command.dependencies) {
      const predecessor = dependency.predecessorExternalId.trim();
      const successor = dependency.successorExternalId.trim();
      if (!known.has(predecessor) || !known.has(successor)) {
        throw new BadRequestException("Every dependency endpoint must be an activity");
      }
      if (predecessor === successor) {
        throw new BadRequestException("An activity cannot depend on itself");
      }
      const key = `${predecessor}|${successor}|${dependency.type}`;
      if (dependencyKeys.has(key)) {
        throw new BadRequestException("Duplicate schedule dependency");
      }
      dependencyKeys.add(key);
      graph.get(predecessor)!.push(successor);
      indegree.set(successor, indegree.get(successor)! + 1);
    }

    const ready = ids.filter((id) => indegree.get(id) === 0);
    let visited = 0;
    for (let index = 0; index < ready.length; index += 1) {
      const id = ready[index]!;
      visited += 1;
      for (const successor of graph.get(id) ?? []) {
        const remaining = indegree.get(successor)! - 1;
        indegree.set(successor, remaining);
        if (remaining === 0) ready.push(successor);
      }
    }
    if (visited !== ids.length) {
      throw new BadRequestException("Schedule dependencies contain a cycle");
    }
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
      throw new BadRequestException("4D date must use YYYY-MM-DD");
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException("Invalid 4D date");
    }
    return date;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
