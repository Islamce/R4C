import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReviewDecision, UploadStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import {
  AddCommentDto,
  CreateDocumentDto,
  DistributeVersionDto,
  RequestVersionUploadDto,
  ReviewVersionDto,
} from "./documents.dto";

const allowedExtensions = new Set([".pdf", ".dwg", ".ifc"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/acad",
  "application/x-acad",
  "application/ifc",
  "application/x-step",
  "text/plain",
]);

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
  ) {}

  private serializeVersion<T extends { sizeBytes: bigint }>(version: T) {
    return { ...version, sizeBytes: version.sizeBytes.toString() };
  }

  async list(tenantId: string, projectId: string) {
    await this.requireProject(tenantId, projectId);
    return this.prisma.document.findMany({
      where: { tenantId, projectId },
      include: { currentVersion: true, _count: { select: { versions: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(
    tenantId: string,
    projectId: string,
    actorId: string,
    command: CreateDocumentDto,
  ) {
    await this.requireProject(tenantId, projectId);
    const document = await this.prisma.document.create({
      data: {
        tenantId,
        projectId,
        code: command.code.trim().toUpperCase(),
        title: command.title.trim(),
        documentType: command.documentType.trim(),
        ...(command.discipline ? { discipline: command.discipline.trim() } : {}),
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "DOCUMENT_CREATED",
        entityType: "Document",
        entityId: document.id,
        metadata: { projectId, code: document.code },
      },
    });
    return document;
  }

  async requestUpload(
    tenantId: string,
    documentId: string,
    actorId: string,
    command: RequestVersionUploadDto,
  ) {
    const document = await this.requireDocument(tenantId, documentId);
    this.validateFile(command.fileName, command.mimeType);

    const aggregate = await this.prisma.documentVersion.aggregate({
      where: { tenantId, documentId },
      _max: { versionNumber: true },
    });
    const versionNumber = (aggregate._max.versionNumber ?? 0) + 1;
    const cleanName = command.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = [
      "tenants",
      tenantId,
      "projects",
      document.projectId,
      "documents",
      documentId,
      randomUUID(),
      cleanName,
    ].join("/");

    const version = await this.prisma.documentVersion.create({
      data: {
        tenantId,
        documentId,
        versionNumber,
        revision: command.revision.trim(),
        fileName: cleanName,
        mimeType: command.mimeType.toLowerCase(),
        sizeBytes: BigInt(command.sizeBytes),
        storageKey,
        checksumSha256: command.checksumSha256?.toLowerCase(),
        uploadedById: actorId,
      },
    });
    const uploadUrl = await this.storage.createUploadUrl(storageKey, version.mimeType);

    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "DOCUMENT_UPLOAD_REQUESTED",
        entityType: "DocumentVersion",
        entityId: version.id,
        metadata: { documentId, versionNumber },
      },
    });

    return {
      version: this.serializeVersion(version),
      upload: { method: "PUT", url: uploadUrl, expiresInSeconds: 900 },
    };
  }

  async confirmUpload(tenantId: string, versionId: string, actorId: string) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.uploadStatus !== UploadStatus.PENDING) {
      throw new ConflictException("Only pending uploads can be confirmed");
    }

    const object = await this.storage.head(version.storageKey);
    if (object.sizeBytes !== Number(version.sizeBytes)) {
      throw new BadRequestException("Uploaded object size does not match the declared size");
    }
    if (
      version.checksumSha256 &&
      object.checksumSha256 &&
      version.checksumSha256 !== object.checksumSha256.toLowerCase()
    ) {
      throw new BadRequestException("Uploaded object checksum does not match");
    }

    const update = await this.prisma.documentVersion.updateMany({
      where: { id: versionId, tenantId, uploadStatus: UploadStatus.PENDING },
      data: {
        uploadStatus: UploadStatus.UPLOADED,
        uploadedAt: new Date(),
        storageChecksum: object.checksumSha256 ?? object.etag,
      },
    });
    if (update.count !== 1) {
      throw new ConflictException("Upload state changed concurrently");
    }

    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "DOCUMENT_UPLOAD_CONFIRMED",
        entityType: "DocumentVersion",
        entityId: versionId,
      },
    });
    return this.serializeVersion(
      await this.prisma.documentVersion.findUniqueOrThrow({ where: { id: versionId } }),
    );
  }

  async versions(tenantId: string, documentId: string) {
    await this.requireDocument(tenantId, documentId);
    const versions = await this.prisma.documentVersion.findMany({
      where: { tenantId, documentId },
      orderBy: { versionNumber: "desc" },
      include: {
        uploadedBy: { select: { id: true, displayName: true } },
        _count: { select: { comments: true, reviews: true, distributions: true } },
      },
    });
    return versions.map((version) => this.serializeVersion(version));
  }

  async submitForReview(tenantId: string, versionId: string, actorId: string) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.uploadStatus !== UploadStatus.UPLOADED) {
      throw new ConflictException("Upload must be confirmed before review");
    }

    await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id: version.documentId },
        data: { status: "IN_REVIEW" },
      }),
      this.prisma.notificationOutbox.create({
        data: {
          tenantId,
          channel: "IN_APP",
          eventType: "DOCUMENT_REVIEW_REQUESTED",
          payload: { documentId: version.documentId, versionId },
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "DOCUMENT_SUBMITTED_FOR_REVIEW",
          entityType: "DocumentVersion",
          entityId: versionId,
        },
      }),
    ]);
    return { documentId: version.documentId, versionId, status: "IN_REVIEW" };
  }

  async review(
    tenantId: string,
    versionId: string,
    actorId: string,
    command: ReviewVersionDto,
  ) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.document.status !== "IN_REVIEW") {
      throw new ConflictException("Document is not under review");
    }
    const decision = command.decision as ReviewDecision;

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.documentReview.upsert({
        where: { versionId_reviewerId: { versionId, reviewerId: actorId } },
        create: {
          tenantId,
          versionId,
          reviewerId: actorId,
          decision,
          ...(command.comment ? { comment: command.comment } : {}),
        },
        update: {
          decision,
          decidedAt: new Date(),
          ...(command.comment ? { comment: command.comment } : {}),
        },
      });

      await tx.documentVersion.update({
        where: { id: versionId },
        data: { reviewDecision: decision },
      });
      await tx.document.update({
        where: { id: version.documentId },
        data:
          decision === ReviewDecision.APPROVED
            ? { status: "APPROVED", currentVersionId: versionId }
            : { status: "DRAFT" },
      });
      await tx.notificationOutbox.create({
        data: {
          tenantId,
          channel: "IN_APP",
          eventType: `DOCUMENT_${decision}`,
          recipientUserId: version.uploadedById,
          payload: { documentId: version.documentId, versionId, decision },
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: `DOCUMENT_${decision}`,
          entityType: "DocumentVersion",
          entityId: versionId,
          metadata: command.comment ? { comment: command.comment } : undefined,
        },
      });
      return review;
    });
  }

  async comment(
    tenantId: string,
    versionId: string,
    actorId: string,
    command: AddCommentDto,
  ) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.uploadStatus !== UploadStatus.UPLOADED) {
      throw new ConflictException("Comments require a completed upload");
    }
    const comment = await this.prisma.documentComment.create({
      data: { tenantId, versionId, authorId: actorId, body: command.body.trim() },
    });
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId,
        action: "DOCUMENT_COMMENT_ADDED",
        entityType: "DocumentVersion",
        entityId: versionId,
      },
    });
    return comment;
  }

  async distribute(
    tenantId: string,
    versionId: string,
    actorId: string,
    command: DistributeVersionDto,
  ) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.reviewDecision !== ReviewDecision.APPROVED) {
      throw new ConflictException("Only approved document versions may be distributed");
    }

    return this.prisma.$transaction(async (tx) => {
      const distribution = await tx.documentDistribution.create({
        data: {
          tenantId,
          versionId,
          distributedById: actorId,
          recipientType: command.recipientType.trim(),
          recipientName: command.recipientName.trim(),
          purpose: command.purpose.trim(),
          ...(command.recipientId ? { recipientId: command.recipientId.trim() } : {}),
        },
      });
      await tx.notificationOutbox.create({
        data: {
          tenantId,
          channel: "EMAIL",
          eventType: "DOCUMENT_DISTRIBUTED",
          payload: {
            documentId: version.documentId,
            versionId,
            distributionId: distribution.id,
            recipientName: distribution.recipientName,
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: "DOCUMENT_DISTRIBUTED",
          entityType: "DocumentVersion",
          entityId: versionId,
          metadata: { distributionId: distribution.id },
        },
      });
      return distribution;
    });
  }

  async downloadUrl(tenantId: string, versionId: string) {
    const version = await this.requireVersion(tenantId, versionId);
    if (version.uploadStatus !== UploadStatus.UPLOADED) {
      throw new ConflictException("File is not available");
    }
    return {
      url: await this.storage.createDownloadUrl(version.storageKey, version.fileName),
      expiresInSeconds: 300,
    };
  }

  private validateFile(fileName: string, mimeType: string) {
    if (!allowedExtensions.has(extname(fileName).toLowerCase())) {
      throw new BadRequestException("Only PDF, DWG, and IFC files are supported");
    }
    if (!allowedMimeTypes.has(mimeType.toLowerCase())) {
      throw new BadRequestException("File MIME type is not allowed");
    }
  }

  private async requireProject(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private async requireDocument(tenantId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!document) throw new NotFoundException("Document not found");
    return document;
  }

  private async requireVersion(tenantId: string, versionId: string) {
    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, tenantId },
      include: { document: true },
    });
    if (!version) throw new NotFoundException("Document version not found");
    return version;
  }
}
