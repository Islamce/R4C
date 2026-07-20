import { Type } from "@nestjs/class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import {
  QualityFindingSeverity,
  QualityFindingType,
  QualityInspectionResult,
} from "@prisma/client";

export class CreateQualityCheckpointDto {
  @IsOptional() @IsUUID() wbsNodeId?: string;
  @IsString() @Length(1, 60) code!: string;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(2, 100) inspectionType!: string;
  @IsString() @Length(2, 2000) acceptanceCriteria!: string;
  @IsOptional() @IsBoolean() holdPoint?: boolean;
  @IsOptional() @IsString() @Length(2, 100) ifcType?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class CreateQualityPlanDto {
  @IsString() @Length(2, 160) name!: string;
  @IsString() @Length(1, 40) revision!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000)
  @ValidateNested({ each: true }) @Type(() => CreateQualityCheckpointDto)
  checkpoints!: CreateQualityCheckpointDto[];
}

export class ScheduleInspectionDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsUUID() checkpointId!: string;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsUUID() inspectedById!: string;
  @IsDateString() scheduledFor!: string;
}

export class SubmitInspectionDto {
  @IsEnum(QualityInspectionResult) result!: QualityInspectionResult;
  @IsOptional() @IsString() @Length(1, 4000) notes?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID("4", { each: true })
  evidenceDocumentVersionIds?: string[];
}

export class ReviewInspectionDto {
  @IsBoolean() accept!: boolean;
  @IsString() @Length(2, 2000) comment!: string;
}

export class CreateQualityFindingDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsOptional() @IsUUID() inspectionId?: string;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsEnum(QualityFindingType) type!: QualityFindingType;
  @IsEnum(QualityFindingSeverity) severity!: QualityFindingSeverity;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(2, 4000) description!: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID("4", { each: true })
  evidenceDocumentVersionIds?: string[];
}

export class CreateQualityActionDto {
  @IsString() @Length(2, 2000) description!: string;
  @IsUUID() assignedToId!: string;
  @IsDateString() dueAt!: string;
}

export class CompleteQualityActionDto {
  @IsString() @Length(2, 2000) note!: string;
}

export class VerifyQualityActionDto {
  @IsBoolean() accept!: boolean;
  @IsString() @Length(2, 2000) note!: string;
}

export class CloseQualityFindingDto {
  @IsString() @Length(2, 2000) closureNote!: string;
}
