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
import { CostService } from "./cost.service";
import { CreateBudgetDto, CreateCostEntryDto } from "./cost.dto";

@Controller()
export class CostController {
  constructor(private readonly costs: CostService) {}

  @Get("projects/:projectId/budgets")
  @RequirePermissions("cost:read")
  budgets(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.costs.budgets(user.tenantId, projectId);
  }

  @Get("projects/:projectId/budgets/active")
  @RequirePermissions("cost:read")
  activeBudget(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.costs.activeBudget(user.tenantId, projectId);
  }

  @Post("projects/:projectId/budgets")
  @RequirePermissions("cost:budget:create")
  createBudget(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateBudgetDto,
  ) {
    return this.costs.createBudget(user.tenantId, projectId, user.userId, body);
  }

  @Post("projects/:projectId/budgets/:budgetId/publish")
  @RequirePermissions("cost:budget:publish")
  publishBudget(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Param("budgetId") budgetId: string,
  ) {
    return this.costs.publishBudget(
      user.tenantId,
      projectId,
      budgetId,
      user.userId,
    );
  }

  @Get("projects/:projectId/cost-ledger")
  @RequirePermissions("cost:read")
  ledger(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.costs.ledger(user.tenantId, projectId, page, limit);
  }

  @Post("projects/:projectId/cost-ledger")
  @RequirePermissions("cost:post")
  postEntry(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateCostEntryDto,
  ) {
    return this.costs.postEntry(user.tenantId, projectId, user.userId, body);
  }

  @Get("projects/:projectId/cost-control")
  @RequirePermissions("cost:read")
  control(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Query("date") date?: string,
  ) {
    return this.costs.control(user.tenantId, projectId, date);
  }

  @Get("bim-models/:bimModelId/5d-state")
  @RequirePermissions("bim:read")
  fiveDState(
    @CurrentUser() user: AuthContext,
    @Param("bimModelId") bimModelId: string,
    @Query("date") date?: string,
  ) {
    return this.costs.fiveDState(user.tenantId, bimModelId, date);
  }
}
