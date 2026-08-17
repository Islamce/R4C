import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateProjectDto {
  @IsString()
  @Length(2, 30)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class CreateWbsNodeDto {
  @IsString()
  @Length(1, 40)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

/**
 * A canonicalized browser-parsed row. The service revalidates all hierarchy and
 * tenant-scoped business rules before any WBS record is written.
 */
export class WbsImportRowDto {
  @IsInt()
  @Min(2)
  rowNumber!: number;

  @IsString()
  @Length(1, 40)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  parentCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  plannedFrom?: string;

  @IsOptional()
  @IsDateString()
  plannedTo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000000)
  weight?: number;
}

export class PreviewWbsImportDto {
  @IsOptional()
  @IsString()
  @Length(1, 180)
  sourceName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => WbsImportRowDto)
  rows!: WbsImportRowDto[];
}

export class CommitWbsImportDto extends PreviewWbsImportDto {
  @IsString()
  @Length(64, 64)
  previewChecksum!: string;
}
