import { Module } from "@nestjs/common";
import { CommercialController } from "./commercial.controller";
import { CommercialExpiryProcessor } from "./commercial-expiry.processor";
import { CommercialService } from "./commercial.service";
import { CommercialAggregationService } from "./commercial-aggregation.service";

@Module({
  controllers: [CommercialController],
  providers: [CommercialService, CommercialAggregationService, CommercialExpiryProcessor],
})
export class CommercialModule {}
