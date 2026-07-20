import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";
import { CostEntryType } from "@prisma/client";

export class CreateBudgetLineDto {
  @IsUUID()
  wbsNodeId!: string;

  @IsString()
  @Length(1, 60)
  costCode!: string;

  @IsString()
  @Length(2, 240)
  description!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  quantity!: string;

  @IsString()
  @Length(1, 20)
  unit!: string;

  @IsDecimal({ decimal_digits: "0,4" })
  unitRate!: string;
}

export class CreateBudgetDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsString()
  @Length(1, 40)
  revision!: string;

  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetLineDto)
  lines!: CreateBudgetLineDto[];
}

export class CreateCostEntryDto {
  @IsEnum(CostEntryType)
  entryType!: CostEntryType;

  @IsString()
  @Length(1, 100)
  externalId!: string;

  @IsUUID()
  wbsNodeId!: string;

  @IsOptional()
  @IsUUID()
  budgetLineId?: string;

  @IsString()
  @Length(2, 240)
  description!: string;

  @IsDecimal({ decimal_digits: "0,2" })
  amount!: string;

  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsDateString()
  occurredAt!: string;
}
