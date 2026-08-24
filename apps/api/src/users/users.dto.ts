import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";

export const ASSIGNABLE_ROLE_CODES = ["ADMIN", "SALES_MANAGER", "SALES_AGENT", "VIEWER"] as const;
export type AssignableRoleCode = (typeof ASSIGNABLE_ROLE_CODES)[number];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 120)
  displayName!: string;

  @IsString()
  @Length(12, 128)
  temporaryPassword!: string;

  @IsIn(ASSIGNABLE_ROLE_CODES)
  roleCode!: AssignableRoleCode;
}

export class UpdateUserAccessDto {
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLE_CODES)
  roleCode?: AssignableRoleCode;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
