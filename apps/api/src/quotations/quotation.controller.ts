import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import { Public } from "../common/public";
import { QuotationApprovalRateLimit } from "../common/rate-limit";
import {
  CreateSalesQuotationDto,
  PreviewLinkDto,
  PublicQuotationTokenDto,
  QuotationListQueryDto,
  RecordCustomerDecisionDto,
  ReturnSalesQuotationDto,
  UpdateSalesQuotationDto,
} from "./quotation.dto";
import { QuotationService } from "./quotation.service";

@Controller("quotations")
export class QuotationController {
  constructor(private readonly quotations: QuotationService) {}

  @Get()
  @RequirePermissions("commercial:quotation:read-own")
  list(@CurrentUser() user: AuthContext, @Query() query: QuotationListQueryDto) {
    return this.quotations.list(user, query);
  }

  @Get(":id")
  @RequirePermissions("commercial:quotation:read-own")
  detail(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.detail(user, id);
  }

  @Post()
  @RequirePermissions("commercial:quotation:create")
  create(@CurrentUser() user: AuthContext, @Body() body: CreateSalesQuotationDto) {
    return this.quotations.createDraft(user, body);
  }

  @Patch(":id")
  @RequirePermissions("commercial:quotation:create")
  update(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: UpdateSalesQuotationDto) {
    return this.quotations.updateDraft(user, id, body);
  }

  @Post(":id/submit")
  @RequirePermissions("commercial:quotation:create")
  submit(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.submitForReview(user, id);
  }

  @Post(":id/return")
  @RequirePermissions("commercial:quotation:review")
  returnToDraft(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: ReturnSalesQuotationDto) {
    return this.quotations.returnToDraft(user, id, body);
  }

  @Post(":id/approve-to-send")
  @RequirePermissions("commercial:quotation:review")
  approveToSend(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.approveToSend(user, id);
  }

  @Post(":id/withdraw")
  @RequirePermissions("commercial:quotation:withdraw")
  withdraw(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.withdraw(user, id);
  }

  @Post(":id/revision")
  @RequirePermissions("commercial:quotation:create")
  revision(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.createRevision(user, id);
  }

  @Get(":id/preview-document")
  @RequirePermissions("commercial:quotation:preview")
  previewDocument(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    return this.quotations.previewDocument(user, id);
  }

  @Post(":id/synthetic-preview-link")
  @RequirePermissions("commercial:quotation:preview")
  syntheticPreviewLink(@CurrentUser() user: AuthContext, @Param("id") id: string, @Body() body: PreviewLinkDto) {
    return this.quotations.generateSyntheticPreviewLink(user, id, body.ttlMinutes ?? 60);
  }
}

@Public()
@Controller("buyer/quotation")
export class PublicQuotationController {
  constructor(private readonly quotations: QuotationService) {}

  @Post("resolve")
  @QuotationApprovalRateLimit()
  resolve(@Body() body: PublicQuotationTokenDto) {
    return this.quotations.publicQuotation(body.token);
  }

  @Post("decision")
  @QuotationApprovalRateLimit()
  decide(
    @Body() body: RecordCustomerDecisionDto,
    @Headers("user-agent") userAgent?: string,
    @Headers("x-forwarded-for") forwardedFor?: string,
  ) {
    return this.quotations.recordCustomerDecision(body, {
      userAgent,
      ipAddress: forwardedFor?.split(",")[0]?.trim(),
    });
  }
}
