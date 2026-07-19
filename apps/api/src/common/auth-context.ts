import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest<{ user: AuthContext }>();
    return request.user;
  },
);
