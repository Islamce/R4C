import { Type } from "class-transformer";
import { DevelopmentPhaseStatus, UnitStatus } from "@prisma/client";
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
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
}
