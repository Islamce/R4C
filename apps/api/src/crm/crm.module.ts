import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CrmController } from "./crm.controller";
import { CrmService } from "./crm.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
