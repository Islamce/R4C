import { WorkflowStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";

export class TransitionWorkItemDto {
  @IsEnum(WorkflowStatus)
  toStatus!: WorkflowStatus;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
