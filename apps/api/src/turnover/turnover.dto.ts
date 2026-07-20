import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { CommissioningTestResult } from "@prisma/client";

export class CreateCommissioningCheckpointDto {
  @IsOptional() @IsUUID() wbsNodeId?: string;
  @IsString() @Length(1, 60) code!: string;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(1, 120) system!: string;
  @IsString() @Length(2, 4000) acceptanceCriteria!: string;
  @IsOptional() @IsBoolean() holdPoint?: boolean;
  @IsOptional() @IsString() @Length(2, 100) ifcType?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class CreateCommissioningPlanDto {
  @IsString() @Length(2, 160) name!: string;
  @IsString() @Length(1, 40) revision!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000)
  @ValidateNested({ each: true }) @Type(() => CreateCommissioningCheckpointDto)
  checkpoints!: CreateCommissioningCheckpointDto[];
}

export class ScheduleCommissioningTestDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsUUID() checkpointId!: string;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsUUID() performedById!: string;
  @IsDateString() scheduledFor!: string;
}

export class SubmitCommissioningTestDto {
  @IsEnum(CommissioningTestResult) result!: CommissioningTestResult;
  @IsOptional() @IsObject()
  readings?: Record<string, string | number | boolean | null>;
  @IsOptional() @IsString() @Length(1, 4000) notes?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID("4", { each: true })
  evidenceDocumentVersionIds?: string[];
}

export class ReviewCommissioningTestDto {
  @IsBoolean() accept!: boolean;
  @IsString() @Length(2, 2000) comment!: string;
}

export class CreateHandoverRequirementDto {
  @IsString() @Length(1, 60) code!: string;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(2, 100) documentType!: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class CreateHandoverPackageDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsString() @Length(2, 180) name!: string;
  @IsString() @Length(1, 120) system!: string;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500)
  @ValidateNested({ each: true }) @Type(() => CreateHandoverRequirementDto)
  requirements!: CreateHandoverRequirementDto[];
}

export class ProvideHandoverRequirementDto {
  @IsUUID() documentVersionId!: string;
  @IsOptional() @IsString() @Length(1, 2000) note?: string;
}

export class ReviewHandoverPackageDto {
  @IsBoolean() accept!: boolean;
  @IsString() @Length(2, 2000) comment!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(500) @IsUUID("4", { each: true })
  rejectedRequirementIds?: string[];
}
