import { IsDateString, IsOptional, IsString, Length } from "class-validator";

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
