import { Injectable, SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "r4c:permissions";
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class AuthorizationService {
  hasAll(granted: readonly string[], required: readonly string[]) {
    const permissionSet = new Set(granted);
    return required.every((permission) => permissionSet.has(permission));
  }
}
