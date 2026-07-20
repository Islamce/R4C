import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { ProgressService } from "./progress.service";
import { ReviewProgressDto, SubmitProgressDto } from "./progress.dto";

@Controller()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get("wbs/:wbsNodeId/progress")
  @RequirePermissions("progress:read")
  history(@CurrentUser() user: AuthContext, @Param("wbsNodeId") wbsNodeId: string) {
    return this.progress.history(user.tenantId, wbsNodeId);
  }

  @Post("wbs/:wbsNodeId/progress")
  @RequirePermissions("progress:submit")
  submit(
    @CurrentUser() user: AuthContext,
    @Param("wbsNodeId") wbsNodeId: string,
    @Body() body: SubmitProgressDto,
  ) {
    return this.progress.submit(user.tenantId, user.userId, wbsNodeId, body);
  }

  @Post("progress/:progressUpdateId/review")
  @RequirePermissions("progress:review")
  review(
    @CurrentUser() user: AuthContext,
    @Param("progressUpdateId") progressUpdateId: string,
    @Body() body: ReviewProgressDto,
  ) {
    return this.progress.review(user.tenantId, user.userId, progressUpdateId, body);
  }
}
