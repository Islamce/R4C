import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthContext } from "./auth-context";
import { AuthorizationService, PERMISSIONS_KEY } from "./authorization";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthContext }>();
    if (!request.user || !this.authorization.hasAll(request.user.permissions, required)) {
      throw new ForbiddenException("Insufficient permissions");
    }
    return true;
  }
}
