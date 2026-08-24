import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import {
  ContactCommunicationPreference,
  CrmActivityType,
  CrmTaskPriority,
  CrmTaskStatus,
  CustomerDecisionStatus,
  OpportunityStage,
  QuotationRevisionStatus,
} from "@prisma/client";

export class CreateContactDto {
  @IsString() @MaxLength(120) firstName!: string;
  @IsOptional() @IsString() @MaxLength(120) lastName?: string;
  @IsOptional() @IsEmail() @MaxLength(320) email?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsEnum(ContactCommunicationPreference) communicationPreference?: ContactCommunicationPreference;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
}

export class ConvertLeadDto {
  @IsOptional() @IsUUID() ownerId?: string;
}

export class CreateOpportunityDto {
  @IsString() @MaxLength(240) name!: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() contactId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsEnum(OpportunityStage) stage?: OpportunityStage;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) expectedValueMinor?: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
}

export class UpdateOpportunityStageDto {
  @IsEnum(OpportunityStage) stage!: OpportunityStage;
}

export class CreateActivityDto {
  @IsEnum(CrmActivityType) type!: CrmActivityType;
  @IsString() @MaxLength(5000) notes!: string;
  @IsOptional() @IsUUID() contactId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() opportunityId?: string;
  @IsOptional() @IsUUID() quotationId?: string;
  @IsOptional() @IsUUID() reservationId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
}

export class CreateTaskDto {
  @IsString() @MaxLength(240) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(CrmTaskPriority) priority?: CrmTaskPriority;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsUUID() assigneeId!: string;
  @IsOptional() @IsUUID() contactId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() opportunityId?: string;
  @IsOptional() @IsUUID() quotationId?: string;
  @IsOptional() @IsUUID() reservationId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
}

export class UpdateTaskStatusDto {
  @IsEnum(CrmTaskStatus) status!: CrmTaskStatus;
}

export class CreateQuotationDto {
  @IsUUID() opportunityId!: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsObject() snapshot!: Record<string, unknown>;
}

export class CreateRevisionDto {
  @IsObject() snapshot!: Record<string, unknown>;
}

export class ApproveRevisionDto {
  @IsEnum(QuotationRevisionStatus) status!: QuotationRevisionStatus;
}

export class RecordDecisionDto {
  @IsEnum(CustomerDecisionStatus) status!: CustomerDecisionStatus;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
