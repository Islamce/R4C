import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { UploadRateLimit } from "../common/rate-limit";
import {
  AddCommentDto,
  CreateDocumentDto,
  DistributeVersionDto,
  RequestVersionUploadDto,
  ReviewVersionDto,
} from "./documents.dto";
import { DocumentsService } from "./documents.service";

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get("projects/:projectId/documents")
  @RequirePermissions("document:read")
  list(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.documents.list(user.tenantId, projectId);
  }

  @Post("projects/:projectId/documents")
  @RequirePermissions("document:create")
  create(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateDocumentDto,
  ) {
    return this.documents.create(user.tenantId, projectId, user.userId, body);
  }

  @Get("documents/:documentId/versions")
  @RequirePermissions("document:read")
  versions(@CurrentUser() user: AuthContext, @Param("documentId") documentId: string) {
    return this.documents.versions(user.tenantId, documentId);
  }

  @UploadRateLimit()
  @Post("documents/:documentId/versions/upload-request")
  @RequirePermissions("document:upload")
  requestUpload(
    @CurrentUser() user: AuthContext,
    @Param("documentId") documentId: string,
    @Body() body: RequestVersionUploadDto,
  ) {
    return this.documents.requestUpload(user.tenantId, documentId, user.userId, body);
  }

  @UploadRateLimit()
  @Post("document-versions/:versionId/confirm-upload")
  @RequirePermissions("document:upload")
  confirmUpload(
    @CurrentUser() user: AuthContext,
    @Param("versionId") versionId: string,
  ) {
    return this.documents.confirmUpload(user.tenantId, versionId, user.userId);
  }

  @Post("document-versions/:versionId/submit")
  @RequirePermissions("document:submit")
  submit(@CurrentUser() user: AuthContext, @Param("versionId") versionId: string) {
    return this.documents.submitForReview(user.tenantId, versionId, user.userId);
  }

  @Post("document-versions/:versionId/reviews")
  @RequirePermissions("document:review")
  review(
    @CurrentUser() user: AuthContext,
    @Param("versionId") versionId: string,
    @Body() body: ReviewVersionDto,
  ) {
    return this.documents.review(user.tenantId, versionId, user.userId, body);
  }

  @Post("document-versions/:versionId/comments")
  @RequirePermissions("document:comment")
  comment(
    @CurrentUser() user: AuthContext,
    @Param("versionId") versionId: string,
    @Body() body: AddCommentDto,
  ) {
    return this.documents.comment(user.tenantId, versionId, user.userId, body);
  }

  @Post("document-versions/:versionId/distributions")
  @RequirePermissions("document:distribute")
  distribute(
    @CurrentUser() user: AuthContext,
    @Param("versionId") versionId: string,
    @Body() body: DistributeVersionDto,
  ) {
    return this.documents.distribute(user.tenantId, versionId, user.userId, body);
  }

  @Get("document-versions/:versionId/download-url")
  @RequirePermissions("document:download")
  downloadUrl(
    @CurrentUser() user: AuthContext,
    @Param("versionId") versionId: string,
  ) {
    return this.documents.downloadUrl(user.tenantId, versionId);
  }
}
