import { Module } from "@nestjs/common";
import { BimController } from "./bim.controller";
import { BimProcessor } from "./bim.processor";
import { BimQueueService } from "./bim-queue.service";
import { BimService } from "./bim.service";

@Module({
  controllers: [BimController],
  providers: [BimService, BimQueueService, BimProcessor],
})
export class BimModule {}
