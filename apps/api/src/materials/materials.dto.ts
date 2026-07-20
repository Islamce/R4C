import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { MaterialTakeoffSource } from "@prisma/client";

export class CreateMaterialDto {
  @IsString()
  @Length(1, 60)
  code!: string;

  @IsString()
  @Length(2, 240)
  description!: string;

  @IsString()
  @Length(1, 20)
  baseUnit!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  specification?: string;
}

export class CreateTakeoffLineDto {
  @IsUUID()
  materialId!: string;

  @IsUUID()
  wbsNodeId!: string;

  @IsOptional()
  @IsUUID()
  bimElementId?: string;

  @IsEnum(MaterialTakeoffSource)
  source!: MaterialTakeoffSource;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  sourceReference?: string;

  @IsDecimal({ decimal_digits: "0,4" })
  quantity!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  wastePercent!: string;

  @IsOptional()
  @IsDateString()
  requiredOn?: string;
}

export class CreateTakeoffDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsString()
  @Length(1, 40)
  revision!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25000)
  @ValidateNested({ each: true })
  @Type(() => CreateTakeoffLineDto)
  lines!: CreateTakeoffLineDto[];
}

export class CreateInventoryLocationDto {
  @IsString()
  @Length(1, 40)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;
}

export class CreateProcurementLineDto {
  @IsInt()
  @Min(1)
  @Max(999999)
  lineNumber!: number;

  @IsUUID()
  materialId!: string;

  @IsUUID()
  wbsNodeId!: string;

  @IsOptional()
  @IsUUID()
  budgetLineId?: string;

  @IsDecimal({ decimal_digits: "0,4" })
  orderedQuantity!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  unitPrice!: string;

  @IsOptional()
  @IsDateString()
  promisedOn?: string;
}

export class CreateProcurementOrderDto {
  @IsString()
  @Length(1, 100)
  externalId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  vendorCode?: string;

  @IsString()
  @Length(2, 200)
  vendorName!: string;

  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsDateString()
  placedAt!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementLineDto)
  lines!: CreateProcurementLineDto[];
}

export class ReceiveMaterialDto {
  @IsString()
  @Length(1, 120)
  externalId!: string;

  @IsUUID()
  locationId!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  quantity!: string;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}

export class IssueMaterialDto {
  @IsString()
  @Length(1, 120)
  externalId!: string;

  @IsUUID()
  locationId!: string;

  @IsUUID()
  materialId!: string;

  @IsUUID()
  wbsNodeId!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  quantity!: string;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}
