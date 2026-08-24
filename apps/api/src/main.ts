import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { trustProxyHops } from "./common/rate-limit";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const express = app.getHttpAdapter().getInstance() as {
    set(setting: string, value: unknown): void;
  };
  express.set("trust proxy", trustProxyHops());
  express.set("json replacer", (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value,
  );

  app.setGlobalPrefix("api/v1");
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
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
