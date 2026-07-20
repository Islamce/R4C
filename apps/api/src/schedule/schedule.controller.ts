import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { CreateScheduleDto } from "./schedule.dto";
import { ScheduleService } from "./schedule.service";

@Controller()
export class ScheduleController {
  constructor(private readonly schedules: ScheduleService) {}

  @Get("projects/:projectId/schedules")
  @RequirePermissions("project:read")
  list(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.schedules.list(user.tenantId, projectId);
  }

  @Get("projects/:projectId/schedules/active")
  @RequirePermissions("project:read")
  active(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.schedules.active(user.tenantId, projectId);
  }

  @Post("projects/:projectId/schedules")
  @RequirePermissions("schedule:create")
  create(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateScheduleDto,
  ) {
    return this.schedules.create(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/schedules/:scheduleId/publish")
  @RequirePermissions("schedule:publish")
  publish(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Param("scheduleId") scheduleId: string,
  ) {
    return this.schedules.publish(
      user.tenantId,
      projectId,
      scheduleId,
      user.userId,
    );
  }

  @Get("bim-models/:bimModelId/4d-state")
  @RequirePermissions("bim:read")
  fourDState(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
    @Query("date") date?: string,
  ) {
    return this.schedules.fourDState(user.tenantId, bimModelId, date);
  }
}
