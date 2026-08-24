import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthContext, CurrentUser } from "../common/auth-context";
import { RequirePermissions } from "../common/authorization";
import {
  ApproveRevisionDto,
  ConvertLeadDto,
  CreateActivityDto,
  CreateContactDto,
  CreateOpportunityDto,
  CreateQuotationDto,
  CreateRevisionDto,
  CreateTaskDto,
  RecordDecisionDto,
  UpdateOpportunityStageDto,
  UpdateTaskStatusDto,
} from "./crm.dto";
import { CrmService } from "./crm.service";

@Controller("crm")
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get("contacts")
  @RequirePermissions("crm:read")
  contacts(@CurrentUser() user: AuthContext, @Query("ownerId") ownerId?: string) {
    return this.crm.listContacts(user.tenantId, ownerId);
  }

  @Post("contacts")
  @RequirePermissions("crm:write")
  createContact(@CurrentUser() user: AuthContext, @Body() body: CreateContactDto) {
    return this.crm.createContact(user.tenantId, user.userId, body);
  }

  @Post("leads/:leadId/convert")
  @RequirePermissions("crm:write")
  convertLead(@CurrentUser() user: AuthContext, @Param("leadId") leadId: string, @Body() body: ConvertLeadDto) {
    return this.crm.convertLead(user.tenantId, user.userId, leadId, body);
  }

  @Get("opportunities")
  @RequirePermissions("crm:read")
  opportunities(@CurrentUser() user: AuthContext, @Query("ownerId") ownerId?: string) {
    return this.crm.listOpportunities(user.tenantId, ownerId);
  }

  @Post("opportunities")
  @RequirePermissions("crm:write")
  createOpportunity(@CurrentUser() user: AuthContext, @Body() body: CreateOpportunityDto) {
    return this.crm.createOpportunity(user.tenantId, user.userId, body);
  }

  @Patch("opportunities/:opportunityId/stage")
  @RequirePermissions("crm:write")
  updateOpportunityStage(@CurrentUser() user: AuthContext, @Param("opportunityId") opportunityId: string, @Body() body: UpdateOpportunityStageDto) {
    return this.crm.updateOpportunityStage(user.tenantId, user.userId, opportunityId, body);
  }

  @Get("activities")
  @RequirePermissions("crm:read")
  activities(@CurrentUser() user: AuthContext, @Query("opportunityId") opportunityId?: string) {
    return this.crm.listActivities(user.tenantId, opportunityId);
  }

  @Post("activities")
  @RequirePermissions("crm:write")
  createActivity(@CurrentUser() user: AuthContext, @Body() body: CreateActivityDto) {
    return this.crm.createActivity(user.tenantId, user.userId, body);
  }

  @Get("tasks")
  @RequirePermissions("crm:read")
  tasks(@CurrentUser() user: AuthContext, @Query("assigneeId") assigneeId?: string) {
    return this.crm.listTasks(user.tenantId, assigneeId);
  }

  @Post("tasks")
  @RequirePermissions("crm:write")
  createTask(@CurrentUser() user: AuthContext, @Body() body: CreateTaskDto) {
    return this.crm.createTask(user.tenantId, user.userId, body);
  }

  @Patch("tasks/:taskId/status")
  @RequirePermissions("crm:write")
  updateTaskStatus(@CurrentUser() user: AuthContext, @Param("taskId") taskId: string, @Body() body: UpdateTaskStatusDto) {
    return this.crm.updateTaskStatus(user.tenantId, user.userId, taskId, body);
  }

  @Post("quotations")
  @RequirePermissions("crm:write")
  createQuotation(@CurrentUser() user: AuthContext, @Body() body: CreateQuotationDto) {
    return this.crm.createQuotation(user.tenantId, user.userId, body);
  }

  @Post("quotations/:quotationId/revisions")
  @RequirePermissions("crm:write")
  createQuotationRevision(@CurrentUser() user: AuthContext, @Param("quotationId") quotationId: string, @Body() body: CreateRevisionDto) {
    return this.crm.createQuotationRevision(user.tenantId, user.userId, quotationId, body);
  }

  @Patch("quotation-revisions/:revisionId/status")
  @RequirePermissions("crm:approve")
  approveQuotationRevision(@CurrentUser() user: AuthContext, @Param("revisionId") revisionId: string, @Body() body: ApproveRevisionDto) {
    return this.crm.approveQuotationRevision(user.tenantId, user.userId, revisionId, body);
  }

  @Post("quotation-revisions/:revisionId/decision")
  @RequirePermissions("crm:write")
  decideQuotation(@CurrentUser() user: AuthContext, @Param("revisionId") revisionId: string, @Body() body: RecordDecisionDto) {
    return this.crm.decideQuotation(user.tenantId, user.userId, revisionId, body);
  }
}
