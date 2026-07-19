import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface BimJobPayload {
  processingJobId: string;
  bimModelId: string;
  tenantId: string;
}

@Injectable()
export class BimQueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queue: Queue<BimJobPayload>;

  constructor(config: ConfigService) {
    this.connection = new IORedis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<BimJobPayload>("r4c-bim-processing", {
      connection: this.connection,
    });
  }

  enqueue(payload: BimJobPayload) {
    return this.queue.add("process-ifc", payload, {
      jobId: payload.processingJobId,
      attempts: 3,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
