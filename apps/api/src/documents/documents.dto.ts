import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateDocumentDto {
  @IsString()
  @Length(2, 40)
  code!: string;

  @IsString()
  @Length(2, 200)
  title!: string;

  @IsString()
  @Length(2, 50)
  documentType!: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  discipline?: string;
}

export class RequestVersionUploadDto {
  @IsString()
  @Length(1, 30)
  revision!: string;

  @IsString()
  @Length(3, 240)
  fileName!: string;

  @IsString()
  @Length(3, 120)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(1_073_741_824)
  sizeBytes!: number;

  @IsOptional()
  @Matches(/^[a-fA-F0-9]{64}$/)
  checksumSha256?: string;
}

export class AddCommentDto {
  @IsString()
  @Length(1, 4000)
  body!: string;
}

export class ReviewVersionDto {
  @IsIn(["APPROVED", "RETURNED", "REJECTED"])
  decision!: "APPROVED" | "RETURNED" | "REJECTED";

  @IsOptional()
  @IsString()
  @Length(3, 2000)
  comment?: string;
}

export class DistributeVersionDto {
  @IsString()
  @Length(2, 40)
  recipientType!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  recipientId?: string;

  @IsString()
  @Length(2, 200)
  recipientName!: string;

  @IsString()
  @Length(2, 200)
  purpose!: string;
}
