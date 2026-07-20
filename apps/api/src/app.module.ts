import { Controller, Get, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { BimModule } from "./bim/bim.module";
import { AuthorizationService } from "./common/authorization";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { PermissionsGuard } from "./common/permissions.guard";
import { Public } from "./common/public";
import { CostModule } from "./cost/cost.module";
import { DocumentsModule } from "./documents/documents.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProgressModule } from "./progress/progress.module";
import { ProjectsModule } from "./projects/projects.module";
import { ScheduleModule } from "./schedule/schedule.module";
import { StorageModule } from "./storage/storage.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Controller("health")
class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      service: "r4c-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    StorageModule,
    AuthModule,
    CostModule,
    DocumentsModule,
    BimModule,
    ProjectsModule,
    ProgressModule,
    ScheduleModule,
    WorkflowModule,
  ],
  controllers: [HealthController],
  providers: [
    AuthorizationService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
