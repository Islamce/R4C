import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { CommercialService } from "./commercial.service";

type HoldExpiryJobName = "expire-holds";
type HoldExpiryJobPayload = Record<string, never>;

/**
 * Runs one configured recurring expiry sweep. HOLD_EXPIRY_SWEEP_INTERVAL_MS is
 * intentionally required: no duration or sweep cadence is implied by code.
 */
@Injectable()
export class CommercialExpiryProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queue: Queue<HoldExpiryJobPayload, unknown, string>;
  private readonly intervalMs: number;
  private worker?: Worker<HoldExpiryJobPayload, unknown, HoldExpiryJobName>;

  constructor(
    config: ConfigService,
    private readonly commercial: CommercialService,
  ) {
    const configuredInterval = config.getOrThrow<string>("HOLD_EXPIRY_SWEEP_INTERVAL_MS");
    const intervalMs = Number(configuredInterval);
    if (!Number.isSafeInteger(intervalMs) || intervalMs < 1_000) {
      throw new Error("HOLD_EXPIRY_SWEEP_INTERVAL_MS must be an integer of at least 1000 milliseconds");
    }
    this.intervalMs = intervalMs;
    this.connection = new IORedis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<HoldExpiryJobPayload, unknown, string>("r4c-commercial-hold-expiry", {
      connection: this.connection,
    });
  }

  async onModuleInit() {
    this.worker = new Worker<HoldExpiryJobPayload, unknown, HoldExpiryJobName>(
      "r4c-commercial-hold-expiry",
      async () => this.commercial.expireHolds(),
      { connection: this.connection },
    );
    await this.queue.upsertJobScheduler(
      "hold-expiry-sweep",
      { every: this.intervalMs },
      { name: "expire-holds", data: {} },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
