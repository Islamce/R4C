import { Module } from "@nestjs/common";
import { TurnoverController } from "./turnover.controller";
import { TurnoverService } from "./turnover.service";

@Module({
  controllers: [TurnoverController],
  providers: [TurnoverService],
})
export class TurnoverModule {}
