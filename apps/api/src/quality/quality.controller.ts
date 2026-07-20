import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  CloseQualityFindingDto,
  CompleteQualityActionDto,
  CreateQualityActionDto,
  CreateQualityFindingDto,
  CreateQualityPlanDto,
  ReviewInspectionDto,
  ScheduleInspectionDto,
  SubmitInspectionDto,
  VerifyQualityActionDto,
} from "./quality.dto";
import { QualityService } from "./quality.service";

@Controller()
export class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Get("projects/:projectId/quality-plans")
  @RequirePermissions("quality:read")
  plans(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.quality.plans(user.tenantId, projectId);
  }

  @Get("projects/:projectId/quality-plans/active")
  @RequirePermissions("quality:read")
  activePlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.quality.activePlan(user.tenantId, projectId);
  }

  @Post("projects/:projectId/quality-plans")
  @RequirePermissions("quality:plan:create")
  createPlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateQualityPlanDto) {
    return this.quality.createPlan(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/quality-plans/:planId/publish")
  @RequirePermissions("quality:plan:publish")
  publishPlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("planId") planId: string) {
    return this.quality.publishPlan(user.tenantId, projectId, planId, user.userId);
  }

  @Get("projects/:projectId/quality-inspections")
  @RequirePermissions("quality:read")
  inspections(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.quality.inspections(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/quality-inspections")
  @RequirePermissions("quality:inspection:schedule")
  schedule(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: ScheduleInspectionDto) {
    return this.quality.scheduleInspection(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/quality-inspections/:inspectionId/submit")
  @RequirePermissions("quality:inspection:submit")
  submit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("inspectionId") inspectionId: string, @Body() body: SubmitInspectionDto) {
    return this.quality.submitInspection(user.tenantId, projectId, inspectionId, user.userId, body);
  }

  @Post("projects/:projectId/quality-inspections/:inspectionId/review")
  @RequirePermissions("quality:inspection:review")
  review(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("inspectionId") inspectionId: string, @Body() body: ReviewInspectionDto) {
    return this.quality.reviewInspection(user.tenantId, projectId, inspectionId, user.userId, body);
  }

  @Get("projects/:projectId/quality-findings")
  @RequirePermissions("quality:read")
  findings(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.quality.findings(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/quality-findings")
  @RequirePermissions("quality:finding:create")
  createFinding(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateQualityFindingDto) {
    return this.quality.createFinding(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/quality-findings/:findingId/actions")
  @RequirePermissions("quality:action:manage")
  createAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("findingId") findingId: string, @Body() body: CreateQualityActionDto) {
    return this.quality.createAction(user.tenantId, projectId, findingId, user.userId, body);
  }

  @Post("projects/:projectId/quality-actions/:actionId/complete")
  @RequirePermissions("quality:action:manage")
  completeAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("actionId") actionId: string, @Body() body: CompleteQualityActionDto) {
    return this.quality.completeAction(user.tenantId, projectId, actionId, user.userId, body);
  }

  @Post("projects/:projectId/quality-actions/:actionId/verify")
  @RequirePermissions("quality:verify")
  verifyAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("actionId") actionId: string, @Body() body: VerifyQualityActionDto) {
    return this.quality.verifyAction(user.tenantId, projectId, actionId, user.userId, body);
  }

  @Post("projects/:projectId/quality-findings/:findingId/close")
  @RequirePermissions("quality:verify")
  closeFinding(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("findingId") findingId: string, @Body() body: CloseQualityFindingDto) {
    return this.quality.closeFinding(user.tenantId, projectId, findingId, user.userId, body);
  }

  @Get("projects/:projectId/quality-dashboard")
  @RequirePermissions("quality:read")
  dashboard(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.quality.dashboard(user.tenantId, projectId);
  }

  @Get("bim-models/:bimModelId/quality-state")
  @RequirePermissions("bim:read")
  bimState(@CurrentUser() user: AuthContext, @Param("bimModelId") bimModelId: string) {
    return this.quality.bimState(user.tenantId, bimModelId);
  }
}
