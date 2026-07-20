import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BimSpatialType, Prisma } from "@prisma/client";
import { Job, Worker } from "bullmq";
import { randomUUID } from "node:crypto";
import IORedis from "ioredis";
import { ObjectStorageService } from "../storage/object-storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { BimJobPayload } from "./bim-queue.service";

interface ExtractedSpatialNode {
  sourceKey: string;
  parentKey?: string;
  globalId?: string;
  spatialType: string;
  name: string;
  sortOrder?: number;
}

interface ExtractedProperty {
  propertySet: string;
  name: string;
  value?: string;
  unit?: string;
}

interface ExtractedElement {
  globalId: string;
  ifcType: string;
  name?: string;
  tag?: string;
  predefinedType?: string;
  spatialKey?: string;
  properties: ExtractedProperty[];
}

interface ExtractedArtifact {
  format: "GLB";
  mimeType: "model/gltf-binary";
  sizeBytes: number;
  geometryElements: number;
  checksumSha256: string;
}

interface ExtractedModel {
  schema: string;
  modelName?: string;
  spatialNodes: ExtractedSpatialNode[];
  elements: ExtractedElement[];
  artifact: ExtractedArtifact;
}

@Injectable()
export class BimProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly connection: IORedis;
  private worker?: Worker<BimJobPayload>;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
  ) {
    this.connection = new IORedis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.workerUrl = config.getOrThrow<string>("BIM_WORKER_URL");
    this.workerToken = config.getOrThrow<string>("BIM_WORKER_TOKEN");
  }

  private readonly workerUrl: string;
  private readonly workerToken: string;

  onModuleInit() {
    this.worker = new Worker<BimJobPayload>(
      "r4c-bim-processing",
      (job) => this.process(job),
      { connection: this.connection, concurrency: 2, lockDuration: 600_000 },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection.quit();
  }

  private async process(job: Job<BimJobPayload>) {
    const { processingJobId, bimModelId, tenantId } = job.data;
    const attempt = job.attemptsMade + 1;
    await this.prisma.$transaction([
      this.prisma.bimProcessingJob.update({
        where: { id: processingJobId },
        data: { status: "RUNNING", attempt, startedAt: new Date(), lastError: null },
      }),
      this.prisma.bimModel.update({
        where: { id: bimModelId },
        data: { status: "PROCESSING", lastError: null },
      }),
    ]);

    try {
      const model = await this.prisma.bimModel.findFirstOrThrow({
        where: { id: bimModelId, tenantId },
        include: { documentVersion: true },
      });
      const sourceUrl = await this.storage.createDownloadUrl(
        model.documentVersion.storageKey,
        model.documentVersion.fileName,
      );
      const artifactStorageKey = [
        "tenants",
        tenantId,
        "projects",
        model.projectId,
        "bim",
        bimModelId,
        `${randomUUID()}.glb`,
      ].join("/");
      const artifactUploadUrl = await this.storage.createUploadUrl(
        artifactStorageKey,
        "model/gltf-binary",
      );
      const response = await fetch(`${this.workerUrl.replace(/\/$/, "")}/process`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.workerToken}`,
        },
        body: JSON.stringify({ sourceUrl, artifactUploadUrl }),
        signal: AbortSignal.timeout(600_000),
      });
      if (!response.ok) {
        throw new Error(`BIM worker returned ${response.status}: ${await response.text()}`);
      }
      const extracted = (await response.json()) as ExtractedModel;
      this.validatePayload(extracted);
      const storedArtifact = await this.storage.head(artifactStorageKey);
      if (storedArtifact.sizeBytes !== extracted.artifact.sizeBytes) {
        throw new Error("Stored geometry artifact size does not match worker output");
      }
      await this.persist(
        model.id,
        tenantId,
        processingJobId,
        artifactStorageKey,
        storedArtifact.etag,
        extracted,
      );
      return { bimModelId, elements: extracted.elements.length };
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 4000) : "Unknown BIM error";
      const finalAttempt = attempt >= (job.opts.attempts ?? 3);
      await this.prisma.$transaction([
        this.prisma.bimProcessingJob.update({
          where: { id: processingJobId },
          data: {
            status: finalAttempt ? "DEAD_LETTER" : "FAILED",
            lastError: message,
            finishedAt: new Date(),
          },
        }),
        this.prisma.bimModel.update({
          where: { id: bimModelId },
          data: { status: "FAILED", lastError: message },
        }),
      ]);
      throw error;
    }
  }

  private validatePayload(payload: ExtractedModel) {
    if (!payload.schema?.startsWith("IFC")) throw new Error("Worker returned an invalid IFC schema");
    if (!Array.isArray(payload.spatialNodes) || !Array.isArray(payload.elements)) {
      throw new Error("Worker returned an invalid extraction payload");
    }
    if (
      payload.artifact?.format !== "GLB" ||
      payload.artifact.mimeType !== "model/gltf-binary" ||
      !Number.isSafeInteger(payload.artifact.sizeBytes) ||
      payload.artifact.sizeBytes <= 0
    ) {
      throw new Error("Worker returned an invalid geometry artifact");
    }
  }

  private async persist(
    bimModelId: string,
    tenantId: string,
    processingJobId: string,
    artifactStorageKey: string,
    artifactEtag: string | undefined,
    extracted: ExtractedModel,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.bimElement.deleteMany({ where: { bimModelId, tenantId } });
      await tx.bimSpatialNode.deleteMany({ where: { bimModelId, tenantId } });

      const nodeIds = new Map<string, string>();
      const pending = [...extracted.spatialNodes];
      while (pending.length) {
        const index = pending.findIndex(
          (node) => !node.parentKey || nodeIds.has(node.parentKey),
        );
        if (index < 0) throw new Error("IFC spatial hierarchy contains an unresolved cycle");
        const [node] = pending.splice(index, 1);
        if (!node) continue;
        const spatialType = Object.values(BimSpatialType).includes(
          node.spatialType as BimSpatialType,
        )
          ? (node.spatialType as BimSpatialType)
          : BimSpatialType.OTHER;
        const created = await tx.bimSpatialNode.create({
          data: {
            tenantId,
            bimModelId,
            sourceKey: node.sourceKey,
            spatialType,
            name: node.name,
            sortOrder: node.sortOrder ?? 0,
            ...(node.parentKey ? { parentId: nodeIds.get(node.parentKey) } : {}),
            ...(node.globalId ? { globalId: node.globalId } : {}),
          },
        });
        nodeIds.set(node.sourceKey, created.id);
      }

      for (const batch of this.batches(extracted.elements, 1000)) {
        await tx.bimElement.createMany({
          data: batch.map((element) => ({
            tenantId,
            bimModelId,
            globalId: element.globalId,
            ifcType: element.ifcType,
            ...(element.name ? { name: element.name } : {}),
            ...(element.tag ? { tag: element.tag } : {}),
            ...(element.predefinedType ? { predefinedType: element.predefinedType } : {}),
            ...(element.spatialKey && nodeIds.has(element.spatialKey)
              ? { spatialNodeId: nodeIds.get(element.spatialKey) }
              : {}),
          })),
          skipDuplicates: true,
        });
      }

      const storedElements = await tx.bimElement.findMany({
        where: { bimModelId, tenantId },
        select: { id: true, globalId: true },
      });
      const elementIds = new Map(storedElements.map((element) => [element.globalId, element.id]));
      const properties: Prisma.BimPropertyCreateManyInput[] = [];
      for (const element of extracted.elements) {
        const elementId = elementIds.get(element.globalId);
        if (!elementId) continue;
        for (const property of element.properties) {
          properties.push({
            tenantId,
            elementId,
            propertySet: property.propertySet,
            name: property.name,
            value: property.value ?? null,
            unit: property.unit ?? null,
          });
        }
      }
      for (const batch of this.batches(properties, 2000)) {
        await tx.bimProperty.createMany({ data: batch, skipDuplicates: true });
      }

      await tx.bimGeometryArtifact.upsert({
        where: { bimModelId },
        create: {
          tenantId,
          bimModelId,
          format: extracted.artifact.format,
          storageKey: artifactStorageKey,
          mimeType: extracted.artifact.mimeType,
          sizeBytes: BigInt(extracted.artifact.sizeBytes),
          checksumSha256: extracted.artifact.checksumSha256,
          storageEtag: artifactEtag,
          status: "UPLOADED",
        },
        update: {
          format: extracted.artifact.format,
          storageKey: artifactStorageKey,
          mimeType: extracted.artifact.mimeType,
          sizeBytes: BigInt(extracted.artifact.sizeBytes),
          checksumSha256: extracted.artifact.checksumSha256,
          storageEtag: artifactEtag,
          status: "UPLOADED",
        },
      });

      await tx.bimModel.update({
        where: { id: bimModelId },
        data: {
          name: extracted.modelName,
          ifcSchema: extracted.schema,
          status: "READY",
          elementCount: storedElements.length,
          spatialNodeCount: nodeIds.size,
          processedAt: new Date(),
          lastError: null,
        },
      });
      await tx.bimProcessingJob.update({
        where: { id: processingJobId },
        data: { status: "SUCCEEDED", finishedAt: new Date(), lastError: null },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          action: "BIM_PROCESSING_COMPLETED",
          entityType: "BimModel",
          entityId: bimModelId,
          metadata: {
            processingJobId,
            schema: extracted.schema,
            elements: storedElements.length,
            spatialNodes: nodeIds.size,
            geometryElements: extracted.artifact.geometryElements,
            geometryBytes: extracted.artifact.sizeBytes,
          },
        },
      });
    }, { maxWait: 10_000, timeout: 120_000 });
  }

  private batches<T>(items: T[], size: number) {
    const result: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      result.push(items.slice(index, index + size));
    }
    return result;
  }
}
