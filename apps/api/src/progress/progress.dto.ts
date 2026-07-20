import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class SubmitProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percent!: number;

  @IsOptional()
  @IsString()
  @Length(3, 2000)
  note?: string;
}

export class ReviewProgressDto {
  @IsIn(["APPROVED", "REJECTED"])
  decision!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @Length(3, 2000)
  comment?: string;
}
