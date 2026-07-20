import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  CreateInventoryLocationDto,
  CreateMaterialDto,
  CreateProcurementOrderDto,
  CreateTakeoffDto,
  IssueMaterialDto,
  ReceiveMaterialDto,
} from "./materials.dto";
import { MaterialsService } from "./materials.service";

@Controller()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get("materials")
  @RequirePermissions("materials:read")
  materials(@CurrentUser() user: AuthContext, @Query("q") query?: string) {
    return this.materialsService.materials(user.tenantId, query);
  }

  @Post("materials")
  @RequirePermissions("materials:master")
  createMaterial(
    @CurrentUser() user: AuthContext,
    @Body() body: CreateMaterialDto,
  ) {
    return this.materialsService.createMaterial(user.tenantId, user.userId, body);
  }

  @Get("projects/:projectId/material-takeoffs")
  @RequirePermissions("materials:read")
  takeoffs(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.takeoffs(user.tenantId, projectId);
  }

  @Get("projects/:projectId/material-takeoffs/active")
  @RequirePermissions("materials:read")
  activeTakeoff(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.activeTakeoff(user.tenantId, projectId);
  }

  @Post("projects/:projectId/material-takeoffs")
  @RequirePermissions("materials:takeoff:create")
  createTakeoff(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateTakeoffDto,
  ) {
    return this.materialsService.createTakeoff(
      user.tenantId,
      projectId,
      user.userId,
      body,
    );
  }

  @Post("projects/:projectId/material-takeoffs/:takeoffId/publish")
  @RequirePermissions("materials:takeoff:publish")
  publishTakeoff(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Param("takeoffId") takeoffId: string,
  ) {
    return this.materialsService.publishTakeoff(
      user.tenantId,
      projectId,
      takeoffId,
      user.userId,
    );
  }

  @Get("projects/:projectId/inventory-locations")
  @RequirePermissions("materials:read")
  locations(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.locations(user.tenantId, projectId);
  }

  @Post("projects/:projectId/inventory-locations")
  @RequirePermissions("inventory:manage")
  createLocation(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateInventoryLocationDto,
  ) {
    return this.materialsService.createLocation(
      user.tenantId,
      projectId,
      user.userId,
      body,
    );
  }

  @Get("projects/:projectId/procurement-orders")
  @RequirePermissions("procurement:read")
  procurementOrders(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.procurementOrders(user.tenantId, projectId);
  }

  @Post("projects/:projectId/procurement-orders")
  @RequirePermissions("procurement:create")
  createProcurementOrder(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateProcurementOrderDto,
  ) {
    return this.materialsService.createProcurementOrder(
      user.tenantId,
      projectId,
      user.userId,
      body,
    );
  }

  @Post(
    "projects/:projectId/procurement-orders/:orderId/lines/:lineId/receipts",
  )
  @RequirePermissions("inventory:receive")
  receive(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Param("orderId") orderId: string,
    @Param("lineId") lineId: string,
    @Body() body: ReceiveMaterialDto,
  ) {
    return this.materialsService.receive(
      user.tenantId,
      projectId,
      orderId,
      lineId,
      user.userId,
      body,
    );
  }

  @Post("projects/:projectId/material-issues")
  @RequirePermissions("inventory:issue")
  issue(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: IssueMaterialDto,
  ) {
    return this.materialsService.issue(
      user.tenantId,
      projectId,
      user.userId,
      body,
    );
  }

  @Get("projects/:projectId/inventory-balances")
  @RequirePermissions("materials:read")
  balances(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.balances(user.tenantId, projectId);
  }

  @Get("projects/:projectId/material-readiness")
  @RequirePermissions("materials:read")
  readiness(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.materialsService.readiness(user.tenantId, projectId);
  }

  @Get("bim-models/:bimModelId/material-state")
  @RequirePermissions("bim:read")
  materialState(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
  ) {
    return this.materialsService.materialState(user.tenantId, bimModelId);
  }
}
