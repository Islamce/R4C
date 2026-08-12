import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  BuildingQueryDto,
  CreateBuildingDto,
  CreateFloorDto,
  CreatePhaseDto,
  CreateUnitDto,
  CreateUnitTypeDto,
  FloorQueryDto,
  ProjectQueryDto,
  UnitQueryDto,
  UpdateBuildingDto,
  UpdateFloorDto,
  UpdatePhaseDto,
  UpdateUnitDto,
  UpdateUnitTypeDto,
} from "./commercial.dto";
import { CommercialService } from "./commercial.service";

@Controller("commercial")
export class CommercialController {
  constructor(private readonly commercial: CommercialService) {}

  @Get("phases") @RequirePermissions("commercial:read")
  phases(@CurrentUser() user: AuthContext, @Query() query: ProjectQueryDto) {
    return this.commercial.phases(user.tenantId, query.projectId);
  }

  @Get("phases/:id") @RequirePermissions("commercial:read")
  phase(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.phase(user.tenantId, id);
  }

  @Post("phases") @RequirePermissions("commercial:manage")
  createPhase(@CurrentUser() user: AuthContext, @Body() body: CreatePhaseDto) {
    return this.commercial.createPhase(user, body);
  }

  @Patch("phases/:id") @RequirePermissions("commercial:manage")
  updatePhase(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdatePhaseDto) {
    return this.commercial.updatePhase(user, id, body);
  }

  @Get("buildings") @RequirePermissions("commercial:read")
  buildings(@CurrentUser() user: AuthContext, @Query() query: BuildingQueryDto) {
    return this.commercial.buildings(user.tenantId, query);
  }

  @Get("buildings/:id") @RequirePermissions("commercial:read")
  building(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.building(user.tenantId, id);
  }

  @Post("buildings") @RequirePermissions("commercial:manage")
  createBuilding(@CurrentUser() user: AuthContext, @Body() body: CreateBuildingDto) {
    return this.commercial.createBuilding(user, body);
  }

  @Patch("buildings/:id") @RequirePermissions("commercial:manage")
  updateBuilding(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdateBuildingDto) {
    return this.commercial.updateBuilding(user, id, body);
  }

  @Get("floors") @RequirePermissions("commercial:read")
  floors(@CurrentUser() user: AuthContext, @Query() query: FloorQueryDto) {
    return this.commercial.floors(user.tenantId, query.buildingId);
  }

  @Get("floors/:id") @RequirePermissions("commercial:read")
  floor(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.floor(user.tenantId, id);
  }

  @Post("floors") @RequirePermissions("commercial:manage")
  createFloor(@CurrentUser() user: AuthContext, @Body() body: CreateFloorDto) {
    return this.commercial.createFloor(user, body);
  }

  @Patch("floors/:id") @RequirePermissions("commercial:manage")
  updateFloor(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdateFloorDto) {
    return this.commercial.updateFloor(user, id, body);
  }

  @Get("unit-types") @RequirePermissions("commercial:read")
  unitTypes(@CurrentUser() user: AuthContext, @Query() query: ProjectQueryDto) {
    return this.commercial.unitTypes(user.tenantId, query.projectId);
  }

  @Get("unit-types/:id") @RequirePermissions("commercial:read")
  unitType(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.unitType(user.tenantId, id);
  }

  @Post("unit-types") @RequirePermissions("commercial:manage")
  createUnitType(@CurrentUser() user: AuthContext, @Body() body: CreateUnitTypeDto) {
    return this.commercial.createUnitType(user, body);
  }

  @Patch("unit-types/:id") @RequirePermissions("commercial:manage")
  updateUnitType(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdateUnitTypeDto) {
    return this.commercial.updateUnitType(user, id, body);
  }

  @Get("units") @RequirePermissions("commercial:read")
  units(@CurrentUser() user: AuthContext, @Query() query: UnitQueryDto) {
    return this.commercial.units(user.tenantId, query);
  }

  @Get("units/:id") @RequirePermissions("commercial:read")
  unit(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.unit(user.tenantId, id);
  }

  @Post("units") @RequirePermissions("commercial:manage")
  createUnit(@CurrentUser() user: AuthContext, @Body() body: CreateUnitDto) {
    return this.commercial.createUnit(user, body);
  }

  @Patch("units/:id") @RequirePermissions("commercial:manage")
  updateUnit(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdateUnitDto) {
    return this.commercial.updateUnit(user, id, body);
  }

  @Post("units/:id/release") @RequirePermissions("commercial:status")
  releaseUnit(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.transitionUnit(user, id, "release");
  }

  @Post("units/:id/block") @RequirePermissions("commercial:status")
  blockUnit(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.transitionUnit(user, id, "block");
  }
}
