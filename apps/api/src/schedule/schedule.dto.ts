import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { ScheduleDependencyType } from "@prisma/client";

export class CreateScheduleActivityDto {
  @IsString()
  @Length(1, 80)
  externalId!: string;

  @IsString()
  @Length(2, 200)
  name!: string;

  @IsUUID()
  wbsNodeId!: string;

  @IsDateString()
  plannedStart!: string;

  @IsDateString()
  plannedFinish!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  @Max(1000000)
  weight?: number;
}

export class CreateScheduleDependencyDto {
  @IsString()
  @Length(1, 80)
  predecessorExternalId!: string;

  @IsString()
  @Length(1, 80)
  successorExternalId!: string;

  @IsEnum(ScheduleDependencyType)
  type!: ScheduleDependencyType;

  @IsOptional()
  @IsNumber()
  @Min(-3650)
  @Max(3650)
  lagDays?: number;
}

export class CreateScheduleDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsString()
  @Length(1, 40)
  revision!: string;

  @IsDateString()
  dataDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleActivityDto)
  activities!: CreateScheduleActivityDto[];

  @IsArray()
  @ArrayMaxSize(25000)
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDependencyDto)
  dependencies!: CreateScheduleDependencyDto[];
}
