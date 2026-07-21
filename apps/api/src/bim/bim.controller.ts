import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { SearchExportRateLimit, UploadRateLimit } from "../common/rate-limit";
import { LinkBimElementsDto } from "./bim.dto";
import { BimService } from "./bim.service";

@Controller()
export class BimController {
  constructor(private readonly bim: BimService) {}

  @UploadRateLimit()
  @Post("document-versions/:versionId/bim/process")
  @RequirePermissions("bim:process")
  process(@CurrentUser() user: AuthContext, @Param("versionId") versionId: string) {
    return this.bim.requestProcessing(user.tenantId, user.userId, versionId);
  }

  @Get("bim-models/:bimModelId")
  @RequirePermissions("bim:read")
  status(@CurrentUser() user: AuthContext, @Param("bimModelId") bimModelId: string) {
    return this.bim.status(user.tenantId, bimModelId);
  }

  @Get("bim-models/:bimModelId/spatial-tree")
  @RequirePermissions("bim:read")
  spatialTree(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
  ) {
    return this.bim.spatialTree(user.tenantId, bimModelId);
  }

  @SearchExportRateLimit()
  @Get("bim-models/:bimModelId/elements")
  @RequirePermissions("bim:read")
  elements(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("ifcType") ifcType?: string,
  ) {
    return this.bim.elements(user.tenantId, bimModelId, page, limit, ifcType);
  }

  @Get("bim-models/:bimModelId/viewer-manifest")
  @RequirePermissions("bim:read")
  viewerManifest(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
  ) {
    return this.bim.viewerManifest(user.tenantId, bimModelId);
  }

  @Get("bim-models/:bimModelId/visual-state")
  @RequirePermissions("bim:read")
  visualState(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
  ) {
    return this.bim.visualState(user.tenantId, bimModelId);
  }

  @Get("bim-models/:bimModelId/elements/global/:globalId")
  @RequirePermissions("bim:read")
  elementByGlobalId(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
    @Param("globalId") globalId: string,
  ) {
    return this.bim.elementByGlobalId(user.tenantId, bimModelId, globalId);
  }

  @Post("bim-models/:bimModelId/wbs-links")
  @RequirePermissions("bim:link")
  link(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
    @Body() body: LinkBimElementsDto,
  ) {
    return this.bim.linkElements(user.tenantId, user.userId, bimModelId, body);
  }
}
