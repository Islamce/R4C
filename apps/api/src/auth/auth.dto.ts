import {
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsUUID()
  tenantId!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(80)
  @MaxLength(512)
  refreshToken!: string;

  @IsUUID()
  tenantId!: string;
}
