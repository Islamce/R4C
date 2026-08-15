import assert from "node:assert/strict";
import test from "node:test";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { startApi } from "./c03-helpers.mjs";

const port = Number(process.env.BIM_DISABLED_E2E_API_PORT ?? 4115);

test("API starts without BIM credentials when frozen Development Intelligence is disabled while C04 expiry remains active", { timeout: 60_000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");

  const api = await startApi(t, port, {
    environment: { BIM_ENABLED: "false", PORT: String(port) },
    removeEnvironment: ["API_PORT", "BIM_WORKER_URL", "BIM_WORKER_TOKEN"],
  });

  const readiness = await api.request("/health/ready");
  assert.equal(readiness.response.status, 200, api.logs());

  const bimRoute = await api.request("/bim-models/not-present-when-disabled");
  assert.equal(bimRoute.response.status, 404, api.logs());

  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue("r4c-commercial-hold-expiry", { connection });
  t.after(async () => {
    await queue.close();
    await connection.quit();
  });
  const scheduler = await queue.getJobScheduler("hold-expiry-sweep");
  assert.ok(scheduler, "C04 Hold-expiry scheduler must remain registered when BIM is disabled");
});
