import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "@/config/env";

let connection: IORedis | null = null;
let queueRegistry:
  | {
      domainChecks: Queue;
      registrations: Queue;
      notifications: Queue;
    }
  | null = null;

export function getQueueConnection() {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  return connection;
}

export function getQueues() {
  if (!queueRegistry) {
    const liveConnection = getQueueConnection();
    queueRegistry = {
      domainChecks: new Queue("domain-checks", { connection: liveConnection }),
      registrations: new Queue("registration-attempts", { connection: liveConnection }),
      notifications: new Queue("notifications", { connection: liveConnection }),
    };
  }

  return queueRegistry;
}
