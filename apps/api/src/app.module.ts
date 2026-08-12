import { Controller, Get, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { BimModule } from "./bim/bim.module";
import { AuthorizationService } from "./common/authorization";
import { JwtAuthGuard } from "./common/jwt-auth.guard";
import { PermissionsGuard } from "./common/permissions.guard";
import { ProxyAwareThrottlerGuard } from "./common/proxy-aware-throttler.guard";
import { Public } from "./common/public";
import { positiveInteger, RATE_LIMIT_WINDOW_MS } from "./common/rate-limit";
import { CostModule } from "./cost/cost.module";
import { CommercialModule } from "./commercial/commercial.module";
import { DocumentsModule } from "./documents/documents.module";
import { HseModule } from "./hse/hse.module";
import { MaterialsModule } from "./materials/materials.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrismaService } from "./prisma/prisma.service";
import { ProgressModule } from "./progress/progress.module";
import { QualityModule } from "./quality/quality.module";
import { ProjectsModule } from "./projects/projects.module";
import { ScheduleModule } from "./schedule/schedule.module";
import { StorageModule } from "./storage/storage.module";
import { TenantsModule } from "./tenants/tenants.module";
import { TurnoverModule } from "./turnover/turnover.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Controller("health")
class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  getHealth() {
    return {
      service: "r4c-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get("ready")
  async getReadiness() {
    const startedAt = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      service: "r4c-api",
      status: "ready",
      dependencies: {
        database: {
          status: "ok",
          latencyMs: Date.now() - startedAt,
        },
      },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: "default",
          ttl: RATE_LIMIT_WINDOW_MS,
          limit: positiveInteger(config.get<string>("RATE_LIMIT_GLOBAL_PER_MINUTE"), 100),
        },
      ],
    }),
    PrismaModule,
    AuditModule,
    StorageModule,
    TurnoverModule,
    AuthModule,
    TenantsModule,
    CommercialModule,
    CostModule,
    DocumentsModule,
    HseModule,
    MaterialsModule,
    BimModule,
    ProjectsModule,
    ProgressModule,
    QualityModule,
    ScheduleModule,
    WorkflowModule,
  ],
  controllers: [HealthController],
  providers: [
    AuthorizationService,
    { provide: APP_GUARD, useClass: ProxyAwareThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
