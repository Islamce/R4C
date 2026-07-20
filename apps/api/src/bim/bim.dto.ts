import { ArrayMaxSize, IsArray, IsNumber, IsUUID, Max, Min } from "class-validator";

export class LinkBimElementsDto {
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID("4", { each: true })
  elementIds!: string[];

  @IsUUID()
  wbsNodeId!: string;

  @IsNumber()
  @Min(0.0001)
  @Max(1)
  weight!: number;
}
