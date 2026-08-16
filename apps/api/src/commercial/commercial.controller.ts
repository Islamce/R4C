import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  AdvanceLeadDto,
  AssignLeadDto,
  AttachCommercialMediaDto,
  BuildingQueryDto,
  CommercialLocaleQueryDto,
  CreateBuildingDto,
  CreateCustomerDto,
  CreateTranslationDto,
  CreateUnitHoldDto,
  ConfirmReservationDto,
  CreateLeadDto,
  CreateSalesActivityDto,
  CreatePaymentPlanDto,
  CreateUnitPriceRevisionDto,
  CreateFloorDto,
  CreatePhaseDto,
  CreateUnitDto,
  CreateUnitTypeDto,
  FloorQueryDto,
  LeadQueryDto,
  ProjectQueryDto,
  TranslationQueryDto,
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
  unit(@CurrentUser() user: AuthContext, @Param("id") id: string, @Query() query: CommercialLocaleQueryDto) {
    return this.commercial.unit(user.tenantId, id, query.locale);
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

  @Get("units/:id/prices") @RequirePermissions("commercial:price:view-published")
  publishedPrices(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.publishedPrices(user.tenantId, id);
  }

  @Get("units/:id/prices/drafts") @RequirePermissions("commercial:price:view-draft")
  draftPrices(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.draftPrices(user.tenantId, id);
  }

  @Post("units/:id/prices") @RequirePermissions("commercial:price:create-draft")
  createPrice(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: CreateUnitPriceRevisionDto) {
    return this.commercial.createPriceDraft(user, id, body);
  }

  @Post("unit-prices/:id/publish") @RequirePermissions("commercial:price:publish")
  publishPrice(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.publishPrice(user, id);
  }

  @Post("unit-prices/:id/withdraw") @RequirePermissions("commercial:price:create-draft")
  withdrawPrice(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.withdrawPrice(user, id);
  }

  @Get("projects/:projectId/payment-plans") @RequirePermissions("commercial:payment-plan:view")
  paymentPlans(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.commercial.paymentPlans(user.tenantId, projectId);
  }

  @Post("projects/:projectId/payment-plans") @RequirePermissions("commercial:payment-plan:manage")
  createPaymentPlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreatePaymentPlanDto) {
    return this.commercial.createPaymentPlan(user, projectId, body);
  }

  @Put("payment-plans/:id") @RequirePermissions("commercial:payment-plan:manage")
  replacePaymentPlan(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: CreatePaymentPlanDto) {
    return this.commercial.replacePaymentPlan(user, id, body);
  }

  @Post("projects/:id/media") @RequirePermissions("commercial:media:manage")
  attachProjectMedia(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: AttachCommercialMediaDto) {
    return this.commercial.attachProjectMedia(user, id, body);
  }

  @Post("buildings/:id/media") @RequirePermissions("commercial:media:manage")
  attachBuildingMedia(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: AttachCommercialMediaDto) {
    return this.commercial.attachBuildingMedia(user, id, body);
  }

  @Post("units/:id/media") @RequirePermissions("commercial:media:manage")
  attachUnitMedia(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: AttachCommercialMediaDto) {
    return this.commercial.attachUnitMedia(user, id, body);
  }

  @Delete("project-media/:id") @RequirePermissions("commercial:media:manage")
  removeProjectMedia(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.removeProjectMedia(user, id);
  }

  @Delete("building-media/:id") @RequirePermissions("commercial:media:manage")
  removeBuildingMedia(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.removeBuildingMedia(user, id);
  }

  @Delete("unit-media/:id") @RequirePermissions("commercial:media:manage")
  removeUnitMedia(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.removeUnitMedia(user, id);
  }

  @Get("translations") @RequirePermissions("commercial:media:manage")
  translations(@CurrentUser() user: AuthContext, @Query() query: TranslationQueryDto) {
    return this.commercial.translations(user.tenantId, query);
  }

  @Post("translations") @RequirePermissions("commercial:media:manage")
  createTranslation(@CurrentUser() user: AuthContext, @Body() body: CreateTranslationDto) {
    return this.commercial.createTranslation(user, body);
  }

  @Post("holds") @RequirePermissions("commercial:hold:create")
  createHold(@CurrentUser() user: AuthContext, @Body() body: CreateUnitHoldDto) {
    return this.commercial.createHold(user, body);
  }

  @Post("holds/:id/cancel") @RequirePermissions("commercial:hold:release")
  cancelHold(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.cancelHold(user, id);
  }

  @Post("holds/:id/confirm") @RequirePermissions("commercial:reservation:confirm")
  confirmReservation(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: ConfirmReservationDto) {
    return this.commercial.confirmReservation(user, id, body);
  }

  @Post("customers") @RequirePermissions("commercial:customer:create")
  createCustomer(@CurrentUser() user: AuthContext, @Body() body: CreateCustomerDto) {
    return this.commercial.createCustomer(user, body);
  }

  @Get("customers/:id") @RequirePermissions("commercial:customer:view")
  customer(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.customer(user.tenantId, id);
  }

  @Get("leads") @RequirePermissions("commercial:lead:view-own")
  ownLeads(@CurrentUser() user: AuthContext, @Query() query: LeadQueryDto) {
    return this.commercial.ownLeads(user, query);
  }

  @Get("leads/all") @RequirePermissions("commercial:lead:view-all")
  allLeads(@CurrentUser() user: AuthContext, @Query() query: LeadQueryDto) {
    return this.commercial.allLeads(user.tenantId, query);
  }

  @Get("leads/all/:id") @RequirePermissions("commercial:lead:view-all")
  lead(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.lead(user.tenantId, id);
  }

  @Get("leads/:id") @RequirePermissions("commercial:lead:view-own")
  ownLead(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.ownLead(user, id);
  }

  @Post("leads") @RequirePermissions("commercial:lead:create")
  createLead(@CurrentUser() user: AuthContext, @Body() body: CreateLeadDto) {
    return this.commercial.createLead(user, body);
  }

  @Patch("leads/:id/status") @RequirePermissions("commercial:lead:qualify")
  advanceLead(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: AdvanceLeadDto) {
    return this.commercial.advanceLead(user, id, body.status);
  }

  @Post("leads/:id/disqualify") @RequirePermissions("commercial:lead:disqualify")
  disqualifyLead(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.disqualifyLead(user, id);
  }

  @Patch("leads/:id/assignee") @RequirePermissions("commercial:lead:reassign")
  reassignLead(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: AssignLeadDto) {
    return this.commercial.reassignLead(user, id, body.assignedToId);
  }

  @Get("assignees") @RequirePermissions("commercial:lead:reassign")
  assignees(@CurrentUser() user: AuthContext) {
    return this.commercial.assignees(user.tenantId);
  }

  @Get("leads/:id/activities") @RequirePermissions("commercial:activity:view")
  activities(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.commercial.activities(user, id);
  }

  @Post("leads/:id/activities") @RequirePermissions("commercial:activity:log")
  logActivity(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: CreateSalesActivityDto) {
    return this.commercial.logActivity(user, id, body);
  }
}
