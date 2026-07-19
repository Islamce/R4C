import { Body, Controller, Param, Post } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { TransitionWorkItemDto } from "./workflow.dto";
import { WorkflowService } from "./workflow.service";

@Controller("work-items")
export class WorkflowController {
  constructor(private readonly workflow: WorkflowService) {}

  @Post(":workItemId/transitions")
  @RequirePermissions("workflow:transition")
  transition(
    @CurrentUser() user: AuthContext,
    @Param("workItemId") workItemId: string,
    @Body() body: TransitionWorkItemDto,
  ) {
    return this.workflow.transition(
      user.tenantId,
      user.userId,
      workItemId,
      body.toStatus,
      body.reason,
    );
  }
}
