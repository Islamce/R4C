import { Module } from "@nestjs/common";
import { CommercialController } from "./commercial.controller";
import { CommercialExpiryProcessor } from "./commercial-expiry.processor";
import { CommercialService } from "./commercial.service";
import { PublicCommercialController } from "./public-commercial.controller";
import { PublicCommercialService } from "./public-commercial.service";

@Module({
  controllers: [CommercialController, PublicCommercialController],
  providers: [CommercialService, CommercialExpiryProcessor, PublicCommercialService],
})
export class CommercialModule {}
