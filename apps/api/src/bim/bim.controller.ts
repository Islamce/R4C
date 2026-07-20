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
import { LinkBimElementsDto } from "./bim.dto";
import { BimService } from "./bim.service";

@Controller()
export class BimController {
  constructor(private readonly bim: BimService) {}

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
