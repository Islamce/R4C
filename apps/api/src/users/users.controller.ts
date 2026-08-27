import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { CreateUserDto, UpdateUserAccessDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("admin/users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions("user:read")
  list(@CurrentUser() user: AuthContext) {
    return this.users.list(user.tenantId);
  }

  @Get("roles")
  @RequirePermissions("user:read")
  roles(@CurrentUser() user: AuthContext) {
    return this.users.roles(user.tenantId);
  }

  @Post()
  @RequirePermissions("user:manage")
  create(@CurrentUser() user: AuthContext, @Body() body: CreateUserDto) {
    return this.users.create(user.tenantId, user.userId, body);
  }

  @Patch(":userId")
  @RequirePermissions("user:manage")
  update(
    @CurrentUser() user: AuthContext,
    @Param("userId") userId: string,
    @Body() body: UpdateUserAccessDto,
  ) {
    return this.users.update(user.tenantId, user.userId, userId, body);
  }
}
