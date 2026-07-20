import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  CreateCommissioningPlanDto,
  CreateHandoverPackageDto,
  ProvideHandoverRequirementDto,
  ReviewCommissioningTestDto,
  ReviewHandoverPackageDto,
  ScheduleCommissioningTestDto,
  SubmitCommissioningTestDto,
} from "./turnover.dto";
import { TurnoverService } from "./turnover.service";

@Controller()
export class TurnoverController {
  constructor(private readonly turnover: TurnoverService) {}

  @Get("projects/:projectId/commissioning-plans")
  @RequirePermissions("turnover:read")
  plans(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.turnover.plans(user.tenantId, projectId);
  }

  @Get("projects/:projectId/commissioning-plans/active")
  @RequirePermissions("turnover:read")
  activePlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.turnover.activePlan(user.tenantId, projectId);
  }

  @Post("projects/:projectId/commissioning-plans")
  @RequirePermissions("commissioning:plan:create")
  createPlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateCommissioningPlanDto) {
    return this.turnover.createPlan(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/commissioning-plans/:planId/publish")
  @RequirePermissions("commissioning:plan:publish")
  publishPlan(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("planId") planId: string) {
    return this.turnover.publishPlan(user.tenantId, projectId, planId, user.userId);
  }

  @Get("projects/:projectId/commissioning-tests")
  @RequirePermissions("turnover:read")
  tests(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.turnover.tests(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/commissioning-tests")
  @RequirePermissions("commissioning:test:schedule")
  scheduleTest(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: ScheduleCommissioningTestDto) {
    return this.turnover.scheduleTest(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/commissioning-tests/:testId/submit")
  @RequirePermissions("commissioning:test:submit")
  submitTest(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("testId") testId: string, @Body() body: SubmitCommissioningTestDto) {
    return this.turnover.submitTest(user.tenantId, projectId, testId, user.userId, body);
  }

  @Post("projects/:projectId/commissioning-tests/:testId/review")
  @RequirePermissions("commissioning:test:review")
  reviewTest(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("testId") testId: string, @Body() body: ReviewCommissioningTestDto) {
    return this.turnover.reviewTest(user.tenantId, projectId, testId, user.userId, body);
  }

  @Get("projects/:projectId/handover-packages")
  @RequirePermissions("turnover:read")
  packages(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.turnover.packages(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/handover-packages")
  @RequirePermissions("handover:create")
  createPackage(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateHandoverPackageDto) {
    return this.turnover.createPackage(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/handover-packages/:packageId/requirements/:requirementId/provide")
  @RequirePermissions("handover:fulfill")
  provideRequirement(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("packageId") packageId: string, @Param("requirementId") requirementId: string, @Body() body: ProvideHandoverRequirementDto) {
    return this.turnover.provideRequirement(user.tenantId, projectId, packageId, requirementId, user.userId, body);
  }

  @Post("projects/:projectId/handover-packages/:packageId/submit")
  @RequirePermissions("handover:submit")
  submitPackage(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("packageId") packageId: string) {
    return this.turnover.submitPackage(user.tenantId, projectId, packageId, user.userId);
  }

  @Post("projects/:projectId/handover-packages/:packageId/review")
  @RequirePermissions("handover:review")
  reviewPackage(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("packageId") packageId: string, @Body() body: ReviewHandoverPackageDto) {
    return this.turnover.reviewPackage(user.tenantId, projectId, packageId, user.userId, body);
  }

  @Get("projects/:projectId/turnover-dashboard")
  @RequirePermissions("turnover:read")
  dashboard(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.turnover.dashboard(user.tenantId, projectId);
  }

  @Get("bim-models/:bimModelId/turnover-state")
  @RequirePermissions("bim:read")
  bimState(@CurrentUser() user: AuthContext, @Param("bimModelId") bimModelId: string) {
    return this.turnover.bimState(user.tenantId, bimModelId);
  }
}
