import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateInventoryLocationDto,
  CreateMaterialDto,
  CreateProcurementOrderDto,
  CreateTakeoffDto,
  IssueMaterialDto,
  ReceiveMaterialDto,
} from "./materials.dto";

type ReadinessStatus = "SHORTAGE" | "ORDERED" | "AVAILABLE" | "ISSUED";

export interface MaterialReadinessMetric {
  materialId: string;
  code: string;
  description: string;
  unit: string;
  required: string;
  ordered: string;
  received: string;
  issued: string;
  stock: string;
  remaining: string;
  gap: string;
  status: ReadinessStatus;
}

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async materials(tenantId: string, query?: string) {
    return this.prisma.material.findMany({
      where: {
        tenantId,
        status: { not: "ARCHIVED" },
        ...(query
          ? {
              OR: [
                { code: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ code: "asc" }],
      take: 500,
    });
  }

  async createMaterial(
    tenantId: string,
    actorId: string,
    command: CreateMaterialDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const material = await tx.material.create({
          data: {
            tenantId,
            code: command.code.trim().toUpperCase(),
            description: command.description.trim(),
            baseUnit: command.baseUnit.trim().toUpperCase(),
            ...(command.category ? { category: command.category.trim() } : {}),
            ...(command.specification
              ? { specification: command.specification.trim() }
              : {}),
          },
        });
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "MATERIAL_CREATED",
            entityType: "Material",
            entityId: material.id,
            metadata: { code: material.code, baseUnit: material.baseUnit },
          },
        });
        return material;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Material code already exists");
      }
      throw error;
    }
  }

  async takeoffs(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.materialTakeoff.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async activeTakeoff(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeMaterialTakeoffId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeMaterialTakeoffId) {
      throw new NotFoundException("No published material takeoff exists");
    }
    return this.prisma.materialTakeoff.findFirstOrThrow({
      where: {
        id: project.activeMaterialTakeoffId,
        tenantId,
        projectId,
      },
      include: {
        lines: {
          orderBy: [{ requiredOn: "asc" }, { id: "asc" }],
          include: {
            material: { select: { code: true, description: true, baseUnit: true } },
            wbsNode: { select: { code: true, name: true } },
            bimElement: { select: { globalId: true, name: true } },
          },
        },
      },
    });
  }

  async createTakeoff(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateTakeoffDto,
  ) {
    await this.requireProject(tenantId, projectId);
    const materialIds = [...new Set(command.lines.map((line) => line.materialId))];
    const wbsNodeIds = [...new Set(command.lines.map((line) => line.wbsNodeId))];
    const bimElementIds = [
      ...new Set(
        command.lines
          .map((line) => line.bimElementId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [materialCount, wbsCount, bimCount] = await Promise.all([
      this.prisma.material.count({
        where: { id: { in: materialIds }, tenantId, status: "ACTIVE" },
      }),
      this.prisma.wbsNode.count({
        where: { id: { in: wbsNodeIds }, tenantId, projectId },
      }),
      bimElementIds.length
        ? this.prisma.bimElement.count({
            where: {
              id: { in: bimElementIds },
              tenantId,
              bimModel: { projectId },
            },
          })
        : Promise.resolve(0),
    ]);
    if (materialCount !== materialIds.length) {
      throw new BadRequestException("Every takeoff material must be active in this tenant");
    }
    if (wbsCount !== wbsNodeIds.length) {
      throw new BadRequestException("Every takeoff line must reference this project WBS");
    }
    if (bimCount !== bimElementIds.length) {
      throw new BadRequestException("Every BIM element must belong to this project");
    }

    const keys = command.lines.map(
      (line) =>
        `${line.materialId}|${line.wbsNodeId}|${line.bimElementId ?? ""}|${
          line.sourceReference?.trim() ?? ""
        }`,
    );
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException("Duplicate material takeoff line");
    }

    const lines = command.lines.map((line) => {
      const quantity = new Prisma.Decimal(line.quantity);
      const wastePercent = new Prisma.Decimal(line.wastePercent);
      if (quantity.lte(0)) throw new BadRequestException("Takeoff quantity must be positive");
      if (wastePercent.lt(0) || wastePercent.gt(100)) {
        throw new BadRequestException("Waste percent must be between 0 and 100");
      }
      return {
        tenantId,
        materialId: line.materialId,
        wbsNodeId: line.wbsNodeId,
        ...(line.bimElementId ? { bimElementId: line.bimElementId } : {}),
        source: line.source,
        ...(line.sourceReference
          ? { sourceReference: line.sourceReference.trim() }
          : {}),
        quantity,
        wastePercent,
        requiredQuantity: quantity
          .mul(new Prisma.Decimal(1).plus(wastePercent.div(100)))
          .toDecimalPlaces(4),
        ...(line.requiredOn ? { requiredOn: new Date(line.requiredOn) } : {}),
      };
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const takeoff = await tx.materialTakeoff.create({
          data: {
            tenantId,
            projectId,
            createdById: actorId,
            name: command.name.trim(),
            revision: command.revision.trim(),
          },
        });
        await tx.materialTakeoffLine.createMany({
          data: lines.map((line) => ({ ...line, takeoffId: takeoff.id })),
        });
        const totalQuantity = lines.reduce(
          (sum, line) => sum.plus(line.requiredQuantity),
          new Prisma.Decimal(0),
        );
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "MATERIAL_TAKEOFF_CREATED",
            entityType: "MaterialTakeoff",
            entityId: takeoff.id,
            metadata: {
              projectId,
              revision: takeoff.revision,
              lines: lines.length,
              totalRequiredQuantity: this.quantity(totalQuantity),
            },
          },
        });
        return tx.materialTakeoff.findUniqueOrThrow({
          where: { id: takeoff.id },
          include: { _count: { select: { lines: true } } },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Material takeoff revision already exists");
      }
      throw error;
    }
  }

  async publishTakeoff(
    tenantId: string,
    projectId: string,
    takeoffId: string,
    actorId: string,
  ) {
    const takeoff = await this.prisma.materialTakeoff.findFirst({
      where: { id: takeoffId, tenantId, projectId },
      include: { _count: { select: { lines: true } } },
    });
    if (!takeoff) throw new NotFoundException("Material takeoff not found");
    if (takeoff.status !== "DRAFT") {
      throw new ConflictException("Only a draft material takeoff can be published");
    }
    if (!takeoff._count.lines) {
      throw new ConflictException("An empty material takeoff cannot be published");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const project = await tx.project.updateMany({
          where: { id: projectId, tenantId },
          data: { activeMaterialTakeoffId: takeoffId },
        });
        if (project.count !== 1) throw new NotFoundException("Project not found");

        await tx.materialTakeoff.updateMany({
          where: {
            tenantId,
            projectId,
            id: { not: takeoffId },
            status: "PUBLISHED",
          },
          data: { status: "SUPERSEDED" },
        });
        const published = await tx.materialTakeoff.updateMany({
          where: { id: takeoffId, tenantId, projectId, status: "DRAFT" },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        if (published.count !== 1) {
          throw new ConflictException("Material takeoff state changed concurrently");
        }
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "MATERIAL_TAKEOFF_PUBLISHED",
            entityType: "MaterialTakeoff",
            entityId: takeoffId,
            metadata: { projectId, revision: takeoff.revision },
          },
        });
        return tx.materialTakeoff.findUniqueOrThrow({
          where: { id: takeoffId },
          include: { _count: { select: { lines: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async locations(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.inventoryLocation.findMany({
      where: { tenantId, projectId },
      orderBy: { code: "asc" },
    });
  }

  async createLocation(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateInventoryLocationDto,
  ) {
    await this.requireProject(tenantId, projectId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const location = await tx.inventoryLocation.create({
          data: {
            tenantId,
            projectId,
            code: command.code.trim().toUpperCase(),
            name: command.name.trim(),
          },
        });
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "INVENTORY_LOCATION_CREATED",
            entityType: "InventoryLocation",
            entityId: location.id,
            metadata: { projectId, code: location.code },
          },
        });
        return location;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Inventory location code already exists");
      }
      throw error;
    }
  }

  async procurementOrders(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    const orders = await this.prisma.procurementOrder.findMany({
      where: { tenantId, projectId },
      orderBy: { placedAt: "desc" },
      include: {
        lines: {
          orderBy: { lineNumber: "asc" },
          include: {
            material: { select: { code: true, description: true, baseUnit: true } },
            wbsNode: { select: { code: true, name: true } },
            movements: {
              where: { movementType: "RECEIPT" },
              select: { quantityDelta: true },
            },
          },
        },
      },
    });
    return orders.map((order) => ({
      ...order,
      lines: order.lines.map((line) => {
        const received = line.movements.reduce(
          (sum, movement) => sum.plus(movement.quantityDelta),
          new Prisma.Decimal(0),
        );
        return {
          ...line,
          orderedQuantity: this.quantity(line.orderedQuantity),
          unitPrice: this.money(line.unitPrice),
          lineAmount: this.money(line.lineAmount),
          receivedQuantity: this.quantity(received),
          outstandingQuantity: this.quantity(
            new Prisma.Decimal(line.orderedQuantity).minus(received),
          ),
          movements: undefined,
        };
      }),
    }));
  }

  async createProcurementOrder(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateProcurementOrderDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeBudget: { select: { id: true, currency: true } } },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeBudget) {
      throw new ConflictException("Publish a budget before creating procurement commitments");
    }
    if (project.activeBudget.currency !== command.currency) {
      throw new BadRequestException("Procurement currency must match the active budget");
    }

    const lineNumbers = command.lines.map((line) => line.lineNumber);
    if (new Set(lineNumbers).size !== lineNumbers.length) {
      throw new BadRequestException("Procurement line numbers must be unique");
    }
    const materialIds = [...new Set(command.lines.map((line) => line.materialId))];
    const wbsNodeIds = [...new Set(command.lines.map((line) => line.wbsNodeId))];
    const [materials, wbsNodes, budgetLines] = await Promise.all([
      this.prisma.material.findMany({
        where: { id: { in: materialIds }, tenantId, status: "ACTIVE" },
        select: { id: true },
      }),
      this.prisma.wbsNode.findMany({
        where: { id: { in: wbsNodeIds }, tenantId, projectId },
        select: { id: true },
      }),
      this.prisma.budgetLine.findMany({
        where: {
          id: {
            in: command.lines
              .map((line) => line.budgetLineId)
              .filter((id): id is string => Boolean(id)),
          },
          tenantId,
          budgetId: project.activeBudget.id,
        },
        select: { id: true, wbsNodeId: true },
      }),
    ]);
    if (materials.length !== materialIds.length) {
      throw new BadRequestException("Every procurement material must be active");
    }
    if (wbsNodes.length !== wbsNodeIds.length) {
      throw new BadRequestException("Every procurement line must reference this project WBS");
    }
    const budgetLineMap = new Map(
      budgetLines.map((line) => [line.id, line.wbsNodeId]),
    );
    for (const line of command.lines) {
      if (
        line.budgetLineId &&
        budgetLineMap.get(line.budgetLineId) !== line.wbsNodeId
      ) {
        throw new BadRequestException(
          "Budget line must belong to the active budget and selected WBS",
        );
      }
    }

    const normalized = command.lines.map((line) => {
      const orderedQuantity = new Prisma.Decimal(line.orderedQuantity);
      const unitPrice = new Prisma.Decimal(line.unitPrice);
      if (orderedQuantity.lte(0)) {
        throw new BadRequestException("Ordered quantity must be positive");
      }
      if (unitPrice.lt(0)) {
        throw new BadRequestException("Unit price cannot be negative");
      }
      return {
        ...line,
        orderedQuantity,
        unitPrice,
        lineAmount: orderedQuantity.mul(unitPrice).toDecimalPlaces(2),
      };
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.procurementOrder.create({
          data: {
            tenantId,
            projectId,
            createdById: actorId,
            externalId: command.externalId.trim(),
            ...(command.vendorCode
              ? { vendorCode: command.vendorCode.trim().toUpperCase() }
              : {}),
            vendorName: command.vendorName.trim(),
            currency: command.currency,
            placedAt: new Date(command.placedAt),
          },
        });

        for (const line of normalized) {
          const commitment = await tx.costLedgerEntry.create({
            data: {
              tenantId,
              projectId,
              createdById: actorId,
              wbsNodeId: line.wbsNodeId,
              ...(line.budgetLineId ? { budgetLineId: line.budgetLineId } : {}),
              entryType: "COMMITMENT",
              externalId: `PO:${order.externalId}:${line.lineNumber}`,
              description: `${order.vendorName} — material commitment`,
              amount: line.lineAmount,
              currency: order.currency,
              occurredAt: order.placedAt,
            },
          });
          await tx.procurementOrderLine.create({
            data: {
              tenantId,
              procurementOrderId: order.id,
              lineNumber: line.lineNumber,
              materialId: line.materialId,
              wbsNodeId: line.wbsNodeId,
              ...(line.budgetLineId ? { budgetLineId: line.budgetLineId } : {}),
              costLedgerEntryId: commitment.id,
              orderedQuantity: line.orderedQuantity,
              unitPrice: line.unitPrice,
              lineAmount: line.lineAmount,
              ...(line.promisedOn ? { promisedOn: new Date(line.promisedOn) } : {}),
            },
          });
        }

        const total = normalized.reduce(
          (sum, line) => sum.plus(line.lineAmount),
          new Prisma.Decimal(0),
        );
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorId,
            action: "PROCUREMENT_ORDER_CREATED",
            entityType: "ProcurementOrder",
            entityId: order.id,
            metadata: {
              projectId,
              externalId: order.externalId,
              vendorName: order.vendorName,
              lines: normalized.length,
              total: this.money(total),
              currency: order.currency,
            },
          },
        });
        return {
          ...(await tx.procurementOrder.findUniqueOrThrow({
            where: { id: order.id },
            include: { lines: { orderBy: { lineNumber: "asc" } } },
          })),
          total: this.money(total),
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Procurement order or commitment already exists");
      }
      throw error;
    }
  }

  async receive(
    tenantId: string,
    projectId: string,
    orderId: string,
    lineId: string,
    actorId: string,
    command: ReceiveMaterialDto,
  ) {
    const [line, location] = await Promise.all([
      this.prisma.procurementOrderLine.findFirst({
        where: {
          id: lineId,
          procurementOrderId: orderId,
          tenantId,
          procurementOrder: { projectId, status: "OPEN" },
        },
        include: { procurementOrder: true },
      }),
      this.prisma.inventoryLocation.findFirst({
        where: { id: command.locationId, tenantId, projectId, isActive: true },
      }),
    ]);
    if (!line) throw new NotFoundException("Open procurement order line not found");
    if (!location) throw new NotFoundException("Active inventory location not found");
    const quantity = new Prisma.Decimal(command.quantity);
    if (quantity.lte(0)) throw new BadRequestException("Receipt quantity must be positive");

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const received = await tx.materialMovement.aggregate({
            where: { procurementOrderLineId: lineId, movementType: "RECEIPT" },
            _sum: { quantityDelta: true },
          });
          const prior = received._sum.quantityDelta ?? new Prisma.Decimal(0);
          if (prior.plus(quantity).gt(line.orderedQuantity)) {
            throw new ConflictException("Receipt exceeds outstanding order quantity");
          }
          const movement = await tx.materialMovement.create({
            data: {
              tenantId,
              projectId,
              createdById: actorId,
              locationId: location.id,
              materialId: line.materialId,
              wbsNodeId: line.wbsNodeId,
              procurementOrderLineId: line.id,
              movementType: "RECEIPT",
              externalId: command.externalId.trim(),
              quantityDelta: quantity,
              occurredAt: new Date(command.occurredAt),
              ...(command.note ? { note: command.note.trim() } : {}),
            },
          });

          const orderLines = await tx.procurementOrderLine.findMany({
            where: { procurementOrderId: orderId },
            include: {
              movements: {
                where: { movementType: "RECEIPT" },
                select: { quantityDelta: true },
              },
            },
          });
          const complete = orderLines.every((orderLine) => {
            const lineReceived = orderLine.movements.reduce(
              (sum, item) => sum.plus(item.quantityDelta),
              new Prisma.Decimal(0),
            );
            return lineReceived.gte(orderLine.orderedQuantity);
          });
          if (complete) {
            await tx.procurementOrder.update({
              where: { id: orderId },
              data: { status: "CLOSED" },
            });
          }
          await tx.auditEvent.create({
            data: {
              tenantId,
              actorId,
              action: "MATERIAL_RECEIVED",
              entityType: "MaterialMovement",
              entityId: movement.id,
              metadata: {
                projectId,
                procurementOrderId: orderId,
                procurementOrderLineId: lineId,
                materialId: line.materialId,
                quantity: this.quantity(quantity),
                locationId: location.id,
              },
            },
          });
          return {
            ...movement,
            quantityDelta: this.quantity(movement.quantityDelta),
            orderClosed: complete,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Receipt external ID already exists");
      }
      throw error;
    }
  }

  async issue(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: IssueMaterialDto,
  ) {
    const [location, material, wbs] = await Promise.all([
      this.prisma.inventoryLocation.findFirst({
        where: { id: command.locationId, tenantId, projectId, isActive: true },
      }),
      this.prisma.material.findFirst({
        where: { id: command.materialId, tenantId, status: "ACTIVE" },
      }),
      this.prisma.wbsNode.findFirst({
        where: { id: command.wbsNodeId, tenantId, projectId },
      }),
    ]);
    if (!location) throw new NotFoundException("Active inventory location not found");
    if (!material) throw new NotFoundException("Active material not found");
    if (!wbs) throw new NotFoundException("WBS node not found in this project");
    const quantity = new Prisma.Decimal(command.quantity);
    if (quantity.lte(0)) throw new BadRequestException("Issue quantity must be positive");

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const stock = await tx.materialMovement.aggregate({
            where: {
              tenantId,
              projectId,
              locationId: location.id,
              materialId: material.id,
            },
            _sum: { quantityDelta: true },
          });
          const balance = stock._sum.quantityDelta ?? new Prisma.Decimal(0);
          if (balance.lt(quantity)) {
            throw new ConflictException("Insufficient stock at this location");
          }
          const movement = await tx.materialMovement.create({
            data: {
              tenantId,
              projectId,
              createdById: actorId,
              locationId: location.id,
              materialId: material.id,
              wbsNodeId: wbs.id,
              movementType: "ISSUE",
              externalId: command.externalId.trim(),
              quantityDelta: quantity.negated(),
              occurredAt: new Date(command.occurredAt),
              ...(command.note ? { note: command.note.trim() } : {}),
            },
          });
          await tx.auditEvent.create({
            data: {
              tenantId,
              actorId,
              action: "MATERIAL_ISSUED",
              entityType: "MaterialMovement",
              entityId: movement.id,
              metadata: {
                projectId,
                materialId: material.id,
                wbsNodeId: wbs.id,
                quantity: this.quantity(quantity),
                locationId: location.id,
              },
            },
          });
          return {
            ...movement,
            quantityDelta: this.quantity(movement.quantityDelta),
            balance: this.quantity(balance.minus(quantity)),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Issue external ID already exists");
      }
      throw error;
    }
  }

  async balances(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    const groups = await this.prisma.materialMovement.groupBy({
      by: ["locationId", "materialId"],
      where: { tenantId, projectId },
      _sum: { quantityDelta: true },
    });
    const locationIds = [...new Set(groups.map((group) => group.locationId))];
    const materialIds = [...new Set(groups.map((group) => group.materialId))];
    const [locations, materials] = await Promise.all([
      this.prisma.inventoryLocation.findMany({
        where: { id: { in: locationIds }, tenantId, projectId },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.material.findMany({
        where: { id: { in: materialIds }, tenantId },
        select: { id: true, code: true, description: true, baseUnit: true },
      }),
    ]);
    const locationMap = new Map(locations.map((location) => [location.id, location]));
    const materialMap = new Map(materials.map((material) => [material.id, material]));
    return groups
      .map((group) => ({
        location: locationMap.get(group.locationId),
        material: materialMap.get(group.materialId),
        quantity: this.quantity(group._sum.quantityDelta ?? new Prisma.Decimal(0)),
      }))
      .sort((a, b) => {
        const location = (a.location?.code ?? "").localeCompare(b.location?.code ?? "");
        return location || (a.material?.code ?? "").localeCompare(b.material?.code ?? "");
      });
  }

  async readiness(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { activeMaterialTakeoffId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (!project.activeMaterialTakeoffId) {
      return { takeoff: null, summary: null, materials: [] };
    }

    const takeoff = await this.prisma.materialTakeoff.findFirstOrThrow({
      where: {
        id: project.activeMaterialTakeoffId,
        tenantId,
        projectId,
        status: "PUBLISHED",
      },
      include: {
        lines: {
          include: {
            material: {
              select: { id: true, code: true, description: true, baseUnit: true },
            },
          },
        },
      },
    });

    const [orderedGroups, receiptGroups, issueGroups, stockGroups] = await Promise.all([
      this.prisma.procurementOrderLine.groupBy({
        by: ["materialId"],
        where: {
          tenantId,
          procurementOrder: {
            projectId,
            status: { not: "CANCELLED" },
          },
        },
        _sum: { orderedQuantity: true },
      }),
      this.prisma.materialMovement.groupBy({
        by: ["materialId"],
        where: { tenantId, projectId, movementType: "RECEIPT" },
        _sum: { quantityDelta: true },
      }),
      this.prisma.materialMovement.groupBy({
        by: ["materialId"],
        where: { tenantId, projectId, movementType: "ISSUE" },
        _sum: { quantityDelta: true },
      }),
      this.prisma.materialMovement.groupBy({
        by: ["materialId"],
        where: { tenantId, projectId },
        _sum: { quantityDelta: true },
      }),
    ]);
    const sums = (groups: Array<{ materialId: string; _sum: { [key: string]: unknown } }>) =>
      new Map(
        groups.map((group) => [
          group.materialId,
          new Prisma.Decimal(
            (group._sum.orderedQuantity ??
              group._sum.quantityDelta ??
              0) as Prisma.Decimal.Value,
          ),
        ]),
      );
    const ordered = sums(orderedGroups);
    const received = sums(receiptGroups);
    const issued = sums(issueGroups);
    const stock = sums(stockGroups);

    const requiredByMaterial = new Map<
      string,
      { material: (typeof takeoff.lines)[number]["material"]; quantity: Prisma.Decimal }
    >();
    for (const line of takeoff.lines) {
      const current = requiredByMaterial.get(line.materialId) ?? {
        material: line.material,
        quantity: new Prisma.Decimal(0),
      };
      current.quantity = current.quantity.plus(line.requiredQuantity);
      requiredByMaterial.set(line.materialId, current);
    }

    const materials: MaterialReadinessMetric[] = [];
    for (const [materialId, requirement] of requiredByMaterial) {
      const orderedQuantity = ordered.get(materialId) ?? new Prisma.Decimal(0);
      const receivedQuantity = received.get(materialId) ?? new Prisma.Decimal(0);
      const issuedQuantity = (
        issued.get(materialId) ?? new Prisma.Decimal(0)
      ).abs();
      const stockQuantity = stock.get(materialId) ?? new Prisma.Decimal(0);
      const remaining = Prisma.Decimal.max(
        requirement.quantity.minus(issuedQuantity),
        new Prisma.Decimal(0),
      );
      const gap = Prisma.Decimal.max(
        remaining.minus(stockQuantity).minus(
          Prisma.Decimal.max(orderedQuantity.minus(receivedQuantity), 0),
        ),
        new Prisma.Decimal(0),
      );
      const status: ReadinessStatus =
        issuedQuantity.gte(requirement.quantity)
          ? "ISSUED"
          : stockQuantity.gte(remaining)
            ? "AVAILABLE"
            : orderedQuantity.gte(requirement.quantity)
              ? "ORDERED"
              : "SHORTAGE";
      materials.push({
        materialId,
        code: requirement.material.code,
        description: requirement.material.description,
        unit: requirement.material.baseUnit,
        required: this.quantity(requirement.quantity),
        ordered: this.quantity(orderedQuantity),
        received: this.quantity(receivedQuantity),
        issued: this.quantity(issuedQuantity),
        stock: this.quantity(stockQuantity),
        remaining: this.quantity(remaining),
        gap: this.quantity(gap),
        status,
      });
    }

    const counts = (status: ReadinessStatus) =>
      materials.filter((material) => material.status === status).length;
    return {
      takeoff: {
        id: takeoff.id,
        name: takeoff.name,
        revision: takeoff.revision,
      },
      summary: {
        materials: materials.length,
        shortage: counts("SHORTAGE"),
        ordered: counts("ORDERED"),
        available: counts("AVAILABLE"),
        issued: counts("ISSUED"),
      },
      materials: materials.sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  async materialState(tenantId: string, bimModelId: string) {
    const model = await this.prisma.bimModel.findFirst({
      where: { id: bimModelId, tenantId },
      select: { projectId: true },
    });
    if (!model) throw new NotFoundException("BIM model not found");
    const readiness = await this.readiness(tenantId, model.projectId);
    if (!readiness.takeoff) {
      return { takeoff: null, summary: null, elements: [] };
    }
    const metrics = new Map(
      readiness.materials.map((material) => [material.materialId, material]),
    );
    const elements = await this.prisma.bimElement.findMany({
      where: { tenantId, bimModelId },
      select: {
        globalId: true,
        materialTakeoffLines: {
          where: { takeoffId: readiness.takeoff.id },
          select: { materialId: true },
        },
        wbsLinks: {
          select: {
            wbsNode: {
              select: {
                materialTakeoffLines: {
                  where: { takeoffId: readiness.takeoff.id },
                  select: { materialId: true },
                },
              },
            },
          },
        },
      },
    });
    const priority: Record<ReadinessStatus, number> = {
      SHORTAGE: 4,
      ORDERED: 3,
      AVAILABLE: 2,
      ISSUED: 1,
    };
    const states = elements.map((element) => {
      const direct = element.materialTakeoffLines.map((line) => line.materialId);
      const fallback = element.wbsLinks.flatMap((link) =>
        link.wbsNode.materialTakeoffLines.map((line) => line.materialId),
      );
      const materialIds = [...new Set(direct.length ? direct : fallback)];
      const materialMetrics = materialIds
        .map((materialId) => metrics.get(materialId))
        .filter((metric): metric is MaterialReadinessMetric => Boolean(metric));
      const worst = materialMetrics.sort(
        (a, b) => priority[b.status] - priority[a.status],
      )[0];
      return {
        globalId: element.globalId,
        readinessState: worst?.status ?? "NO_REQUIREMENT",
        materials: materialMetrics.slice(0, 20).map((metric) => ({
          materialId: metric.materialId,
          code: metric.code,
          status: metric.status,
          required: metric.required,
          stock: metric.stock,
          gap: metric.gap,
          unit: metric.unit,
        })),
      };
    });
    return {
      takeoff: readiness.takeoff,
      summary: readiness.summary,
      elements: states,
    };
  }

  private quantity(value: Prisma.Decimal) {
    return value.toDecimalPlaces(4).toFixed(4);
  }

  private money(value: Prisma.Decimal) {
    return value.toDecimalPlaces(2).toFixed(2);
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
