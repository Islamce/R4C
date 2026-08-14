import { Module } from "@nestjs/common";
import { CommercialController } from "./commercial.controller";
import { CommercialExpiryProcessor } from "./commercial-expiry.processor";
import { CommercialService } from "./commercial.service";

@Module({
  controllers: [CommercialController],
  providers: [CommercialService, CommercialExpiryProcessor],
})
export class CommercialModule {}
