import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../common/public";
import { TenantLookupRateLimit } from "../common/rate-limit";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Public()
  @TenantLookupRateLimit()
  @Get("by-code/:code")
  byCode(@Param("code") code: string) {
    return this.tenants.findActiveByCode(code);
  }
}
