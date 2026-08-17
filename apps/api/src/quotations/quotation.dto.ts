import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from "class-validator";
import { CustomerDecisionType } from "@prisma/client";

export class CreateSalesQuotationDto {
  @IsUUID()
  leadId!: string;

  @IsUUID()
  paymentPlanId!: string;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @Length(3, 4000)
  terms?: string;
}

export class UpdateSalesQuotationDto {
  @IsOptional()
  @IsUUID()
  paymentPlanId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @Length(3, 4000)
  terms?: string;
}

export class ReturnSalesQuotationDto {
  @IsString()
  @Length(3, 1000)
  reason!: string;
}

export class PreviewLinkDto {
  @IsOptional()
  @Type(() => Number)
  @Min(5)
  @Max(1440)
  ttlMinutes?: number;
}

export class QuotationListQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  status?: string;
}

export class PublicQuotationTokenDto {
  @IsString()
  @Length(40, 256)
  token!: string;
}

export class RecordCustomerDecisionDto extends PublicQuotationTokenDto {
  @IsEnum(CustomerDecisionType)
  decision!: CustomerDecisionType;

  @IsOptional()
  @IsString()
  @Length(3, 2000)
  comment?: string;
}
