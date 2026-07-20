import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";
import {
  SafetyEventType,
  SafetyPermitType,
  SafetySeverity,
} from "@prisma/client";

export class EvidenceIdsDto {
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID("4", { each: true })
  evidenceDocumentVersionIds?: string[];
}

export class CreateSafetyPermitDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsEnum(SafetyPermitType) type!: SafetyPermitType;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(2, 4000) description!: string;
  @IsString() @Length(2, 8000) riskAssessment!: string;
  @IsString() @Length(2, 8000) controls!: string;
  @IsDateString() validFrom!: string;
  @IsDateString() validUntil!: string;
}

export class ReviewSafetyPermitDto {
  @IsBoolean() approve!: boolean;
  @IsString() @Length(2, 2000) comment!: string;
}

export class SafetyPermitNoteDto {
  @IsString() @Length(2, 2000) note!: string;
}

export class CreateSafetyEventDto {
  @IsString() @Length(1, 100) externalId!: string;
  @IsEnum(SafetyEventType) type!: SafetyEventType;
  @IsEnum(SafetySeverity) severity!: SafetySeverity;
  @IsUUID() wbsNodeId!: string;
  @IsOptional() @IsUUID() bimElementId?: string;
  @IsString() @Length(2, 180) title!: string;
  @IsString() @Length(2, 8000) description!: string;
  @IsDateString() occurredAt!: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID("4", { each: true })
  evidenceDocumentVersionIds?: string[];
}

export class InvestigateSafetyEventDto {
  @IsString() @Length(2, 8000) rootCause!: string;
  @IsString() @Length(2, 8000) immediateActions!: string;
}

export class CreateSafetyActionDto {
  @IsString() @Length(2, 2000) description!: string;
  @IsUUID() assignedToId!: string;
  @IsDateString() dueAt!: string;
}

export class CompleteSafetyActionDto {
  @IsString() @Length(2, 2000) note!: string;
}

export class VerifySafetyActionDto {
  @IsBoolean() accept!: boolean;
  @IsString() @Length(2, 2000) note!: string;
}

export class CloseSafetyEventDto {
  @IsString() @Length(2, 2000) closureNote!: string;
}
