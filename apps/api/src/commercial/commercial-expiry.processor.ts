import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { CommercialService } from "./commercial.service";

type HoldExpiryJobName = "expire-holds";
type HoldExpiryJobPayload = Record<string, never>;

/**
 * Runs one configured recurring expiry sweep. HOLD_EXPIRY_SWEEP_INTERVAL_MS is
 * intentionally required: no duration or sweep cadence is implied by code.
 *
 * Redis/BullMQ failures must not take down the API process. When Redis is
 * unavailable (quota, network, auth), the sweep is skipped and logged so the
 * rest of r4c-api can keep serving traffic.
 */
@Injectable()
export class CommercialExpiryProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommercialExpiryProcessor.name);
  private readonly intervalMs: number;
  private readonly redisUrl: string;
  private connection?: IORedis;
  private queue?: Queue<HoldExpiryJobPayload, unknown, string>;
  private worker?: Worker<HoldExpiryJobPayload, unknown, HoldExpiryJobName>;
  private active = false;

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
    this.redisUrl = config.getOrThrow<string>("REDIS_URL");
  }

  async onModuleInit() {
    try {
      this.connection = new IORedis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
      this.connection.on("error", (err) => {
        this.logger.warn(`Redis connection error (hold-expiry): ${err.message}`);
      });
      await this.connection.connect();

      this.queue = new Queue<HoldExpiryJobPayload, unknown, string>("r4c-commercial-hold-expiry", {
        connection: this.connection,
      });
      this.worker = new Worker<HoldExpiryJobPayload, unknown, HoldExpiryJobName>(
        "r4c-commercial-hold-expiry",
        async () => this.commercial.expireHolds(),
        { connection: this.connection },
      );
      this.worker.on("error", (err) => {
        this.logger.warn(`Hold-expiry worker error: ${err.message}`);
      });

      await this.queue.upsertJobScheduler(
        "hold-expiry-sweep",
        { every: this.intervalMs },
        { name: "expire-holds", data: {} },
      );
      this.active = true;
      this.logger.log(`Hold-expiry sweep scheduled every ${this.intervalMs}ms`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Hold-expiry sweep disabled — Redis unavailable (${message}). API will continue without automatic hold expiry.`,
      );
      await this.safeShutdown();
    }
  }

  async onModuleDestroy() {
    await this.safeShutdown();
  }

  private async safeShutdown() {
    this.active = false;
    try {
      await this.worker?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.queue?.close();
    } catch {
      /* ignore */
    }
    try {
      this.connection?.removeAllListeners();
      this.connection?.disconnect();
    } catch {
      /* ignore */
    }
    this.worker = undefined;
    this.queue = undefined;
    this.connection = undefined;
  }
}
