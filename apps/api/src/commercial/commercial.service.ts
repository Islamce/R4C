import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UnitStatus } from "@prisma/client";
import { AuthContext } from "../common/auth-context";
import { PrismaService } from "../prisma/prisma.service";
import {
  BuildingQueryDto,
  CreateBuildingDto,
  CreateFloorDto,
  CreatePhaseDto,
  CreateUnitDto,
  CreateUnitTypeDto,
  UnitQueryDto,
  UpdateBuildingDto,
  UpdateFloorDto,
  UpdatePhaseDto,
  UpdateUnitDto,
  UpdateUnitTypeDto,
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

  async unit(tenantId: string, id: string) { return this.requireUnit(tenantId, id, true); }

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
  private unitInclude() { return { phase: { select: { id: true, code: true, name: true } }, building: { select: { id: true, code: true, name: true } }, floor: { select: { id: true, code: true, name: true, floorNumber: true } }, unitType: { select: { id: true, code: true, name: true } } } as const; }
  private code(value: string) { return value.trim().toUpperCase(); }
  private positiveDecimal(value: string, field: string) { const result = new Prisma.Decimal(value); if (result.lte(0)) throw new BadRequestException(`${field} must be positive`); return result; }
  private areas(gross: string, net?: string) { const grossArea = this.positiveDecimal(gross, "Gross area"); const netArea = net ? this.positiveDecimal(net, "Net area") : undefined; if (netArea?.gt(grossArea)) throw new BadRequestException("Net area cannot exceed gross area"); return { grossArea, ...(netArea ? { netArea } : {}) }; }
  private assertDateOrder(start?: string, end?: string, label?: string) { if (start && end && new Date(end) < new Date(start)) throw new BadRequestException(`${label} end cannot precede start`); }
  private phaseDates(value: UpdatePhaseDto | CreatePhaseDto) { return { ...(value.launchDate ? { launchDate: new Date(value.launchDate) } : {}), ...(value.expectedCompletionDate ? { expectedCompletionDate: new Date(value.expectedCompletionDate) } : {}), ...(value.salesOpenAt ? { salesOpenAt: new Date(value.salesOpenAt) } : {}), ...(value.salesCloseAt ? { salesCloseAt: new Date(value.salesCloseAt) } : {}) }; }
  private snapshot(value: Record<string, unknown>) { const { tenantId: _tenant, ...safe } = value; return JSON.parse(JSON.stringify(safe)) as Prisma.InputJsonObject; }
  private audit(tx: Prisma.TransactionClient, user: AuthContext, action: string, entityType: string, entityId: string, metadata: Prisma.InputJsonObject) { return tx.auditEvent.create({ data: { tenantId: user.tenantId, actorId: user.userId, action, entityType, entityId, metadata } }); }
  private async unique<T>(message: string, action: () => Promise<T>) { try { return await action(); } catch (error) { if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") throw new ConflictException(message); throw error; } }
}
