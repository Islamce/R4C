import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  CloseSafetyEventDto,
  CompleteSafetyActionDto,
  CreateSafetyActionDto,
  CreateSafetyEventDto,
  CreateSafetyPermitDto,
  EvidenceIdsDto,
  InvestigateSafetyEventDto,
  ReviewSafetyPermitDto,
  SafetyPermitNoteDto,
  VerifySafetyActionDto,
} from "./hse.dto";
import { HseService } from "./hse.service";

@Controller()
export class HseController {
  constructor(private readonly hse: HseService) {}

  @Get("projects/:projectId/safety-permits")
  @RequirePermissions("hse:read")
  permits(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.hse.permits(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/safety-permits")
  @RequirePermissions("hse:permit:create")
  createPermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateSafetyPermitDto) {
    return this.hse.createPermit(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/safety-permits/:permitId/submit")
  @RequirePermissions("hse:permit:submit")
  submitPermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("permitId") permitId: string, @Body() body: EvidenceIdsDto) {
    return this.hse.submitPermit(user.tenantId, projectId, permitId, user.userId, body);
  }

  @Post("projects/:projectId/safety-permits/:permitId/review")
  @RequirePermissions("hse:permit:review")
  reviewPermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("permitId") permitId: string, @Body() body: ReviewSafetyPermitDto) {
    return this.hse.reviewPermit(user.tenantId, projectId, permitId, user.userId, body);
  }

  @Post("projects/:projectId/safety-permits/:permitId/activate")
  @RequirePermissions("hse:permit:activate")
  activatePermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("permitId") permitId: string) {
    return this.hse.activatePermit(user.tenantId, projectId, permitId, user.userId);
  }

  @Post("projects/:projectId/safety-permits/:permitId/suspend")
  @RequirePermissions("hse:permit:activate")
  suspendPermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("permitId") permitId: string, @Body() body: SafetyPermitNoteDto) {
    return this.hse.suspendPermit(user.tenantId, projectId, permitId, user.userId, body);
  }

  @Post("projects/:projectId/safety-permits/:permitId/close")
  @RequirePermissions("hse:permit:close")
  closePermit(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("permitId") permitId: string, @Body() body: SafetyPermitNoteDto) {
    return this.hse.closePermit(user.tenantId, projectId, permitId, user.userId, body);
  }

  @Get("projects/:projectId/safety-events")
  @RequirePermissions("hse:read")
  events(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Query("status") status?: string) {
    return this.hse.events(user.tenantId, projectId, status);
  }

  @Post("projects/:projectId/safety-events")
  @RequirePermissions("hse:event:report")
  reportEvent(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Body() body: CreateSafetyEventDto) {
    return this.hse.reportEvent(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/safety-events/:eventId/investigate")
  @RequirePermissions("hse:investigate")
  investigate(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("eventId") eventId: string, @Body() body: InvestigateSafetyEventDto) {
    return this.hse.investigateEvent(user.tenantId, projectId, eventId, user.userId, body);
  }

  @Post("projects/:projectId/safety-events/:eventId/actions")
  @RequirePermissions("hse:action:manage")
  createAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("eventId") eventId: string, @Body() body: CreateSafetyActionDto) {
    return this.hse.createAction(user.tenantId, projectId, eventId, user.userId, body);
  }

  @Post("projects/:projectId/safety-actions/:actionId/complete")
  @RequirePermissions("hse:action:manage")
  completeAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("actionId") actionId: string, @Body() body: CompleteSafetyActionDto) {
    return this.hse.completeAction(user.tenantId, projectId, actionId, user.userId, body);
  }

  @Post("projects/:projectId/safety-actions/:actionId/verify")
  @RequirePermissions("hse:verify")
  verifyAction(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("actionId") actionId: string, @Body() body: VerifySafetyActionDto) {
    return this.hse.verifyAction(user.tenantId, projectId, actionId, user.userId, body);
  }

  @Post("projects/:projectId/safety-events/:eventId/close")
  @RequirePermissions("hse:verify")
  closeEvent(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string, @Param("eventId") eventId: string, @Body() body: CloseSafetyEventDto) {
    return this.hse.closeEvent(user.tenantId, projectId, eventId, user.userId, body);
  }

  @Get("projects/:projectId/hse-dashboard")
  @RequirePermissions("hse:read")
  dashboard(@CurrentUser() user: AuthContext, @Param("projectId") projectId: string) {
    return this.hse.dashboard(user.tenantId, projectId);
  }

  @Get("bim-models/:bimModelId/safety-state")
  @RequirePermissions("bim:read")
  bimState(@CurrentUser() user: AuthContext, @Param("bimModelId") bimModelId: string) {
    return this.hse.bimState(user.tenantId, bimModelId);
  }
}
