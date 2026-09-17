import { Worker } from "bullmq";

import { domainWatchService } from "@/services/container";
import { getQueueConnection } from "@/jobs/queues";

export function createCheckWorker() {
  return new Worker(
    "domain-checks",
    async (job: { data: { domainWatchId: string } }) => {
      await domainWatchService.triggerManualCheck(job.data.domainWatchId, {
        actorName: "Systeemworker",
        actorRole: "OPERATOR",
        ipAddress: "10.0.0.22",
        userAgent: "bullmq/check-worker",
        system: true,
      });
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
    },
  );
}
