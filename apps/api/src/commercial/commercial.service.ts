import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LeadStatus, Prisma, SalesActivityType, TranslationLocale, UnitHoldStatus, UnitPriceRevisionStatus, UnitStatus } from "@prisma/client";
import { AuthContext } from "../common/auth-context";
import { PrismaService } from "../prisma/prisma.service";
import {
  AttachCommercialMediaDto,
  BuildingQueryDto,
  CreateBuildingDto,
  ConfirmReservationDto,
  CreateCustomerDto,
  CreateTranslationDto,
  CreateUnitHoldDto,
  CreateLeadDto,
  CreateSalesActivityDto,
  CreatePaymentPlanDto,
  CreateUnitPriceRevisionDto,
  CreateFloorDto,
  CreatePhaseDto,
  CreateUnitDto,
  CreateUnitTypeDto,
  LeadQueryDto,
  TranslationQueryDto,
  UnitQueryDto,
  UpdateBuildingDto,
  UpdateFloorDto,
  UpdatePhaseDto,
  UpdateUnitDto,
  UpdateUnitTypeDto,
  WithdrawLeadConsentDto,
} from "./commercial.dto";

@Injectable()
export class CommercialService {
  constructor(private readonly prisma: PrismaService) {}

  async phases(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.developmentPhase.findMany({
      where: { tenantId, projectId },
      orderBy: [{ sequence: "asc" }, { code: "asc" }],
      include: { _count: { select: { buildings: true, units: true } } },
    });
  }

  async phase(tenantId: string, id: string) {
    return this.requirePhase(tenantId, id);
  }

  async createPhase(user: AuthContext, command: CreatePhaseDto) {
    await this.requireProject(user.tenantId, command.projectId);
    this.assertDateOrder(command.salesOpenAt, command.salesCloseAt, "Sales window");
    this.assertDateOrder(command.launchDate, command.expectedCompletionDate, "Phase schedule");
    return this.unique("Phase code already exists", () =>
      this.prisma.$transaction(async (tx) => {
        const phase = await tx.developmentPhase.create({
          data: {
            tenantId: user.tenantId,
            projectId: command.projectId,
            code: this.code(command.code),
            name: command.name.trim(),
            ...(command.description ? { description: command.description.trim() } : {}),
            ...(command.status ? { status: command.status } : {}),
            ...(command.sequence !== undefined ? { sequence: command.sequence } : {}),
            ...this.phaseDates(command),
          },
        });
        await this.audit(tx, user, "COMMERCIAL_PHASE_CREATED", "DevelopmentPhase", phase.id, {
          projectId: phase.projectId, code: phase.code,
        });
        return phase;
      }),
    );
  }

  async updatePhase(user: AuthContext, id: string, command: UpdatePhaseDto) {
    const before = await this.requirePhase(user.tenantId, id);
    this.assertDateOrder(command.salesOpenAt ?? before.salesOpenAt?.toISOString(), command.salesCloseAt ?? before.salesCloseAt?.toISOString(), "Sales window");
    this.assertDateOrder(command.launchDate ?? before.launchDate?.toISOString(), command.expectedCompletionDate ?? before.expectedCompletionDate?.toISOString(), "Phase schedule");
    return this.unique("Phase code already exists", () =>
      this.prisma.$transaction(async (tx) => {
        const phase = await tx.developmentPhase.update({
          where: { id },
          data: {
            ...(command.code ? { code: this.code(command.code) } : {}),
            ...(command.name ? { name: command.name.trim() } : {}),
            ...(command.description ? { description: command.description.trim() } : {}),
            ...(command.status ? { status: command.status } : {}),
            ...(command.sequence !== undefined ? { sequence: command.sequence } : {}),
            ...this.phaseDates(command),
          },
        });
        await this.audit(tx, user, "COMMERCIAL_PHASE_UPDATED", "DevelopmentPhase", id, {
          before: this.snapshot(before), after: this.snapshot(phase),
        });
        return phase;
      }),
    );
  }

  async buildings(tenantId: string, query: BuildingQueryDto) {
    if (!query.projectId && !query.phaseId) {
      throw new BadRequestException("projectId or phaseId is required");
    }
    return this.prisma.building.findMany({
      where: { tenantId, ...(query.projectId ? { projectId: query.projectId } : {}), ...(query.phaseId ? { phaseId: query.phaseId } : {}) },
      orderBy: { code: "asc" },
      include: { phase: { select: { id: true, code: true, name: true } }, _count: { select: { floors: true, units: true } } },
    });
  }

  async building(tenantId: string, id: string) { return this.requireBuilding(tenantId, id); }

  async createBuilding(user: AuthContext, command: CreateBuildingDto) {
    await this.requirePhase(user.tenantId, command.phaseId, command.projectId);
    return this.unique("Building code already exists", () => this.prisma.$transaction(async (tx) => {
      const building = await tx.building.create({ data: {
        tenantId: user.tenantId, projectId: command.projectId, phaseId: command.phaseId,
        code: this.code(command.code), name: command.name.trim(),
      } });
      await this.audit(tx, user, "COMMERCIAL_BUILDING_CREATED", "Building", building.id, { projectId: building.projectId, phaseId: building.phaseId, code: building.code });
      return building;
    }));
  }

  async updateBuilding(user: AuthContext, id: string, command: UpdateBuildingDto) {
    const before = await this.requireBuilding(user.tenantId, id);
    if (command.phaseId) await this.requirePhase(user.tenantId, command.phaseId, before.projectId);
    return this.unique("Building code already exists", () => this.prisma.$transaction(async (tx) => {
      const building = await tx.building.update({ where: { id }, data: {
        ...(command.phaseId ? { phaseId: command.phaseId } : {}),
        ...(command.code ? { code: this.code(command.code) } : {}),
        ...(command.name ? { name: command.name.trim() } : {}),
      } });
      if (command.phaseId && command.phaseId !== before.phaseId) {
        const units = await tx.unit.count({ where: { tenantId: user.tenantId, buildingId: id } });
        if (units) throw new ConflictException("A building with units cannot move to another phase");
      }
      await this.audit(tx, user, "COMMERCIAL_BUILDING_UPDATED", "Building", id, { before: this.snapshot(before), after: this.snapshot(building) });
      return building;
    }));
  }

  async floors(tenantId: string, buildingId: string) {
    await this.requireBuilding(tenantId, buildingId);
    return this.prisma.floor.findMany({ where: { tenantId, buildingId }, orderBy: [{ sequence: "asc" }, { floorNumber: "asc" }], include: { _count: { select: { units: true } } } });
  }

  async floor(tenantId: string, id: string) { return this.requireFloor(tenantId, id); }

  async createFloor(user: AuthContext, command: CreateFloorDto) {
    const building = await this.requireBuilding(user.tenantId, command.buildingId);
    return this.unique("Floor code or number already exists", () => this.prisma.$transaction(async (tx) => {
      const floor = await tx.floor.create({ data: {
        tenantId: user.tenantId, buildingId: command.buildingId, code: this.code(command.code),
        name: command.name.trim(), floorNumber: command.floorNumber,
        ...(command.sequence !== undefined ? { sequence: command.sequence } : {}),
      } });
      await this.audit(tx, user, "COMMERCIAL_FLOOR_CREATED", "Floor", floor.id, { projectId: building.projectId, buildingId: floor.buildingId, code: floor.code });
      return floor;
    }));
  }

  async updateFloor(user: AuthContext, id: string, command: UpdateFloorDto) {
    const before = await this.requireFloor(user.tenantId, id);
    return this.unique("Floor code or number already exists", () => this.prisma.$transaction(async (tx) => {
      const floor = await tx.floor.update({ where: { id }, data: {
        ...(command.code ? { code: this.code(command.code) } : {}),
        ...(command.name ? { name: command.name.trim() } : {}),
        ...(command.floorNumber !== undefined ? { floorNumber: command.floorNumber } : {}),
        ...(command.sequence !== undefined ? { sequence: command.sequence } : {}),
      } });
      await this.audit(tx, user, "COMMERCIAL_FLOOR_UPDATED", "Floor", id, { before: this.snapshot(before), after: this.snapshot(floor) });
      return floor;
    }));
  }

  async unitTypes(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.unitType.findMany({ where: { tenantId, projectId }, orderBy: { code: "asc" }, include: { _count: { select: { units: true } } } });
  }

  async unitType(tenantId: string, id: string) { return this.requireUnitType(tenantId, id); }

  async createUnitType(user: AuthContext, command: CreateUnitTypeDto) {
    await this.requireProject(user.tenantId, command.projectId);
    const defaultArea = command.defaultArea ? this.positiveDecimal(command.defaultArea, "Default area") : undefined;
    return this.unique("Unit type code already exists", () => this.prisma.$transaction(async (tx) => {
      const unitType = await tx.unitType.create({ data: {
        tenantId: user.tenantId, projectId: command.projectId, code: this.code(command.code), name: command.name.trim(),
        bedrooms: command.bedrooms, bathrooms: command.bathrooms,
        ...(defaultArea ? { defaultArea } : {}), ...(command.description ? { description: command.description.trim() } : {}),
      } });
      await this.audit(tx, user, "COMMERCIAL_UNIT_TYPE_CREATED", "UnitType", unitType.id, { projectId: unitType.projectId, code: unitType.code });
      return unitType;
    }));
  }

  async updateUnitType(user: AuthContext, id: string, command: UpdateUnitTypeDto) {
    const before = await this.requireUnitType(user.tenantId, id);
    const defaultArea = command.defaultArea ? this.positiveDecimal(command.defaultArea, "Default area") : undefined;
    return this.unique("Unit type code already exists", () => this.prisma.$transaction(async (tx) => {
      const unitType = await tx.unitType.update({ where: { id }, data: {
        ...(command.code ? { code: this.code(command.code) } : {}), ...(command.name ? { name: command.name.trim() } : {}),
        ...(command.bedrooms !== undefined ? { bedrooms: command.bedrooms } : {}), ...(command.bathrooms !== undefined ? { bathrooms: command.bathrooms } : {}),
        ...(defaultArea ? { defaultArea } : {}), ...(command.description ? { description: command.description.trim() } : {}),
      } });
      await this.audit(tx, user, "COMMERCIAL_UNIT_TYPE_UPDATED", "UnitType", id, { before: this.snapshot(before), after: this.snapshot(unitType) });
      return unitType;
    }));
  }

  async units(tenantId: string, query: UnitQueryDto) {
    await this.requireProject(tenantId, query.projectId);
    const where: Prisma.UnitWhereInput = {
      tenantId, projectId: query.projectId,
      ...(query.phaseId ? { phaseId: query.phaseId } : {}), ...(query.buildingId ? { buildingId: query.buildingId } : {}),
      ...(query.floorId ? { floorId: query.floorId } : {}), ...(query.unitTypeId ? { unitTypeId: query.unitTypeId } : {}),
      ...(query.status ? { status: query.status } : {}), ...(query.bedrooms !== undefined ? { bedrooms: query.bedrooms } : {}),
      ...(query.bathrooms !== undefined ? { bathrooms: query.bathrooms } : {}),
      ...((query.minArea || query.maxArea) ? { grossArea: { ...(query.minArea ? { gte: new Prisma.Decimal(query.minArea) } : {}), ...(query.maxArea ? { lte: new Prisma.Decimal(query.maxArea) } : {}) } } : {}),
      ...(query.q ? { OR: [{ code: { contains: query.q, mode: "insensitive" } }, { number: { contains: query.q, mode: "insensitive" } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.unit.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ building: { code: "asc" } }, { floor: { sequence: "asc" } }, { number: "asc" }], include: this.unitInclude() }),
      this.prisma.unit.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async unit(tenantId: string, id: string, locale: TranslationLocale = TranslationLocale.en) {
    const unit = await this.found(
      this.prisma.unit.findFirst({ where: { id, tenantId }, include: this.unitInclude() }),
      "Unit",
    );
    const descriptions = await this.localeResolvedDescriptions(tenantId, unit, locale);
    return { ...unit, descriptions };
  }

  async createUnit(user: AuthContext, command: CreateUnitDto) {
    await this.assertHierarchy(user.tenantId, command);
    const areas = this.areas(command.grossArea, command.netArea);
    return this.unique("Unit code or floor number already exists", () => this.prisma.$transaction(async (tx) => {
      const unit = await tx.unit.create({ data: {
        tenantId: user.tenantId, projectId: command.projectId, phaseId: command.phaseId, buildingId: command.buildingId,
        floorId: command.floorId, unitTypeId: command.unitTypeId, code: this.code(command.code), number: command.number.trim(),
        ...areas, bedrooms: command.bedrooms, bathrooms: command.bathrooms,
        ...(command.orientation ? { orientation: command.orientation.trim() } : {}), ...(command.view ? { view: command.view.trim() } : {}),
        ...(command.parkingCount !== undefined ? { parkingCount: command.parkingCount } : {}),
      }, include: this.unitInclude() });
      await this.audit(tx, user, "COMMERCIAL_UNIT_CREATED", "Unit", unit.id, { projectId: unit.projectId, code: unit.code, status: unit.status });
      return unit;
    }));
  }

  async updateUnit(user: AuthContext, id: string, command: UpdateUnitDto) {
    const before = await this.requireUnit(user.tenantId, id);
    const hierarchy = { projectId: before.projectId, phaseId: command.phaseId ?? before.phaseId, buildingId: command.buildingId ?? before.buildingId, floorId: command.floorId ?? before.floorId, unitTypeId: command.unitTypeId ?? before.unitTypeId };
    await this.assertHierarchy(user.tenantId, hierarchy);
    const areaPatch = (command.grossArea || command.netArea) ? this.areas(command.grossArea ?? before.grossArea.toString(), command.netArea ?? before.netArea?.toString()) : {};
    return this.unique("Unit code or floor number already exists", () => this.prisma.$transaction(async (tx) => {
      const unit = await tx.unit.update({ where: { id }, data: {
        ...hierarchy, ...(command.code ? { code: this.code(command.code) } : {}), ...(command.number ? { number: command.number.trim() } : {}), ...areaPatch,
        ...(command.bedrooms !== undefined ? { bedrooms: command.bedrooms } : {}), ...(command.bathrooms !== undefined ? { bathrooms: command.bathrooms } : {}),
        ...(command.orientation ? { orientation: command.orientation.trim() } : {}), ...(command.view ? { view: command.view.trim() } : {}),
        ...(command.parkingCount !== undefined ? { parkingCount: command.parkingCount } : {}),
      }, include: this.unitInclude() });
      await this.audit(tx, user, "COMMERCIAL_UNIT_UPDATED", "Unit", id, { before: this.snapshot(before), after: this.snapshot(unit) });
      return unit;
    }));
  }

  async transitionUnit(user: AuthContext, id: string, command: "release" | "block") {
    const current = await this.requireUnit(user.tenantId, id);
    const allowed: UnitStatus[] = command === "release" ? [UnitStatus.DRAFT, UnitStatus.UNRELEASED, UnitStatus.BLOCKED] : [UnitStatus.UNRELEASED, UnitStatus.AVAILABLE];
    const next = command === "release" ? UnitStatus.AVAILABLE : UnitStatus.BLOCKED;
    if (!allowed.includes(current.status)) throw new ConflictException(`Unit cannot ${command} from ${current.status}`);
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.unit.updateMany({ where: { id, tenantId: user.tenantId, status: { in: allowed } }, data: { status: next } });
      if (changed.count !== 1) throw new ConflictException("Unit state changed concurrently");
      const unit = await tx.unit.findUniqueOrThrow({ where: { id }, include: this.unitInclude() });
      await this.audit(tx, user, command === "release" ? "COMMERCIAL_UNIT_RELEASED" : "COMMERCIAL_UNIT_BLOCKED", "Unit", id, { from: current.status, to: next });
      return unit;
    });
  }

  async publishedPrices(tenantId: string, unitId: string) {
    await this.requireUnit(tenantId, unitId);
    const revisions = await this.prisma.unitPriceRevision.findMany({
      where: { tenantId, unitId, status: { in: [UnitPriceRevisionStatus.PUBLISHED, UnitPriceRevisionStatus.SUPERSEDED] } },
      orderBy: [{ validFrom: "desc" }, { revision: "desc" }],
    });
    return revisions.map((revision) => this.priceView(revision));
  }

  async draftPrices(tenantId: string, unitId: string) {
    await this.requireUnit(tenantId, unitId);
    const revisions = await this.prisma.unitPriceRevision.findMany({
      where: { tenantId, unitId, status: UnitPriceRevisionStatus.DRAFT },
      orderBy: { revision: "desc" },
    });
    return revisions.map((revision) => this.priceView(revision));
  }

  async createPriceDraft(user: AuthContext, unitId: string, command: CreateUnitPriceRevisionDto) {
    await this.requireUnit(user.tenantId, unitId);
    const basePriceMinor = this.minorUnits(command.basePriceMinor, "Base price");
    const listPriceMinor = this.minorUnits(command.listPriceMinor, "List price");
    if (listPriceMinor < basePriceMinor) throw new BadRequestException("List price cannot be lower than base price");
    const created = await this.unique("Price revision already exists; retry draft creation", () => this.prisma.$transaction(async (tx) => {
      const latest = await tx.unitPriceRevision.findFirst({
        where: { tenantId: user.tenantId, unitId },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });
      const revision = await tx.unitPriceRevision.create({
        data: {
          tenantId: user.tenantId,
          unitId,
          revision: (latest?.revision ?? 0) + 1,
          basePriceMinor,
          listPriceMinor,
          currency: command.currency,
          ...(command.validFrom ? { validFrom: new Date(command.validFrom) } : {}),
          createdById: user.userId,
        },
      });
      await this.audit(tx, user, "COMMERCIAL_UNIT_PRICE_DRAFT_CREATED", "UnitPriceRevision", revision.id, {
        unitId, revision: revision.revision, currency: revision.currency,
      });
      return revision;
    }));
    return this.priceView(created);
  }

  async publishPrice(user: AuthContext, id: string) {
    const draft = await this.found(this.prisma.unitPriceRevision.findFirst({
      where: { id, tenantId: user.tenantId },
    }), "Unit price revision");
    if (draft.status !== UnitPriceRevisionStatus.DRAFT) throw new ConflictException("Only a draft price revision can be published");
    const published = await this.unique("A current published price already exists; retry publishing", () => this.prisma.$transaction(async (tx) => {
      const revision = await tx.unitPriceRevision.findFirst({ where: { id, tenantId: user.tenantId } });
      if (!revision || revision.status !== UnitPriceRevisionStatus.DRAFT) throw new ConflictException("Price revision state changed concurrently");
      const publishedAt = new Date();
      const validFrom = revision.validFrom ?? publishedAt;
      const current = await tx.unitPriceRevision.findFirst({
        where: { tenantId: user.tenantId, unitId: revision.unitId, status: UnitPriceRevisionStatus.PUBLISHED },
      });
      if (current?.validFrom && validFrom <= current.validFrom) {
        throw new ConflictException("A successor price must begin after the current price validity start");
      }
      if (current) {
        await tx.unitPriceRevision.update({
          where: { id: current.id },
          data: { status: UnitPriceRevisionStatus.SUPERSEDED, validTo: validFrom },
        });
      }
      const published = await tx.unitPriceRevision.update({
        where: { id: revision.id },
        data: { status: UnitPriceRevisionStatus.PUBLISHED, validFrom, validTo: null, publishedAt },
      });
      await this.audit(tx, user, "COMMERCIAL_UNIT_PRICE_PUBLISHED", "UnitPriceRevision", published.id, {
        unitId: published.unitId,
        revision: published.revision,
        supersededRevisionId: current?.id ?? null,
      });
      return published;
    }));
    return this.priceView(published);
  }

  async withdrawPrice(user: AuthContext, id: string) {
    const draft = await this.found(this.prisma.unitPriceRevision.findFirst({ where: { id, tenantId: user.tenantId } }), "Unit price revision");
    if (draft.status !== UnitPriceRevisionStatus.DRAFT) throw new ConflictException("Only a draft price revision can be withdrawn");
    const withdrawn = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.unitPriceRevision.updateMany({
        where: { id, tenantId: user.tenantId, status: UnitPriceRevisionStatus.DRAFT },
        data: { status: UnitPriceRevisionStatus.WITHDRAWN },
      });
      if (changed.count !== 1) throw new ConflictException("Price revision state changed concurrently");
      const withdrawn = await tx.unitPriceRevision.findUniqueOrThrow({ where: { id } });
      await this.audit(tx, user, "COMMERCIAL_UNIT_PRICE_WITHDRAWN", "UnitPriceRevision", id, { unitId: withdrawn.unitId, revision: withdrawn.revision });
      return withdrawn;
    });
    return this.priceView(withdrawn);
  }

  async paymentPlans(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.paymentPlan.findMany({
      where: { tenantId, projectId },
      include: { installments: { orderBy: { sequence: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createPaymentPlan(user: AuthContext, projectId: string, command: CreatePaymentPlanDto) {
    await this.requireProject(user.tenantId, projectId);
    this.assertInstallments(command.installments);
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.paymentPlan.create({
        data: {
          tenantId: user.tenantId,
          projectId,
          installments: { create: this.installments(user.tenantId, command) },
        },
        include: { installments: { orderBy: { sequence: "asc" } } },
      });
      await this.audit(tx, user, "COMMERCIAL_PAYMENT_PLAN_CREATED", "PaymentPlan", plan.id, { projectId, installmentCount: plan.installments.length });
      return plan;
    });
  }

  async replacePaymentPlan(user: AuthContext, id: string, command: CreatePaymentPlanDto) {
    const before = await this.found(this.prisma.paymentPlan.findFirst({ where: { id, tenantId: user.tenantId } }), "Payment plan");
    this.assertInstallments(command.installments);
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.paymentPlan.update({
        where: { id },
        data: { installments: { deleteMany: {}, create: this.installments(user.tenantId, command) } },
        include: { installments: { orderBy: { sequence: "asc" } } },
      });
      await this.audit(tx, user, "COMMERCIAL_PAYMENT_PLAN_REPLACED", "PaymentPlan", plan.id, {
        projectId: before.projectId, installmentCount: plan.installments.length,
      });
      return plan;
    });
  }

  async attachProjectMedia(user: AuthContext, projectId: string, command: AttachCommercialMediaDto) {
    await this.requireProject(user.tenantId, projectId);
    return this.prisma.$transaction(async (tx) => {
      await this.requireDocumentVersion(tx, user.tenantId, projectId, command.documentVersionId);
      const media = await tx.projectMedia.create({ data: { tenantId: user.tenantId, projectId, documentVersionId: command.documentVersionId, ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}) } });
      await this.audit(tx, user, "COMMERCIAL_PROJECT_MEDIA_ATTACHED", "ProjectMedia", media.id, { projectId, documentVersionId: command.documentVersionId });
      return media;
    });
  }

  async attachBuildingMedia(user: AuthContext, buildingId: string, command: AttachCommercialMediaDto) {
    const building = await this.requireBuilding(user.tenantId, buildingId);
    return this.prisma.$transaction(async (tx) => {
      await this.requireDocumentVersion(tx, user.tenantId, building.projectId, command.documentVersionId);
      const media = await tx.buildingMedia.create({ data: { tenantId: user.tenantId, buildingId, documentVersionId: command.documentVersionId, ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}) } });
      await this.audit(tx, user, "COMMERCIAL_BUILDING_MEDIA_ATTACHED", "BuildingMedia", media.id, { projectId: building.projectId, buildingId, documentVersionId: command.documentVersionId });
      return media;
    });
  }

  async attachUnitMedia(user: AuthContext, unitId: string, command: AttachCommercialMediaDto) {
    const unit = await this.requireUnit(user.tenantId, unitId);
    return this.prisma.$transaction(async (tx) => {
      await this.requireDocumentVersion(tx, user.tenantId, unit.projectId, command.documentVersionId);
      const media = await tx.unitMedia.create({ data: { tenantId: user.tenantId, unitId, documentVersionId: command.documentVersionId, ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}) } });
      await this.audit(tx, user, "COMMERCIAL_UNIT_MEDIA_ATTACHED", "UnitMedia", media.id, { projectId: unit.projectId, unitId, documentVersionId: command.documentVersionId });
      return media;
    });
  }

  async removeProjectMedia(user: AuthContext, id: string) { return this.removeMedia(user, "ProjectMedia", id, (tx) => tx.projectMedia); }
  async removeBuildingMedia(user: AuthContext, id: string) { return this.removeMedia(user, "BuildingMedia", id, (tx) => tx.buildingMedia); }
  async removeUnitMedia(user: AuthContext, id: string) { return this.removeMedia(user, "UnitMedia", id, (tx) => tx.unitMedia); }

  async translations(tenantId: string, query: TranslationQueryDto) {
    this.assertTranslationTarget(query.entityType, query.field);
    await this.requireTranslationEntity(this.prisma, tenantId, query.entityType, query.entityId);
    const requestedLocale = query.locale ?? TranslationLocale.en;
    const translations = await this.prisma.translation.findMany({
      where: {
        tenantId,
        entityType: query.entityType,
        entityId: query.entityId,
        field: query.field,
        locale: { in: requestedLocale === TranslationLocale.en ? [TranslationLocale.en] : [requestedLocale, TranslationLocale.en] },
      },
    });
    const requested = translations.find((translation) => translation.locale === requestedLocale);
    const english = translations.find((translation) => translation.locale === TranslationLocale.en);
    const translation = requested ?? english;
    if (!translation) throw new NotFoundException("No English translation exists for this commercial field");
    return this.translationView(translation, requested === undefined && requestedLocale !== TranslationLocale.en);
  }

  async createTranslation(user: AuthContext, command: CreateTranslationDto) {
    this.assertTranslationTarget(command.entityType, command.field);
    return this.prisma.$transaction(async (tx) => {
      await this.requireTranslationEntity(tx, user.tenantId, command.entityType, command.entityId);
      const translation = await tx.translation.upsert({
        where: {
          tenantId_entityType_entityId_locale_field: {
            tenantId: user.tenantId,
            entityType: command.entityType,
            entityId: command.entityId,
            locale: command.locale,
            field: command.field,
          },
        },
        create: {
          tenantId: user.tenantId,
          entityType: command.entityType,
          entityId: command.entityId,
          locale: command.locale,
          field: command.field,
          value: command.value.trim(),
        },
        update: { value: command.value.trim() },
      });
      await this.audit(tx, user, "COMMERCIAL_TRANSLATION_UPSERTED", "Translation", translation.id, {
        entityType: translation.entityType,
        entityId: translation.entityId,
        locale: translation.locale,
        field: translation.field,
      });
      return this.translationView(translation, false);
    });
  }

  async createHold(user: AuthContext, command: CreateUnitHoldDto) {
    const holdExpiresAt = new Date(command.holdExpiresAt);
    if (holdExpiresAt <= new Date()) throw new BadRequestException("Hold expiry must be in the future");
    return this.prisma.$transaction(async (tx) => {
      const [unit, lead] = await Promise.all([
        this.requireUnitTx(tx, user.tenantId, command.unitId),
        this.requireLeadTx(tx, user.tenantId, command.leadId),
      ]);
      this.assertLeadOwnerOrManager(user, lead.assignedToId);
      if (lead.unitId && lead.unitId !== unit.id) {
        throw new BadRequestException("Lead is linked to a different Unit");
      }
      if (lead.projectId && lead.projectId !== unit.projectId) {
        throw new BadRequestException("Lead is linked to a different Project");
      }
      const held = await tx.unit.updateMany({
        where: { id: unit.id, tenantId: user.tenantId, status: UnitStatus.AVAILABLE },
        data: { status: UnitStatus.HELD },
      });
      if (held.count !== 1) throw new ConflictException("Unit is not available for a Hold");
      const hold = await tx.unitHold.create({
        data: {
          tenantId: user.tenantId,
          unitId: unit.id,
          leadId: lead.id,
          holdExpiresAt,
          createdById: user.userId,
        },
      });
      await this.audit(tx, user, "COMMERCIAL_UNIT_HOLD_CREATED", "UnitHold", hold.id, {
        unitId: unit.id,
        leadId: lead.id,
        holdExpiresAt: hold.holdExpiresAt.toISOString(),
        fromUnitStatus: UnitStatus.AVAILABLE,
        toUnitStatus: UnitStatus.HELD,
      });
      return this.holdView(hold);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async cancelHold(user: AuthContext, id: string) {
    const hold = await this.requireHold(user.tenantId, id);
    const lead = await this.requireLead(user.tenantId, hold.leadId);
    this.assertLeadOwnerOrManager(user, lead.assignedToId);
    return this.releaseHold(user.tenantId, hold.id, UnitHoldStatus.CANCELLED, user);
  }

  async confirmReservation(user: AuthContext, holdId: string, command: ConfirmReservationDto) {
    return this.unique("Reservation confirmation conflicted; retry the operation", () => this.prisma.$transaction(async (tx) => {
      const hold = await this.requireHoldTx(tx, user.tenantId, holdId);
      if (hold.status !== UnitHoldStatus.ACTIVE || hold.holdExpiresAt <= new Date()) {
        throw new ConflictException("Only an unexpired active Hold can be confirmed");
      }
      const [unit, lead] = await Promise.all([
        this.requireUnitTx(tx, user.tenantId, hold.unitId),
        this.requireLeadTx(tx, user.tenantId, hold.leadId),
      ]);
      if (unit.status !== UnitStatus.HELD) throw new ConflictException("Unit is no longer held by this Hold");
      if (lead.status !== LeadStatus.NEGOTIATION) {
        throw new ConflictException("Only a Negotiation Lead can be reserved by Reservation confirmation");
      }
      if (!lead.customerId) throw new ConflictException("Reservation confirmation requires the Lead to have a Customer");
      if (lead.unitId && lead.unitId !== unit.id) throw new ConflictException("Lead is linked to a different Unit");
      const [customer, paymentPlan, price] = await Promise.all([
        this.requireCustomerTx(tx, user.tenantId, lead.customerId),
        this.requirePaymentPlanTx(tx, user.tenantId, command.paymentPlanId),
        tx.unitPriceRevision.findFirst({
          where: { tenantId: user.tenantId, unitId: unit.id, status: UnitPriceRevisionStatus.PUBLISHED },
        }),
      ]);
      if (paymentPlan.projectId !== unit.projectId) {
        throw new BadRequestException("Reservation PaymentPlan must belong to the Unit Project");
      }
      if (!price) throw new ConflictException("Reservation confirmation requires a currently published Unit price");
      const now = new Date();
      const holdChanged = await tx.unitHold.updateMany({
        where: { id: hold.id, tenantId: user.tenantId, status: UnitHoldStatus.ACTIVE, holdExpiresAt: { gt: now } },
        data: { status: UnitHoldStatus.CONVERTED, convertedAt: now },
      });
      if (holdChanged.count !== 1) throw new ConflictException("Hold state changed concurrently");
      const unitChanged = await tx.unit.updateMany({
        where: { id: unit.id, tenantId: user.tenantId, status: UnitStatus.HELD },
        data: { status: UnitStatus.RESERVED },
      });
      if (unitChanged.count !== 1) throw new ConflictException("Unit state changed concurrently");
      const leadChanged = await tx.lead.updateMany({
        where: { id: lead.id, tenantId: user.tenantId, status: LeadStatus.NEGOTIATION },
        data: { status: LeadStatus.RESERVED },
      });
      if (leadChanged.count !== 1) throw new ConflictException("Lead state changed concurrently");
      const reservation = await tx.reservation.create({
        data: {
          tenantId: user.tenantId,
          holdId: hold.id,
          unitId: unit.id,
          leadId: lead.id,
          customerId: customer.id,
          paymentPlanId: paymentPlan.id,
          sourcePriceRevisionId: price.id,
          basePriceSnapshotMinor: price.basePriceMinor,
          listPriceSnapshotMinor: price.listPriceMinor,
          reservationAmountMinor: price.listPriceMinor,
          currency: price.currency,
          status: "CONFIRMED",
          createdById: user.userId,
          approvedById: user.userId,
          confirmedAt: now,
        },
      });
      await this.audit(tx, user, "COMMERCIAL_RESERVATION_CONFIRMED", "Reservation", reservation.id, {
        holdId: hold.id,
        unitId: unit.id,
        leadId: lead.id,
        paymentPlanId: paymentPlan.id,
        sourcePriceRevisionId: price.id,
        basePriceSnapshotMinor: price.basePriceMinor.toString(),
        listPriceSnapshotMinor: price.listPriceMinor.toString(),
        reservationAmountMinor: price.listPriceMinor.toString(),
        currency: price.currency,
      });
      await this.audit(tx, user, "COMMERCIAL_LEAD_RESERVED_BY_RESERVATION", "Lead", lead.id, {
        reservationId: reservation.id,
        from: LeadStatus.NEGOTIATION,
        to: LeadStatus.RESERVED,
      });
      return this.reservationView(reservation);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async expireHolds(now = new Date()) {
    const candidates = await this.prisma.unitHold.findMany({
      where: { status: UnitHoldStatus.ACTIVE, holdExpiresAt: { lte: now } },
      select: { id: true, tenantId: true },
      orderBy: { holdExpiresAt: "asc" },
    });
    let expired = 0;
    let skipped = 0;
    for (const candidate of candidates) {
      const result = await this.releaseHold(candidate.tenantId, candidate.id, UnitHoldStatus.EXPIRED, undefined, now);
      if (result) expired += 1;
      else skipped += 1;
    }
    return { expired, skipped, inspected: candidates.length };
  }

  async customer(tenantId: string, id: string) {
    return this.customerView(await this.requireCustomer(tenantId, id));
  }

  async createCustomer(user: AuthContext, command: CreateCustomerDto) {
    const phone = this.normalizeSaudiPhone(command.phone);
    const email = this.normalizeEmail(command.email);
    return this.prisma.$transaction(async (tx) => {
      const exact = await tx.customer.findFirst({
        where: { tenantId: user.tenantId, phoneNormalized: phone, emailNormalized: email },
      });
      if (exact) {
        await this.audit(tx, user, "COMMERCIAL_CUSTOMER_REUSED", "Customer", exact.id, { deduplication: "exact-phone-email" });
        return { customer: this.customerView(exact), reused: true };
      }
      const partial = await tx.customer.count({
        where: { tenantId: user.tenantId, OR: [{ phoneNormalized: phone }, { emailNormalized: email }] },
      });
      if (partial > 0) {
        await tx.customer.updateMany({
          where: { tenantId: user.tenantId, OR: [{ phoneNormalized: phone }, { emailNormalized: email }] },
          data: { dedupReviewRequired: true },
        });
      }
      const customer = await tx.customer.create({
        data: {
          tenantId: user.tenantId,
          firstName: command.firstName.trim(),
          ...(command.lastName ? { lastName: command.lastName.trim() } : {}),
          phone: phone,
          phoneNormalized: phone,
          email: command.email.trim(),
          emailNormalized: email,
          dedupReviewRequired: partial > 0,
        },
      });
      await this.audit(tx, user, "COMMERCIAL_CUSTOMER_CREATED", "Customer", customer.id, {
        deduplication: partial > 0 ? "partial-match-manual-review" : "no-match",
      });
      return { customer: this.customerView(customer), reused: false };
    });
  }

  async ownLeads(user: AuthContext, query: LeadQueryDto) {
    return this.leadPage(user.tenantId, query, user.userId);
  }

  async allLeads(tenantId: string, query: LeadQueryDto) {
    return this.leadPage(tenantId, query);
  }

  async ownLead(user: AuthContext, id: string) {
    return this.leadView(await this.requireLead(user.tenantId, id, user.userId));
  }

  async lead(tenantId: string, id: string) {
    return this.leadView(await this.requireLead(tenantId, id));
  }

  async createLead(user: AuthContext, command: CreateLeadDto) {
    const assigneeId = command.assignedToId ?? user.userId;
    if (assigneeId !== user.userId && !user.permissions.includes("commercial:lead:reassign")) {
      throw new ForbiddenException("Assigning a lead to another user requires commercial:lead:reassign");
    }
    this.assertLeadConsent(command);
    return this.prisma.$transaction(async (tx) => {
      const [customer, project, unit] = await Promise.all([
        command.customerId ? this.requireCustomerTx(tx, user.tenantId, command.customerId) : undefined,
        command.projectId ? this.requireProjectTx(tx, user.tenantId, command.projectId) : undefined,
        command.unitId ? this.requireUnitTx(tx, user.tenantId, command.unitId) : undefined,
      ]);
      if (project && unit && unit.projectId !== project.id) {
        throw new BadRequestException("Lead unit must belong to the selected project");
      }
      await this.requireTenantAssignee(tx, user.tenantId, assigneeId);
      const lead = await tx.lead.create({
        data: {
          tenantId: user.tenantId,
          ...(customer ? { customerId: customer.id } : {}),
          ...(project ? { projectId: project.id } : {}),
          ...(unit ? { unitId: unit.id } : {}),
          assignedToId: assigneeId,
          source: command.source.trim(),
          isExternalEnquiry: command.isExternalEnquiry ?? false,
          enquiryConsentGranted: command.enquiryConsentGranted ?? false,
          ...(command.enquiryConsentAt ? { enquiryConsentAt: new Date(command.enquiryConsentAt) } : {}),
          ...(command.enquiryConsentChannel ? { enquiryConsentChannel: command.enquiryConsentChannel.trim() } : {}),
          ...(command.enquiryConsentPurpose ? { enquiryConsentPurpose: command.enquiryConsentPurpose.trim() } : {}),
          marketingConsentGranted: command.marketingConsentGranted ?? false,
          ...(command.marketingConsentAt ? { marketingConsentAt: new Date(command.marketingConsentAt) } : {}),
          ...(command.marketingConsentChannel ? { marketingConsentChannel: command.marketingConsentChannel.trim() } : {}),
          ...(command.marketingConsentPurpose ? { marketingConsentPurpose: command.marketingConsentPurpose.trim() } : {}),
        },
        include: this.leadInclude(),
      });
      await this.audit(tx, user, "COMMERCIAL_LEAD_CREATED", "Lead", lead.id, {
        customerId: lead.customerId,
        projectId: lead.projectId,
        unitId: lead.unitId,
        assignedToId: lead.assignedToId,
        source: lead.source,
        status: lead.status,
        isExternalEnquiry: lead.isExternalEnquiry,
      });
      return this.leadView(lead);
    });
  }

  async advanceLead(user: AuthContext, id: string, next: LeadStatus) {
    if (next === LeadStatus.DISQUALIFIED) throw new BadRequestException("Use the dedicated disqualify operation");
    if (next === LeadStatus.RESERVED) throw new BadRequestException("Lead reservation is created only by Reservation confirmation");
    const current = await this.requireLead(user.tenantId, id);
    this.assertLeadOwnerOrManager(user, current.assignedToId);
    this.assertLeadTransition(current.status, next);
    // R4C-R17: WON/LOST are terminal Lead outcomes reached only from RESERVED, which is the
    // one Lead status that always carries a live Unit hold/reservation. Advancing a Lead out of
    // RESERVED must resolve that Unit's state in the same transaction, or a LOST deal permanently
    // strands the Unit at RESERVED (never released to sell again) and a WON deal never confirms
    // the Unit as sold. This does not implement general Lead<->Unit synchronization (still an
    // open C04 decision for earlier statuses) -- it only closes the concrete Unit-stranding defect
    // on the two terminal transitions that already have a concrete, unambiguous target state.
    const unitResolution =
      current.status === LeadStatus.RESERVED && next === LeadStatus.WON
        ? { from: UnitStatus.RESERVED, to: UnitStatus.SOLD }
        : current.status === LeadStatus.RESERVED && next === LeadStatus.LOST
        ? { from: UnitStatus.RESERVED, to: UnitStatus.AVAILABLE }
        : null;
    if (unitResolution && !current.unitId) {
      throw new ConflictException("Reserved Lead has no linked Unit");
    }
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.lead.updateMany({
        where: { id, tenantId: user.tenantId, status: current.status },
        data: { status: next },
      });
      if (changed.count !== 1) throw new ConflictException("Lead state changed concurrently");
      if (unitResolution && current.unitId) {
        const unitChanged = await tx.unit.updateMany({
          where: { id: current.unitId, tenantId: user.tenantId, status: unitResolution.from },
          data: { status: unitResolution.to },
        });
        if (unitChanged.count !== 1) throw new ConflictException("Unit state changed concurrently");
        await this.audit(tx, user, "COMMERCIAL_UNIT_STATUS_RESOLVED_BY_LEAD_OUTCOME", "Unit", current.unitId, {
          leadId: id,
          leadOutcome: next,
          from: unitResolution.from,
          to: unitResolution.to,
        });
      }
      const lead = await tx.lead.findUniqueOrThrow({ where: { id }, include: this.leadInclude() });
      await this.audit(tx, user, "COMMERCIAL_LEAD_STATUS_ADVANCED", "Lead", id, { from: current.status, to: next });
      return this.leadView(lead);
    });
  }

  async disqualifyLead(user: AuthContext, id: string) {
    const current = await this.requireLead(user.tenantId, id);
    this.assertLeadOwnerOrManager(user, current.assignedToId);
    const eligible: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.APPOINTMENT, LeadStatus.NEGOTIATION];
    if (!eligible.includes(current.status)) throw new ConflictException(`Lead cannot be disqualified from ${current.status}`);
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.lead.updateMany({
        where: { id, tenantId: user.tenantId, status: current.status },
        data: { status: LeadStatus.DISQUALIFIED },
      });
      if (changed.count !== 1) throw new ConflictException("Lead state changed concurrently");
      const lead = await tx.lead.findUniqueOrThrow({ where: { id }, include: this.leadInclude() });
      await this.audit(tx, user, "COMMERCIAL_LEAD_DISQUALIFIED", "Lead", id, { from: current.status, to: LeadStatus.DISQUALIFIED });
      return this.leadView(lead);
    });
  }

  // R4C-R16: consent capture had no withdrawal path, but Saudi PDPL-aligned handling requires
  // a data subject to be able to withdraw consent at any time and have that withdrawal recorded
  // as auditable fact, not a silent field flip. This clears the granted flag and the now-invalid
  // metadata while keeping the original grant's audit trail (the audit log itself is append-only
  // and unaffected) and recording who withdrew it, when, and why.
  async withdrawLeadConsent(user: AuthContext, id: string, command: WithdrawLeadConsentDto) {
    const current = await this.requireLead(user.tenantId, id);
    this.assertLeadOwnerOrManager(user, current.assignedToId);
    const isMarketing = command.consentType === "marketing";
    const grantedNow = isMarketing ? current.marketingConsentGranted : current.enquiryConsentGranted;
    if (!grantedNow) throw new ConflictException(`${command.consentType} consent is not currently granted for this Lead`);
    const data = isMarketing
      ? { marketingConsentGranted: false, marketingConsentAt: null, marketingConsentChannel: null, marketingConsentPurpose: null }
      : { enquiryConsentGranted: false, enquiryConsentAt: null, enquiryConsentChannel: null, enquiryConsentPurpose: null };
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.lead.updateMany({
        where: {
          id,
          tenantId: user.tenantId,
          ...(isMarketing ? { marketingConsentGranted: true } : { enquiryConsentGranted: true }),
        },
        data,
      });
      if (changed.count !== 1) throw new ConflictException("Lead state changed concurrently");
      const lead = await tx.lead.findUniqueOrThrow({ where: { id }, include: this.leadInclude() });
      await this.audit(tx, user, "COMMERCIAL_LEAD_CONSENT_WITHDRAWN", "Lead", id, {
        consentType: command.consentType,
        reason: command.reason ?? null,
      });
      return this.leadView(lead);
    });
  }

  async reassignLead(user: AuthContext, id: string, assignedToId: string) {
    const before = await this.requireLead(user.tenantId, id);
    await this.requireTenantAssignee(this.prisma, user.tenantId, assignedToId);
    if (before.assignedToId === assignedToId) return this.leadView(before);
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({ where: { id }, data: { assignedToId }, include: this.leadInclude() });
      await this.audit(tx, user, "COMMERCIAL_LEAD_REASSIGNED", "Lead", id, { fromAssignedToId: before.assignedToId, toAssignedToId: assignedToId });
      return this.leadView(lead);
    });
  }

  async assignees(tenantId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        user: { isActive: true },
        role: {
          permissions: {
            some: { permission: { code: { in: ["commercial:lead:view-own", "commercial:lead:view-all"] } } },
          },
        },
      },
      select: {
        user: { select: { id: true, displayName: true } },
        role: { select: { code: true, name: true } },
      },
      orderBy: { user: { displayName: "asc" } },
    });
    return memberships.map(({ user, role }) => ({
      id: user.id,
      displayName: user.displayName,
      role: { code: role.code, name: role.name },
    }));
  }

  async activities(user: AuthContext, leadId: string) {
    const lead = await this.requireLead(user.tenantId, leadId);
    this.assertLeadOwnerOrManager(user, lead.assignedToId);
    const activities = await this.prisma.salesActivity.findMany({
      where: { tenantId: user.tenantId, leadId }, orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, displayName: true } } },
    });
    return activities.map((activity) => this.activityView(activity));
  }

  async logActivity(user: AuthContext, leadId: string, command: CreateSalesActivityDto) {
    const lead = await this.requireLead(user.tenantId, leadId);
    const hasManagerVisibility = user.permissions.includes("commercial:lead:view-all");
    if (lead.assignedToId !== user.userId && !hasManagerVisibility) {
      throw new ForbiddenException("Only the assigned owner or a manager-tier viewer may log a Lead activity");
    }
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.salesActivity.create({
        data: { tenantId: user.tenantId, leadId, actorId: user.userId, type: command.type, notes: command.notes.trim() },
        include: { actor: { select: { id: true, displayName: true } } },
      });
      await this.audit(tx, user, "COMMERCIAL_SALES_ACTIVITY_LOGGED", "SalesActivity", activity.id, { leadId, type: activity.type });
      return this.activityView(activity);
    });
  }

  private async leadPage(tenantId: string, query: LeadQueryDto, assignedToId?: string) {
    const where: Prisma.LeadWhereInput = {
      tenantId,
      ...(assignedToId ? { assignedToId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: this.leadInclude(),
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items: items.map((lead) => this.leadView(lead)), total, page: query.page, pageSize: query.pageSize };
  }

  private assertLeadConsent(command: CreateLeadDto) {
    const assertPurpose = (label: string, granted: boolean | undefined, at: string | undefined, channel: string | undefined, purpose: string | undefined, required: boolean) => {
      if (required && granted !== true) throw new BadRequestException(`${label} consent must be granted for an externally sourced Lead`);
      if (granted === true && (!at || !channel || !purpose)) throw new BadRequestException(`${label} consent timestamp, channel, and purpose are required when consent is granted`);
      if (granted !== true && (at || channel || purpose)) throw new BadRequestException(`${label} consent metadata requires consent to be granted`);
    };
    assertPurpose("Enquiry-response", command.enquiryConsentGranted, command.enquiryConsentAt, command.enquiryConsentChannel, command.enquiryConsentPurpose, command.isExternalEnquiry === true);
    assertPurpose("Marketing", command.marketingConsentGranted, command.marketingConsentAt, command.marketingConsentChannel, command.marketingConsentPurpose, false);
  }

  private assertLeadOwnerOrManager(user: AuthContext, assignedToId: string) {
    if (assignedToId !== user.userId && !user.permissions.includes("commercial:lead:view-all")) {
      throw new ForbiddenException("Only the assigned owner or a manager-tier viewer may update Lead status");
    }
  }

  private assertLeadTransition(current: LeadStatus, next: LeadStatus) {
    const allowed: Record<LeadStatus, LeadStatus[]> = {
      [LeadStatus.NEW]: [LeadStatus.CONTACTED],
      [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED],
      [LeadStatus.QUALIFIED]: [LeadStatus.APPOINTMENT],
      [LeadStatus.APPOINTMENT]: [LeadStatus.NEGOTIATION],
      [LeadStatus.NEGOTIATION]: [LeadStatus.RESERVED],
      [LeadStatus.RESERVED]: [LeadStatus.WON, LeadStatus.LOST],
      [LeadStatus.WON]: [],
      [LeadStatus.LOST]: [],
      [LeadStatus.DISQUALIFIED]: [],
    };
    if (!allowed[current].includes(next)) throw new ConflictException(`Lead cannot transition from ${current} to ${next}`);
  }

  private assertTranslationTarget(entityType: string, field: string) {
    const allowed = new Set(["Project.description", "DevelopmentPhase.description", "UnitType.description"]);
    if (!allowed.has(`${entityType}.${field}`)) {
      throw new BadRequestException("This commercial field is not authorized for translation");
    }
  }

  private async localeResolvedDescriptions(
    tenantId: string,
    unit: { projectId: string; phaseId: string; unitTypeId: string; project: { description?: string | null }; phase: { description?: string | null }; unitType: { description?: string | null } },
    locale: TranslationLocale,
  ) {
    const targets = [
      { key: "project", entityType: "Project", entityId: unit.projectId, fallback: unit.project.description ?? null },
      { key: "phase", entityType: "DevelopmentPhase", entityId: unit.phaseId, fallback: unit.phase.description ?? null },
      { key: "unitType", entityType: "UnitType", entityId: unit.unitTypeId, fallback: unit.unitType.description ?? null },
    ] as const;
    const translations = await this.prisma.translation.findMany({
      where: {
        tenantId,
        field: "description",
        OR: targets.map(({ entityType, entityId }) => ({ entityType, entityId })),
        locale: { in: locale === TranslationLocale.en ? [TranslationLocale.en] : [locale, TranslationLocale.en] },
      },
      select: { entityType: true, entityId: true, locale: true, value: true },
    });
    return Object.fromEntries(targets.map((target) => {
      const requested = translations.find((item) => item.entityType === target.entityType && item.entityId === target.entityId && item.locale === locale);
      const english = translations.find((item) => item.entityType === target.entityType && item.entityId === target.entityId && item.locale === TranslationLocale.en);
      const selected = requested ?? english;
      return [target.key, {
        value: selected?.value ?? target.fallback,
        locale: selected?.locale ?? null,
        fallbackUsed: locale !== TranslationLocale.en && requested === undefined && (english !== undefined || target.fallback !== null),
      }];
    }));
  }

  private async requireTranslationEntity(
    tx: { project: { findFirst: Function }; developmentPhase: { findFirst: Function }; unitType: { findFirst: Function } },
    tenantId: string,
    entityType: string,
    entityId: string,
  ) {
    const entity = entityType === "Project"
      ? await tx.project.findFirst({ where: { id: entityId, tenantId } })
      : entityType === "DevelopmentPhase"
        ? await tx.developmentPhase.findFirst({ where: { id: entityId, tenantId } })
        : await tx.unitType.findFirst({ where: { id: entityId, tenantId } });
    if (!entity) throw new NotFoundException(`${entityType} not found`);
    return entity;
  }

  private async releaseHold(
    tenantId: string,
    id: string,
    next: "EXPIRED" | "CANCELLED",
    user?: AuthContext,
    now = new Date(),
  ) {
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.unitHold.findFirst({ where: { id, tenantId } });
      if (!hold) {
        if (user) throw new NotFoundException("UnitHold not found");
        return null;
      }
      if (hold.status !== UnitHoldStatus.ACTIVE || (next === UnitHoldStatus.EXPIRED && hold.holdExpiresAt > now)) {
        if (user) throw new ConflictException("Only an active Hold can be cancelled");
        return null;
      }
      const timestamps = next === UnitHoldStatus.EXPIRED ? { expiredAt: now } : { cancelledAt: now };
      const holdChanged = await tx.unitHold.updateMany({
        where: { id, tenantId, status: UnitHoldStatus.ACTIVE },
        data: { status: next, ...timestamps },
      });
      if (holdChanged.count !== 1) {
        if (user) throw new ConflictException("Hold state changed concurrently");
        return null;
      }
      const unitChanged = await tx.unit.updateMany({
        where: { id: hold.unitId, tenantId, status: UnitStatus.HELD },
        data: { status: UnitStatus.AVAILABLE },
      });
      if (unitChanged.count !== 1) throw new ConflictException("Unit is no longer held by this Hold");
      if (user) {
        await this.audit(tx, user, "COMMERCIAL_UNIT_HOLD_CANCELLED", "UnitHold", hold.id, {
          unitId: hold.unitId,
          leadId: hold.leadId,
          fromUnitStatus: UnitStatus.HELD,
          toUnitStatus: UnitStatus.AVAILABLE,
        });
      } else {
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId: null,
            action: "COMMERCIAL_UNIT_HOLD_EXPIRED",
            entityType: "UnitHold",
            entityId: hold.id,
            metadata: {
              unitId: hold.unitId,
              leadId: hold.leadId,
              holdExpiresAt: hold.holdExpiresAt.toISOString(),
              fromUnitStatus: UnitStatus.HELD,
              toUnitStatus: UnitStatus.AVAILABLE,
            },
          },
        });
      }
      return this.holdView({ ...hold, status: next, ...timestamps });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private requireHold(tenantId: string, id: string) {
    return this.found(this.prisma.unitHold.findFirst({ where: { id, tenantId } }), "UnitHold");
  }

  private requireHoldTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.unitHold.findFirst({ where: { id, tenantId } }), "UnitHold");
  }

  private requireLeadTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.lead.findFirst({ where: { id, tenantId } }), "Lead");
  }

  private requirePaymentPlanTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.paymentPlan.findFirst({ where: { id, tenantId } }), "PaymentPlan");
  }

  private async requireTenantAssignee(tx: { tenantMembership: { findFirst: Function } }, tenantId: string, userId: string) {
    const membership = await tx.tenantMembership.findFirst({ where: { tenantId, userId, user: { isActive: true } } });
    if (!membership) throw new BadRequestException("Lead assignee is not an active member of this tenant");
  }

  private requireCustomer(tenantId: string, id: string) {
    return this.found(this.prisma.customer.findFirst({ where: { id, tenantId } }), "Customer");
  }

  private requireCustomerTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.customer.findFirst({ where: { id, tenantId } }), "Customer");
  }

  private requireProjectTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.project.findFirst({ where: { id, tenantId } }), "Project");
  }

  private requireUnitTx(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    return this.found(tx.unit.findFirst({ where: { id, tenantId } }), "Unit");
  }

  private requireLead(tenantId: string, id: string, assignedToId?: string) {
    return this.found(this.prisma.lead.findFirst({ where: { id, tenantId, ...(assignedToId ? { assignedToId } : {}) }, include: this.leadInclude() }), "Lead");
  }

  private leadInclude() {
    return {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      project: { select: { id: true, code: true, name: true } },
      unit: { select: { id: true, code: true, number: true } },
      assignedTo: { select: { id: true, displayName: true } },
    } as const;
  }

  private translationView(translation: { id: string; entityType: string; entityId: string; locale: TranslationLocale; field: string; value: string; createdAt: Date; updatedAt: Date }, fallbackUsed: boolean) {
    return { id: translation.id, entityType: translation.entityType, entityId: translation.entityId, locale: translation.locale, field: translation.field, value: translation.value, fallbackUsed, createdAt: translation.createdAt, updatedAt: translation.updatedAt };
  }

  private holdView(hold: { id: string; unitId: string; leadId: string; status: UnitHoldStatus; holdExpiresAt: Date; createdById: string; releasedAt: Date | null; cancelledAt: Date | null; expiredAt: Date | null; convertedAt: Date | null; createdAt: Date; updatedAt: Date }) {
    return { id: hold.id, unitId: hold.unitId, leadId: hold.leadId, status: hold.status, holdExpiresAt: hold.holdExpiresAt, createdById: hold.createdById, releasedAt: hold.releasedAt, cancelledAt: hold.cancelledAt, expiredAt: hold.expiredAt, convertedAt: hold.convertedAt, createdAt: hold.createdAt, updatedAt: hold.updatedAt };
  }

  private reservationView(reservation: { id: string; holdId: string; unitId: string; leadId: string; customerId: string; paymentPlanId: string; sourcePriceRevisionId: string; basePriceSnapshotMinor: bigint; listPriceSnapshotMinor: bigint; reservationAmountMinor: bigint; currency: string; status: string; createdById: string; approvedById: string | null; confirmedAt: Date | null; createdAt: Date; updatedAt: Date }) {
    return { id: reservation.id, holdId: reservation.holdId, unitId: reservation.unitId, leadId: reservation.leadId, customerId: reservation.customerId, paymentPlanId: reservation.paymentPlanId, sourcePriceRevisionId: reservation.sourcePriceRevisionId, basePriceSnapshotMinor: reservation.basePriceSnapshotMinor.toString(), listPriceSnapshotMinor: reservation.listPriceSnapshotMinor.toString(), reservationAmountMinor: reservation.reservationAmountMinor.toString(), currency: reservation.currency, status: reservation.status, createdById: reservation.createdById, approvedById: reservation.approvedById, confirmedAt: reservation.confirmedAt, createdAt: reservation.createdAt, updatedAt: reservation.updatedAt };
  }

  private customerView(customer: { id: string; firstName: string; lastName: string | null; phone: string; email: string; dedupReviewRequired: boolean; createdAt: Date; updatedAt: Date }) {
    return { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone, email: customer.email, dedupReviewRequired: customer.dedupReviewRequired, createdAt: customer.createdAt, updatedAt: customer.updatedAt };
  }

  private leadView(lead: { id: string; customerId: string | null; projectId: string | null; unitId: string | null; assignedToId: string; source: string; status: LeadStatus; isExternalEnquiry: boolean; enquiryConsentGranted: boolean; enquiryConsentAt: Date | null; enquiryConsentChannel: string | null; enquiryConsentPurpose: string | null; marketingConsentGranted: boolean; marketingConsentAt: Date | null; marketingConsentChannel: string | null; marketingConsentPurpose: string | null; createdAt: Date; updatedAt: Date; customer: { id: string; firstName: string; lastName: string | null; phone: string; email: string } | null; project: { id: string; code: string; name: string } | null; unit: { id: string; code: string; number: string } | null; assignedTo: { id: string; displayName: string } }) {
    return {
      id: lead.id, customerId: lead.customerId, projectId: lead.projectId, unitId: lead.unitId, assignedToId: lead.assignedToId,
      source: lead.source, status: lead.status, isExternalEnquiry: lead.isExternalEnquiry,
      enquiryConsent: { granted: lead.enquiryConsentGranted, at: lead.enquiryConsentAt, channel: lead.enquiryConsentChannel, purpose: lead.enquiryConsentPurpose },
      marketingConsent: { granted: lead.marketingConsentGranted, at: lead.marketingConsentAt, channel: lead.marketingConsentChannel, purpose: lead.marketingConsentPurpose },
      customer: lead.customer, project: lead.project, unit: lead.unit, assignedTo: lead.assignedTo,
      createdAt: lead.createdAt, updatedAt: lead.updatedAt,
    };
  }

  private activityView(activity: { id: string; leadId: string; actorId: string; type: SalesActivityType; notes: string; createdAt: Date; actor: { id: string; displayName: string } }) {
    return { id: activity.id, leadId: activity.leadId, actorId: activity.actorId, actor: activity.actor, type: activity.type, notes: activity.notes, createdAt: activity.createdAt };
  }

  private normalizeSaudiPhone(value: string) {
    const compact = value.trim().replace(/[\s()-]/g, "");
    const local = compact.startsWith("+966") ? compact.slice(4) : compact.startsWith("00966") ? compact.slice(5) : compact.startsWith("966") ? compact.slice(3) : compact.startsWith("0") ? compact.slice(1) : compact;
    if (!/^5\d{8}$/.test(local)) throw new BadRequestException("Phone must be a Saudi mobile number");
    return `+966${local}`;
  }

  private normalizeEmail(value: string) { return value.trim().toLowerCase(); }

  private async removeMedia(user: AuthContext, entityType: string, id: string, delegate: (tx: Prisma.TransactionClient) => { findFirst: Function; delete: Function }) {
    return this.prisma.$transaction(async (tx) => {
      const media = await delegate(tx).findFirst({ where: { id, tenantId: user.tenantId } });
      if (!media) throw new NotFoundException(`${entityType} not found`);
      await delegate(tx).delete({ where: { id } });
      await this.audit(tx, user, "COMMERCIAL_MEDIA_REMOVED", entityType, id, {});
      return media;
    });
  }

  private priceView(revision: { id: string; unitId: string; revision: number; basePriceMinor: bigint; listPriceMinor: bigint; currency: string; validFrom: Date | null; validTo: Date | null; status: UnitPriceRevisionStatus; createdById: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date }) {
    return {
      id: revision.id,
      unitId: revision.unitId,
      revision: revision.revision,
      basePriceMinor: revision.basePriceMinor.toString(),
      listPriceMinor: revision.listPriceMinor.toString(),
      currency: revision.currency,
      validFrom: revision.validFrom,
      validTo: revision.validTo,
      status: revision.status,
      publishedAt: revision.publishedAt,
      createdAt: revision.createdAt,
      updatedAt: revision.updatedAt,
    };
  }

  private assertInstallments(installments: CreatePaymentPlanDto["installments"]) {
    const sequences = new Set(installments.map((installment) => installment.sequence));
    if (sequences.size !== installments.length) throw new BadRequestException("Installment sequences must be unique");
    const total = installments.reduce((sum, installment) => sum + installment.shareBasisPoints, 0);
    if (total !== 10000) throw new BadRequestException("Installment shares must total exactly 10000 basis points");
  }

  private installments(tenantId: string, command: CreatePaymentPlanDto) {
    return command.installments.map((installment) => ({
      tenant: { connect: { id: tenantId } },
      sequence: installment.sequence,
      shareBasisPoints: installment.shareBasisPoints,
      ...(installment.label ? { label: installment.label.trim() } : {}),
    }));
  }

  private minorUnits(value: string, field: string) {
    const result = new Prisma.Decimal(value);
    if (result.lt(0)) throw new BadRequestException(`${field} cannot be negative`);
    return BigInt(value);
  }

  private async requireDocumentVersion(tx: Prisma.TransactionClient, tenantId: string, projectId: string, id: string) {
    const version = await tx.documentVersion.findFirst({ where: { id, tenantId, document: { projectId, tenantId } } });
    if (!version) throw new BadRequestException("Document version is not available for this commercial owner");
    return version;
  }

  private async assertHierarchy(tenantId: string, value: { projectId: string; phaseId: string; buildingId: string; floorId: string; unitTypeId: string }) {
    const [phase, building, floor, unitType] = await Promise.all([
      this.prisma.developmentPhase.findFirst({ where: { id: value.phaseId, tenantId, projectId: value.projectId } }),
      this.prisma.building.findFirst({ where: { id: value.buildingId, tenantId, projectId: value.projectId, phaseId: value.phaseId } }),
      this.prisma.floor.findFirst({ where: { id: value.floorId, tenantId, buildingId: value.buildingId } }),
      this.prisma.unitType.findFirst({ where: { id: value.unitTypeId, tenantId, projectId: value.projectId } }),
    ]);
    if (!phase || !building || !floor || !unitType) throw new BadRequestException("Unit hierarchy is inconsistent");
  }

  private requireProject(tenantId: string, id: string) { return this.found(this.prisma.project.findFirst({ where: { id, tenantId } }), "Project"); }
  private requirePhase(tenantId: string, id: string, projectId?: string) { return this.found(this.prisma.developmentPhase.findFirst({ where: { id, tenantId, ...(projectId ? { projectId } : {}) } }), "Phase"); }
  private requireBuilding(tenantId: string, id: string) { return this.found(this.prisma.building.findFirst({ where: { id, tenantId } }), "Building"); }
  private requireFloor(tenantId: string, id: string) { return this.found(this.prisma.floor.findFirst({ where: { id, tenantId } }), "Floor"); }
  private requireUnitType(tenantId: string, id: string) { return this.found(this.prisma.unitType.findFirst({ where: { id, tenantId } }), "Unit type"); }
  private requireUnit(tenantId: string, id: string, include = false) { return this.found(this.prisma.unit.findFirst({ where: { id, tenantId }, ...(include ? { include: this.unitInclude() } : {}) }), "Unit"); }
  private async found<T>(query: Promise<T | null>, entity: string): Promise<T> { const value = await query; if (!value) throw new NotFoundException(`${entity} not found`); return value; }
  private unitInclude() { return { project: { select: { id: true, code: true, name: true, description: true } }, phase: { select: { id: true, code: true, name: true, description: true } }, building: { select: { id: true, code: true, name: true } }, floor: { select: { id: true, code: true, name: true, floorNumber: true } }, unitType: { select: { id: true, code: true, name: true, description: true } } } as const; }
  private code(value: string) { return value.trim().toUpperCase(); }
  private positiveDecimal(value: string, field: string) { const result = new Prisma.Decimal(value); if (result.lte(0)) throw new BadRequestException(`${field} must be positive`); return result; }
  private areas(gross: string, net?: string) { const grossArea = this.positiveDecimal(gross, "Gross area"); const netArea = net ? this.positiveDecimal(net, "Net area") : undefined; if (netArea?.gt(grossArea)) throw new BadRequestException("Net area cannot exceed gross area"); return { grossArea, ...(netArea ? { netArea } : {}) }; }
  private assertDateOrder(start?: string, end?: string, label?: string) { if (start && end && new Date(end) < new Date(start)) throw new BadRequestException(`${label} end cannot precede start`); }
  private phaseDates(value: UpdatePhaseDto | CreatePhaseDto) { return { ...(value.launchDate ? { launchDate: new Date(value.launchDate) } : {}), ...(value.expectedCompletionDate ? { expectedCompletionDate: new Date(value.expectedCompletionDate) } : {}), ...(value.salesOpenAt ? { salesOpenAt: new Date(value.salesOpenAt) } : {}), ...(value.salesCloseAt ? { salesCloseAt: new Date(value.salesCloseAt) } : {}) }; }
  private snapshot(value: Record<string, unknown>) { const { tenantId: _tenant, ...safe } = value; return JSON.parse(JSON.stringify(safe)) as Prisma.InputJsonObject; }
  private audit(tx: Prisma.TransactionClient, user: AuthContext, action: string, entityType: string, entityId: string, metadata: Prisma.InputJsonObject) { return tx.auditEvent.create({ data: { tenantId: user.tenantId, actorId: user.userId, action, entityType, entityId, metadata } }); }
  private async unique<T>(message: string, action: () => Promise<T>) { try { return await action(); } catch (error) { if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") throw new ConflictException(message); throw error; } }
}
