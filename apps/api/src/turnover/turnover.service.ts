import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CommissioningTestStatus,
  HandoverPackageStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCommissioningPlanDto,
  CreateHandoverPackageDto,
  ProvideHandoverRequirementDto,
  ReviewCommissioningTestDto,
  ReviewHandoverPackageDto,
  ScheduleCommissioningTestDto,
  SubmitCommissioningTestDto,
} from "./turnover.dto";

@Injectable()
export class TurnoverService {
  constructor(private readonly prisma: PrismaService) {}

  async plans(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.commissioningPlan.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { checkpoints: true } },
      },
    });
  }

  async activePlan(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeCommissioningPlanId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeCommissioningPlanId) {
      throw new NotFoundException("No published commissioning plan exists");
    }
    return this.prisma.commissioningPlan.findFirstOrThrow({
      where: {
        id: project.activeCommissioningPlanId,
        tenantId,
        projectId,
      },
      include: {
        checkpoints: {
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
          include: { wbsNode: { select: { id: true, code: true, name: true } } },
        },
      },
    });
  }

  async createPlan(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateCommissioningPlanDto,
  ) {
    await this.requireProject(tenantId, projectId);
    const codes = command.checkpoints.map((item) => item.code.trim().toUpperCase());
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException("Checkpoint codes must be unique within a plan");
    }
    const wbsIds = [
      ...new Set(
        command.checkpoints
          .map((item) => item.wbsNodeId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    if (wbsIds.length) {
      const count = await this.prisma.wbsNode.count({
        where: { id: { in: wbsIds }, tenantId, projectId },
      });
      if (count !== wbsIds.length) {
        throw new BadRequestException("Every checkpoint WBS node must belong to this project");
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const plan = await tx.commissioningPlan.create({
          data: {
            tenantId,
            projectId,
            revision: command.revision.trim(),
            name: command.name.trim(),
            createdById: actorId,
          },
        });
        await tx.commissioningCheckpoint.createMany({
          data: command.checkpoints.map((item, index) => ({
            tenantId,
            commissioningPlanId: plan.id,
            wbsNodeId: item.wbsNodeId,
            code: item.code.trim().toUpperCase(),
            title: item.title.trim(),
            system: item.system.trim().toUpperCase(),
            acceptanceCriteria: item.acceptanceCriteria.trim(),
            holdPoint: item.holdPoint ?? false,
            ifcType: item.ifcType?.trim().toUpperCase(),
            sortOrder: item.sortOrder ?? index,
          })),
        });
        await this.audit(tx, tenantId, actorId, "COMMISSIONING_PLAN_CREATED", "CommissioningPlan", plan.id, {
          projectId,
          revision: plan.revision,
          checkpoints: command.checkpoints.length,
        });
        return tx.commissioningPlan.findUniqueOrThrow({
          where: { id: plan.id },
          include: { _count: { select: { checkpoints: true } } },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Commissioning plan revision or checkpoint already exists");
      }
      throw error;
    }
  }

  async publishPlan(
    tenantId: string,
    projectId: string,
    planId: string,
    actorId: string,
  ) {
    const plan = await this.prisma.commissioningPlan.findFirst({
      where: { id: planId, tenantId, projectId },
      include: { _count: { select: { checkpoints: true } } },
    });
    if (!plan) throw new NotFoundException("Commissioning plan not found");
    if (plan.status !== "DRAFT") {
      throw new ConflictException("Only a draft commissioning plan can be published");
    }
    if (!plan._count.checkpoints) {
      throw new ConflictException("An empty commissioning plan cannot be published");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const project = await tx.project.updateMany({
          where: { id: projectId, tenantId },
          data: { activeCommissioningPlanId: planId },
        });
        if (project.count !== 1) throw new NotFoundException("Project not found");
        await tx.commissioningPlan.updateMany({
          where: {
            tenantId,
            projectId,
            id: { not: planId },
            status: "PUBLISHED",
          },
          data: { status: "SUPERSEDED" },
        });
        const published = await tx.commissioningPlan.updateMany({
          where: { id: planId, tenantId, projectId, status: "DRAFT" },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        if (published.count !== 1) {
          throw new ConflictException("Commissioning plan state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "COMMISSIONING_PLAN_PUBLISHED", "CommissioningPlan", planId, {
          projectId,
          revision: plan.revision,
        });
        return tx.commissioningPlan.findUniqueOrThrow({
          where: { id: planId },
          include: { _count: { select: { checkpoints: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async tests(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.testStatus(status);
    return this.prisma.commissioningTest.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      include: {
        checkpoint: {
          select: { code: true, title: true, system: true, holdPoint: true },
        },
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        performedBy: { select: { id: true, displayName: true } },
        reviewedBy: { select: { id: true, displayName: true } },
        _count: { select: { evidence: true } },
      },
      take: 500,
    });
  }

  async scheduleTest(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: ScheduleCommissioningTestDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeCommissioningPlanId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeCommissioningPlanId) {
      throw new ConflictException("Publish a commissioning plan before scheduling tests");
    }
    const checkpoint = await this.prisma.commissioningCheckpoint.findFirst({
      where: {
        id: command.checkpointId,
        tenantId,
        commissioningPlanId: project.activeCommissioningPlanId,
      },
    });
    if (!checkpoint) {
      throw new BadRequestException("Checkpoint must belong to the active commissioning plan");
    }
    if (checkpoint.wbsNodeId && checkpoint.wbsNodeId !== command.wbsNodeId) {
      throw new BadRequestException("Test WBS must match the checkpoint WBS");
    }
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    await this.requireProjectMember(projectId, command.performedById);
    const element = await this.requireElement(tenantId, projectId, command.bimElementId);
    if (
      checkpoint.ifcType &&
      element &&
      checkpoint.ifcType !== element.ifcType.toUpperCase()
    ) {
      throw new BadRequestException("BIM element type does not match the checkpoint");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const test = await tx.commissioningTest.create({
          data: {
            tenantId,
            projectId,
            checkpointId: command.checkpointId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            scheduledFor: new Date(command.scheduledFor),
            performedById: command.performedById,
          },
          include: { checkpoint: true, wbsNode: true, bimElement: true },
        });
        await this.audit(tx, tenantId, actorId, "COMMISSIONING_TEST_SCHEDULED", "CommissioningTest", test.id, {
          projectId,
          externalId: test.externalId,
          checkpointId: test.checkpointId,
          performedById: test.performedById,
        });
        return test;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Commissioning test external ID already exists");
      }
      throw error;
    }
  }

  async submitTest(
    tenantId: string,
    projectId: string,
    testId: string,
    actorId: string,
    command: SubmitCommissioningTestDto,
  ) {
    const test = await this.requireTest(tenantId, projectId, testId);
    if (test.performedById !== actorId) {
      throw new ForbiddenException("Only the assigned performer may submit this test");
    }
    if (test.status !== "SCHEDULED") {
      throw new ConflictException("Only a scheduled test can be submitted");
    }
    const evidenceIds = this.unique(command.evidenceDocumentVersionIds ?? []);
    await this.requireEvidence(tenantId, projectId, evidenceIds);

    return this.prisma.$transaction(
      async (tx) => {
        const changed = await tx.commissioningTest.updateMany({
          where: { id: testId, tenantId, projectId, status: "SCHEDULED" },
          data: {
            status: "SUBMITTED",
            result: command.result,
            readings: command.readings ?? undefined,
            notes: command.notes?.trim(),
            submittedAt: new Date(),
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Commissioning test state changed concurrently");
        }
        if (evidenceIds.length) {
          await tx.commissioningEvidence.createMany({
            data: evidenceIds.map((documentVersionId) => ({
              tenantId,
              commissioningTestId: testId,
              documentVersionId,
              addedById: actorId,
            })),
          });
        }
        await this.audit(tx, tenantId, actorId, "COMMISSIONING_TEST_SUBMITTED", "CommissioningTest", testId, {
          projectId,
          result: command.result,
          evidence: evidenceIds.length,
        });
        return tx.commissioningTest.findUniqueOrThrow({
          where: { id: testId },
          include: { evidence: true, checkpoint: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reviewTest(
    tenantId: string,
    projectId: string,
    testId: string,
    actorId: string,
    command: ReviewCommissioningTestDto,
  ) {
    const test = await this.requireTest(tenantId, projectId, testId);
    if (test.performedById === actorId) {
      throw new ForbiddenException("Test performer and reviewer must be different users");
    }
    if (test.status !== "SUBMITTED") {
      throw new ConflictException("Only a submitted test can be reviewed");
    }
    if (
      command.accept &&
      test.result !== "PASS" &&
      test.result !== "NOT_APPLICABLE"
    ) {
      throw new ConflictException("Failed or conditional tests cannot be accepted");
    }
    const status = command.accept ? "ACCEPTED" : "REJECTED";
    const changed = await this.prisma.commissioningTest.updateMany({
      where: { id: testId, tenantId, projectId, status: "SUBMITTED" },
      data: {
        status,
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewComment: command.comment.trim(),
      },
    });
    if (changed.count !== 1) {
      throw new ConflictException("Commissioning test state changed concurrently");
    }
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "COMMISSIONING_TEST_REVIEWED",
        entityType: "CommissioningTest",
        entityId: testId,
        metadata: { projectId, status, result: test.result },
      },
    });
    return this.prisma.commissioningTest.findUniqueOrThrow({
      where: { id: testId },
      include: { checkpoint: true, evidence: true },
    });
  }

  async packages(tenantId: string, projectId: string, status?: string) {
    await this.requireProject(tenantId, projectId);
    const parsed = this.packageStatus(status);
    return this.prisma.handoverPackage.findMany({
      where: { tenantId, projectId, ...(parsed ? { status: parsed } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        wbsNode: { select: { code: true, name: true } },
        bimElement: { select: { globalId: true, ifcType: true, name: true } },
        createdBy: { select: { id: true, displayName: true } },
        reviewedBy: { select: { id: true, displayName: true } },
        requirements: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }] },
      },
      take: 500,
    });
  }

  async createPackage(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateHandoverPackageDto,
  ) {
    await this.requireProject(tenantId, projectId);
    await this.requireWbs(tenantId, projectId, command.wbsNodeId);
    await this.requireElement(tenantId, projectId, command.bimElementId);
    const codes = command.requirements.map((item) => item.code.trim().toUpperCase());
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException("Handover requirement codes must be unique");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const pack = await tx.handoverPackage.create({
          data: {
            tenantId,
            projectId,
            wbsNodeId: command.wbsNodeId,
            bimElementId: command.bimElementId,
            externalId: command.externalId.trim().toUpperCase(),
            name: command.name.trim(),
            system: command.system.trim().toUpperCase(),
            createdById: actorId,
          },
        });
        await tx.handoverRequirement.createMany({
          data: command.requirements.map((item, index) => ({
            tenantId,
            handoverPackageId: pack.id,
            code: item.code.trim().toUpperCase(),
            title: item.title.trim(),
            documentType: item.documentType.trim().toUpperCase(),
            sortOrder: item.sortOrder ?? index,
          })),
        });
        await this.audit(tx, tenantId, actorId, "HANDOVER_PACKAGE_CREATED", "HandoverPackage", pack.id, {
          projectId,
          externalId: pack.externalId,
          requirements: command.requirements.length,
        });
        return tx.handoverPackage.findUniqueOrThrow({
          where: { id: pack.id },
          include: { requirements: true },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Handover package or requirement code already exists");
      }
      throw error;
    }
  }

  async provideRequirement(
    tenantId: string,
    projectId: string,
    packageId: string,
    requirementId: string,
    actorId: string,
    command: ProvideHandoverRequirementDto,
  ) {
    const pack = await this.requirePackage(tenantId, projectId, packageId);
    if (pack.status !== "DRAFT" && pack.status !== "RETURNED") {
      throw new ConflictException("Requirements can only be provided to draft or returned packages");
    }
    await this.requireEvidence(tenantId, projectId, [command.documentVersionId]);
    const changed = await this.prisma.handoverRequirement.updateMany({
      where: { id: requirementId, tenantId, handoverPackageId: packageId },
      data: {
        status: "PROVIDED",
        documentVersionId: command.documentVersionId,
        providedById: actorId,
        providedAt: new Date(),
        note: command.note?.trim(),
      },
    });
    if (changed.count !== 1) throw new NotFoundException("Handover requirement not found");
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "HANDOVER_REQUIREMENT_PROVIDED",
        entityType: "HandoverRequirement",
        entityId: requirementId,
        metadata: { projectId, packageId, documentVersionId: command.documentVersionId },
      },
    });
    return this.prisma.handoverRequirement.findUniqueOrThrow({
      where: { id: requirementId },
      include: { documentVersion: true },
    });
  }

  async submitPackage(
    tenantId: string,
    projectId: string,
    packageId: string,
    actorId: string,
  ) {
    const pack = await this.prisma.handoverPackage.findFirst({
      where: { id: packageId, tenantId, projectId },
      include: { requirements: true },
    });
    if (!pack) throw new NotFoundException("Handover package not found");
    if (pack.createdById !== actorId) {
      throw new ForbiddenException("Only the package creator may submit it");
    }
    if (pack.status !== "DRAFT" && pack.status !== "RETURNED") {
      throw new ConflictException("Only a draft or returned package can be submitted");
    }
    if (
      pack.requirements.some(
        (item) => !item.documentVersionId || item.status === "MISSING",
      )
    ) {
      throw new ConflictException("Every handover requirement must be provided");
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.handoverRequirement.updateMany({
          where: {
            handoverPackageId: packageId,
            status: { in: ["REJECTED", "ACCEPTED"] },
          },
          data: { status: "PROVIDED" },
        });
        const changed = await tx.handoverPackage.updateMany({
          where: { id: packageId, tenantId, projectId, status: pack.status },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Handover package state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "HANDOVER_PACKAGE_SUBMITTED", "HandoverPackage", packageId, {
          projectId,
          requirements: pack.requirements.length,
        });
        return tx.handoverPackage.findUniqueOrThrow({
          where: { id: packageId },
          include: { requirements: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reviewPackage(
    tenantId: string,
    projectId: string,
    packageId: string,
    actorId: string,
    command: ReviewHandoverPackageDto,
  ) {
    const pack = await this.prisma.handoverPackage.findFirst({
      where: { id: packageId, tenantId, projectId },
      include: { requirements: true },
    });
    if (!pack) throw new NotFoundException("Handover package not found");
    if (pack.createdById === actorId) {
      throw new ForbiddenException("Package creator and reviewer must be different users");
    }
    if (pack.status !== "SUBMITTED") {
      throw new ConflictException("Only a submitted package can be reviewed");
    }
    const rejectedIds = this.unique(command.rejectedRequirementIds ?? []);
    const requirementIds = new Set(pack.requirements.map((item) => item.id));
    if (rejectedIds.some((id) => !requirementIds.has(id))) {
      throw new BadRequestException("Rejected requirements must belong to this package");
    }
    if (command.accept && rejectedIds.length) {
      throw new BadRequestException("Accepted packages cannot reject requirements");
    }
    if (!command.accept && !rejectedIds.length) {
      throw new BadRequestException("Returned packages require at least one rejected requirement");
    }
    if (command.accept) {
      const passed = await this.prisma.commissioningTest.count({
        where: {
          tenantId,
          projectId,
          status: "ACCEPTED",
          result: "PASS",
          ...(pack.bimElementId
            ? { bimElementId: pack.bimElementId }
            : { wbsNodeId: pack.wbsNodeId }),
        },
      });
      if (!passed) {
        throw new ConflictException("Accepted commissioning evidence is required before handover");
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (command.accept) {
          await tx.handoverRequirement.updateMany({
            where: { handoverPackageId: packageId },
            data: { status: "ACCEPTED" },
          });
        } else {
          await tx.handoverRequirement.updateMany({
            where: { handoverPackageId: packageId, id: { in: rejectedIds } },
            data: { status: "REJECTED" },
          });
        }
        const status = command.accept ? "ACCEPTED" : "RETURNED";
        const changed = await tx.handoverPackage.updateMany({
          where: { id: packageId, tenantId, projectId, status: "SUBMITTED" },
          data: {
            status,
            reviewedById: actorId,
            reviewedAt: new Date(),
            reviewComment: command.comment.trim(),
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException("Handover package state changed concurrently");
        }
        await this.audit(tx, tenantId, actorId, "HANDOVER_PACKAGE_REVIEWED", "HandoverPackage", packageId, {
          projectId,
          status,
          rejectedRequirements: rejectedIds,
        });
        return tx.handoverPackage.findUniqueOrThrow({
          where: { id: packageId },
          include: { requirements: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async dashboard(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    const [tests, packages, missingRequirements, rejectedRequirements] =
      await Promise.all([
        this.prisma.commissioningTest.groupBy({
          by: ["status"],
          where: { tenantId, projectId },
          _count: { _all: true },
        }),
        this.prisma.handoverPackage.groupBy({
          by: ["status"],
          where: { tenantId, projectId },
          _count: { _all: true },
        }),
        this.prisma.handoverRequirement.count({
          where: {
            tenantId,
            status: "MISSING",
            handoverPackage: { projectId },
          },
        }),
        this.prisma.handoverRequirement.count({
          where: {
            tenantId,
            status: "REJECTED",
            handoverPackage: { projectId },
          },
        }),
      ]);
    const testCounts = Object.fromEntries(
      tests.map((item) => [item.status, item._count._all]),
    );
    const packageCounts = Object.fromEntries(
      packages.map((item) => [item.status, item._count._all]),
    );
    return {
      tests: {
        scheduled: testCounts.SCHEDULED ?? 0,
        submitted: testCounts.SUBMITTED ?? 0,
        accepted: testCounts.ACCEPTED ?? 0,
        rejected: testCounts.REJECTED ?? 0,
      },
      packages: {
        draft: packageCounts.DRAFT ?? 0,
        submitted: packageCounts.SUBMITTED ?? 0,
        returned: packageCounts.RETURNED ?? 0,
        accepted: packageCounts.ACCEPTED ?? 0,
      },
      requirements: {
        missing: missingRequirements,
        rejected: rejectedRequirements,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async bimState(tenantId: string, bimModelId: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      select: {
        projectId: true,
        elements: {
          select: {
            id: true,
            globalId: true,
            wbsLinks: { select: { wbsNodeId: true } },
          },
        },
      },
    });
    if (!model) throw new NotFoundException("BIM model not found");
    const elementIds = model.elements.map((item) => item.id);
    const wbsIds = [
      ...new Set(model.elements.flatMap((item) => item.wbsLinks.map((link) => link.wbsNodeId))),
    ];
    const [tests, packages] = await Promise.all([
      this.prisma.commissioningTest.findMany({
        where: {
          tenantId,
          projectId: model.projectId,
          OR: [
            { bimElementId: { in: elementIds } },
            { bimElementId: null, wbsNodeId: { in: wbsIds } },
          ],
        },
        orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          externalId: true,
          bimElementId: true,
          wbsNodeId: true,
          status: true,
          result: true,
          scheduledFor: true,
        },
      }),
      this.prisma.handoverPackage.findMany({
        where: {
          tenantId,
          projectId: model.projectId,
          OR: [
            { bimElementId: { in: elementIds } },
            { bimElementId: null, wbsNodeId: { in: wbsIds } },
          ],
        },
        select: {
          id: true,
          externalId: true,
          bimElementId: true,
          wbsNodeId: true,
          status: true,
          system: true,
        },
      }),
    ]);
    const directTests = new Map<string, typeof tests>();
    const wbsTests = new Map<string, typeof tests>();
    for (const test of tests) {
      const map = test.bimElementId ? directTests : wbsTests;
      const key = test.bimElementId ?? test.wbsNodeId;
      map.set(key, [...(map.get(key) ?? []), test]);
    }
    const directPackages = new Map<string, typeof packages>();
    const wbsPackages = new Map<string, typeof packages>();
    for (const pack of packages) {
      const map = pack.bimElementId ? directPackages : wbsPackages;
      const key = pack.bimElementId ?? pack.wbsNodeId;
      map.set(key, [...(map.get(key) ?? []), pack]);
    }
    const states = model.elements.map((element) => {
      const applicableTests =
        directTests.get(element.id) ??
        element.wbsLinks.flatMap((link) => wbsTests.get(link.wbsNodeId) ?? []);
      const applicablePackages =
        directPackages.get(element.id) ??
        element.wbsLinks.flatMap((link) => wbsPackages.get(link.wbsNodeId) ?? []);
      const latest = applicableTests[0];
      let turnoverState:
        | "NOT_STARTED"
        | "COMMISSIONING"
        | "BLOCKED"
        | "READY_FOR_HANDOVER"
        | "HANDED_OVER" = "NOT_STARTED";
      if (latest) {
        if (
          latest.status === "REJECTED" ||
          latest.result === "FAIL" ||
          latest.result === "CONDITIONAL"
        ) {
          turnoverState = "BLOCKED";
        } else if (latest.status === "SCHEDULED" || latest.status === "SUBMITTED") {
          turnoverState = "COMMISSIONING";
        } else if (latest.status === "ACCEPTED" && latest.result === "PASS") {
          turnoverState = applicablePackages.some((item) => item.status === "ACCEPTED")
            ? "HANDED_OVER"
            : "READY_FOR_HANDOVER";
        }
      }
      return {
        globalId: element.globalId,
        turnoverState,
        latestTest: latest
          ? {
              id: latest.id,
              externalId: latest.externalId,
              status: latest.status,
              result: latest.result,
              scheduledFor: latest.scheduledFor,
            }
          : null,
        packages: applicablePackages.map((item) => ({
          id: item.id,
          externalId: item.externalId,
          status: item.status,
          system: item.system,
        })),
      };
    });
    return {
      summary: {
        elements: states.length,
        notStarted: states.filter((item) => item.turnoverState === "NOT_STARTED").length,
        commissioning: states.filter((item) => item.turnoverState === "COMMISSIONING").length,
        blocked: states.filter((item) => item.turnoverState === "BLOCKED").length,
        readyForHandover: states.filter((item) => item.turnoverState === "READY_FOR_HANDOVER").length,
        handedOver: states.filter((item) => item.turnoverState === "HANDED_OVER").length,
      },
      elements: states,
    };
  }

  private testStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(CommissioningTestStatus).includes(value as CommissioningTestStatus)) {
      throw new BadRequestException("Invalid commissioning test status");
    }
    return value as CommissioningTestStatus;
  }

  private packageStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(HandoverPackageStatus).includes(value as HandoverPackageStatus)) {
      throw new BadRequestException("Invalid handover package status");
    }
    return value as HandoverPackageStatus;
  }

  private unique(values: string[]) {
    return [...new Set(values)];
  }

  private async requireTest(tenantId: string, projectId: string, testId: string) {
    const test = await this.prisma.commissioningTest.findFirst({
      where: { id: testId, tenantId, projectId },
    });
    if (!test) throw new NotFoundException("Commissioning test not found");
    return test;
  }

  private async requirePackage(tenantId: string, projectId: string, packageId: string) {
    const pack = await this.prisma.handoverPackage.findFirst({
      where: { id: packageId, tenantId, projectId },
    });
    if (!pack) throw new NotFoundException("Handover package not found");
    return pack;
  }

  private async requireEvidence(tenantId: string, projectId: string, ids: string[]) {
    if (!ids.length) return;
    const count = await this.prisma.documentVersion.count({
      where: { id: { in: ids }, tenantId, document: { projectId } },
    });
    if (count !== ids.length) {
      throw new BadRequestException("Every document version must belong to this project");
    }
  }

  private async requireElement(tenantId: string, projectId: string, elementId?: string) {
    if (!elementId) return null;
    const element = await this.prisma.bimElement.findFirst({
      where: { id: elementId, tenantId, bimModel: { projectId } },
      select: { id: true, ifcType: true },
    });
    if (!element) throw new BadRequestException("BIM element does not belong to this project");
    return element;
  }

  private async requireProjectMember(projectId: string, userId: string) {
    const count = await this.prisma.projectMember.count({ where: { projectId, userId } });
    if (!count) throw new BadRequestException("User must be a project member");
  }

  private async requireWbs(tenantId: string, projectId: string, wbsNodeId: string) {
    const node = await this.prisma.wbsNode.findFirst({
      where: { id: wbsNodeId, tenantId, projectId },
    });
    if (!node) throw new BadRequestException("WBS node does not belong to this project");
    return node;
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private audit(
    tx: Prisma.TransactionClient,
    tenantId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    return tx.auditEvent.create({
      data: { tenantId, actorId, action, entityType, entityId, metadata },
    });
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }
}
