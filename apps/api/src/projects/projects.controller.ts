import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { CreateProjectDto, CreateWbsNodeDto } from "./projects.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @RequirePermissions("project:read")
  list(@CurrentUser() user: AuthContext) {
    return this.projects.list(user.tenantId);
  }

  @Get(":projectId/wbs")
  @RequirePermissions("project:read")
  wbsTree(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
  ) {
    return this.projects.wbsTree(user.tenantId, projectId);
  }

  @Post()
  @RequirePermissions("project:create")
  create(@CurrentUser() user: AuthContext, @Body() body: CreateProjectDto) {
    return this.projects.create(user.tenantId, user.userId, body);
  }

  @Post(":projectId/wbs")
  @RequirePermissions("wbs:create")
  createWbs(
    @CurrentUser() user: AuthContext,
    @Param("projectId") projectId: string,
    @Body() body: CreateWbsNodeDto,
  ) {
    return this.projects.createWbsNode(user.tenantId, projectId, user.userId, body);
  }
}
