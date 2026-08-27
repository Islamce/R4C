import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { Public } from "../common/public";
import { PublicInterestRateLimit, TenantLookupRateLimit } from "../common/rate-limit";
import { PublicPortfolioQueryDto, RequestPhoneVerificationDto, SubmitPublicInterestDto, VerifyPhoneDto } from "./commercial.dto";
import { PublicCommercialService } from "./public-commercial.service";

@Public()
@Controller("public/commercial")
export class PublicCommercialController {
  constructor(private readonly publicCommercial: PublicCommercialService) {}

  @Get("portfolio")
  @TenantLookupRateLimit()
  portfolio(@Query() query: PublicPortfolioQueryDto) {
    return this.publicCommercial.portfolio(query.tenantCode);
  }

  @Post("phone/request")
  @PublicInterestRateLimit()
  @HttpCode(202)
  requestPhone(@Body() body: RequestPhoneVerificationDto) {
    return this.publicCommercial.requestPhoneVerification(body);
  }

  @Post("phone/verify")
  @PublicInterestRateLimit()
  verifyPhone(@Body() body: VerifyPhoneDto) {
    return this.publicCommercial.verifyPhone(body);
  }

  @Post("interests")
  @PublicInterestRateLimit()
  submitInterest(@Body() body: SubmitPublicInterestDto) {
    return this.publicCommercial.submitInterest(body);
  }
}
