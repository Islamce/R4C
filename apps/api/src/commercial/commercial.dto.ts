import { Type } from "class-transformer";
import { DevelopmentPhaseStatus, LeadStatus, SalesActivityType, SalesTaskPriority, SalesTaskStatus, TransferCaseStatus, TransferDocumentStatus, TranslationLocale, UnitStatus } from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class ProjectQueryDto {
  @IsUUID()
  projectId!: string;
}

export class CreatePhaseDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @Length(1, 40)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsEnum(DevelopmentPhaseStatus)
  status?: DevelopmentPhaseStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  sequence?: number;

  @IsOptional()
  @IsDateString()
  launchDate?: string;

  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsDateString()
  salesOpenAt?: string;

  @IsOptional()
  @IsDateString()
  salesCloseAt?: string;
}

export class UpdatePhaseDto {
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(2, 160) name?: string;
  @IsOptional() @IsString() @Length(1, 1000) description?: string;
  @IsOptional() @IsEnum(DevelopmentPhaseStatus) status?: DevelopmentPhaseStatus;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sequence?: number;
  @IsOptional() @IsDateString() launchDate?: string;
  @IsOptional() @IsDateString() expectedCompletionDate?: string;
  @IsOptional() @IsDateString() salesOpenAt?: string;
  @IsOptional() @IsDateString() salesCloseAt?: string;
}

export class CreateBuildingDto {
  @IsUUID() projectId!: string;
  @IsUUID() phaseId!: string;
  @IsString() @Length(1, 40) code!: string;
  @IsString() @Length(2, 160) name!: string;
}

export class UpdateBuildingDto {
  @IsOptional() @IsUUID() phaseId?: string;
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(2, 160) name?: string;
}

export class BuildingQueryDto {
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() phaseId?: string;
}

export class CreateFloorDto {
  @IsUUID() buildingId!: string;
  @IsString() @Length(1, 40) code!: string;
  @IsString() @Length(1, 160) name!: string;
  @IsInt() @Min(-20) @Max(500) floorNumber!: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sequence?: number;
}

export class UpdateFloorDto {
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(1, 160) name?: string;
  @IsOptional() @IsInt() @Min(-20) @Max(500) floorNumber?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sequence?: number;
}

export class FloorQueryDto {
  @IsUUID() buildingId!: string;
}

export class CreateUnitTypeDto {
  @IsUUID() projectId!: string;
  @IsString() @Length(1, 40) code!: string;
  @IsString() @Length(2, 160) name!: string;
  @IsInt() @Min(0) @Max(30) bedrooms!: number;
  @IsInt() @Min(0) @Max(30) bathrooms!: number;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) defaultArea?: string;
  @IsOptional() @IsString() @Length(1, 1000) description?: string;
}

export class UpdateUnitTypeDto {
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(2, 160) name?: string;
  @IsOptional() @IsInt() @Min(0) @Max(30) bedrooms?: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) bathrooms?: number;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) defaultArea?: string;
  @IsOptional() @IsString() @Length(1, 1000) description?: string;
}

export class CreateUnitDto {
  @IsUUID() projectId!: string;
  @IsUUID() phaseId!: string;
  @IsUUID() buildingId!: string;
  @IsUUID() floorId!: string;
  @IsUUID() unitTypeId!: string;
  @IsString() @Length(1, 40) code!: string;
  @IsString() @Length(1, 40) number!: string;
  @IsDecimal({ decimal_digits: "0,2" }) grossArea!: string;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) netArea?: string;
  @IsInt() @Min(0) @Max(30) bedrooms!: number;
  @IsInt() @Min(0) @Max(30) bathrooms!: number;
  @IsOptional() @IsString() @Length(1, 80) orientation?: string;
  @IsOptional() @IsString() @Length(1, 120) view?: string;
  @IsOptional() @IsInt() @Min(0) @Max(20) parkingCount?: number;
}

export class UpdateUnitDto {
  @IsOptional() @IsUUID() phaseId?: string;
  @IsOptional() @IsUUID() buildingId?: string;
  @IsOptional() @IsUUID() floorId?: string;
  @IsOptional() @IsUUID() unitTypeId?: string;
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(1, 40) number?: string;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) grossArea?: string;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) netArea?: string;
  @IsOptional() @IsInt() @Min(0) @Max(30) bedrooms?: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) bathrooms?: number;
  @IsOptional() @IsString() @Length(1, 80) orientation?: string;
  @IsOptional() @IsString() @Length(1, 120) view?: string;
  @IsOptional() @IsInt() @Min(0) @Max(20) parkingCount?: number;
}

export class UnitQueryDto {
  @IsUUID() projectId!: string;
  @IsOptional() @IsUUID() phaseId?: string;
  @IsOptional() @IsUUID() buildingId?: string;
  @IsOptional() @IsUUID() floorId?: string;
  @IsOptional() @IsUUID() unitTypeId?: string;
  @IsOptional() @IsEnum(UnitStatus) status?: UnitStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(30) bedrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(30) bathrooms?: number;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) minArea?: string;
  @IsOptional() @IsDecimal({ decimal_digits: "0,2" }) maxArea?: string;
  @IsOptional() @IsString() @Length(1, 80) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 25;

  @IsOptional() @IsEnum(TranslationLocale) locale: TranslationLocale = TranslationLocale.en;
}

export class CommercialLocaleQueryDto {
  @IsOptional() @IsEnum(TranslationLocale) locale: TranslationLocale = TranslationLocale.en;
}

export class CreateUnitPriceRevisionDto {
  @Matches(/^\d+$/) basePriceMinor!: string;
  @Matches(/^\d+$/) listPriceMinor!: string;
  @IsString() @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsOptional() @IsDateString() validFrom?: string;
}

export class CreatePaymentPlanInstallmentDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) sequence!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(10000) shareBasisPoints!: number;
  @IsOptional() @IsString() @Length(1, 160) label?: string;
}

export class CreatePaymentPlanDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreatePaymentPlanInstallmentDto)
  installments!: CreatePaymentPlanInstallmentDto[];
}

export class AttachCommercialMediaDto {
  @IsUUID() documentVersionId!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class CreateTranslationDto {
  @IsIn(["Project", "DevelopmentPhase", "UnitType"])
  entityType!: "Project" | "DevelopmentPhase" | "UnitType";

  @IsUUID()
  entityId!: string;

  @IsEnum(TranslationLocale)
  locale!: TranslationLocale;

  @IsIn(["description"])
  field!: "description";

  @IsString()
  @Length(1, 10000)
  value!: string;
}

export class TranslationQueryDto {
  @IsIn(["Project", "DevelopmentPhase", "UnitType"])
  entityType!: "Project" | "DevelopmentPhase" | "UnitType";

  @IsUUID()
  entityId!: string;

  @IsIn(["description"])
  field!: "description";

  @IsOptional()
  @IsEnum(TranslationLocale)
  locale?: TranslationLocale;
}

export class CreateUnitHoldDto {
  @IsUUID()
  unitId!: string;

  @IsUUID()
  leadId!: string;

  @IsDateString()
  holdExpiresAt!: string;
}

export class ConfirmReservationDto {
  @IsUUID()
  paymentPlanId!: string;
}

export class CreateCustomerDto {
  @IsString() @Length(1, 160) firstName!: string;
  @IsOptional() @IsString() @Length(1, 160) lastName?: string;
  @IsString() @Length(9, 32) phone!: string;
  @IsEmail() @Length(3, 320) email!: string;
}

export class CreateLeadDto {
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsString() @Length(1, 160) source!: string;
  @IsOptional() @IsBoolean() isExternalEnquiry?: boolean;
  @IsOptional() @IsBoolean() enquiryConsentGranted?: boolean;
  @IsOptional() @IsDateString() enquiryConsentAt?: string;
  @IsOptional() @IsString() @Length(1, 80) enquiryConsentChannel?: string;
  @IsOptional() @IsString() @Length(1, 240) enquiryConsentPurpose?: string;
  @IsOptional() @IsBoolean() marketingConsentGranted?: boolean;
  @IsOptional() @IsDateString() marketingConsentAt?: string;
  @IsOptional() @IsString() @Length(1, 80) marketingConsentChannel?: string;
  @IsOptional() @IsString() @Length(1, 240) marketingConsentPurpose?: string;
}

export class LeadQueryDto {
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 25;
}

export class AdvanceLeadDto {
  @IsEnum(LeadStatus) status!: LeadStatus;
}

export class AssignLeadDto {
  @IsUUID() assignedToId!: string;
}

export class WithdrawLeadConsentDto {
  @IsIn(["enquiry", "marketing"]) consentType!: "enquiry" | "marketing";
  @IsOptional() @IsString() @Length(1, 240) reason?: string;
}

export class CreateSalesActivityDto {
  @IsEnum(SalesActivityType) type!: SalesActivityType;
  @IsString() @Length(1, 4000) notes!: string;
}

export class CreateSalesTaskDto {
  @IsString() @Length(2, 240) title!: string;
  @IsOptional() @IsString() @Length(1, 4000) description?: string;
  @IsUUID() assigneeId!: string;
  @IsDateString() dueAt!: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsEnum(SalesTaskPriority) priority?: SalesTaskPriority;
}

export class UpdateSalesTaskDto {
  @IsOptional() @IsEnum(SalesTaskStatus) status?: SalesTaskStatus;
  @IsOptional() @IsEnum(SalesTaskPriority) priority?: SalesTaskPriority;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
}

export class CreateTransferCaseDto {
  @IsUUID() reservationId!: string;
}

export class RequestTransferDocumentUploadDto {
  @IsString() @Length(1, 255) fileName!: string;
  @IsString() @Length(3, 120) mimeType!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(26214400) sizeBytes!: number;
}

export class ReviewTransferDocumentDto {
  @IsEnum(TransferDocumentStatus) status!: TransferDocumentStatus;
  @IsOptional() @IsString() @Length(1, 1024) storageKey?: string;
  @IsOptional() @IsString() @Length(1, 2000) notes?: string;
}

export class ReviewTransferCaseDto {
  @IsEnum(TransferCaseStatus) status!: TransferCaseStatus;
}

export class CreateCommercialDispatchDto {
  @IsUUID() projectId!: string;
  @IsUUID() customerId!: string;
  @IsEmail() @Length(3, 320) recipientEmail!: string;
  @IsString() @Length(2, 240) subject!: string;
  @IsString() @Length(2, 10000) message!: string;
  @IsArray() @ArrayMinSize(1) @IsUUID("4", { each: true }) assetIds!: string[];
}

export class PublicPortfolioQueryDto {
  @IsString() @Length(2, 40) tenantCode!: string;
}

export class RequestPhoneVerificationDto {
  @IsString() @Length(2, 40) tenantCode!: string;
  @IsString() @Length(9, 32) phone!: string;
}

export class VerifyPhoneDto {
  @IsString() @Length(2, 40) tenantCode!: string;
  @IsUUID() verificationId!: string;
  @Matches(/^\d{6}$/) code!: string;
}

export class SubmitPublicInterestDto {
  @IsString() @Length(2, 40) tenantCode!: string;
  @IsUUID() verificationId!: string;
  @IsString() @Length(1, 160) firstName!: string;
  @IsOptional() @IsString() @Length(1, 160) lastName?: string;
  @IsString() @Length(9, 32) phone!: string;
  @IsEmail() @Length(3, 320) email!: string;
  @IsUUID() projectId!: string;
  @IsOptional() @IsUUID() unitId?: string;
  @IsBoolean() enquiryConsentGranted!: boolean;
  @IsOptional() @IsBoolean() marketingConsentGranted?: boolean;
}
