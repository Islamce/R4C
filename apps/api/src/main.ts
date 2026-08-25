import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { trustProxyHops } from "./common/rate-limit";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const express = app.getHttpAdapter().getInstance() as {
    set(setting: string, value: number): void;
  };
  express.set("trust proxy", trustProxyHops());

  app.setGlobalPrefix("api/v1");
  const configuredCorsOrigins = process.env.CORS_ORIGINS;
  if (!configuredCorsOrigins && process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS is required in production");
  }
  const corsOrigins = (configuredCorsOrigins ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(Number(process.env.API_PORT ?? process.env.PORT ?? 4000), "0.0.0.0");
}

void bootstrap();
