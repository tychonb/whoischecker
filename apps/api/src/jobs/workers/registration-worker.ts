import { Worker } from "bullmq";

import type { SupportedTld } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { openproviderRegistrarService } from "@/services/container";
import { getQueueConnection } from "@/jobs/queues";

function inferTld(fqdn: string): SupportedTld {
  if (fqdn.endsWith(".co.uk")) {
    return ".co.uk";
  }

  return `.${fqdn.split(".").pop()}` as SupportedTld;
}

export function createRegistrationWorker() {
  return new Worker(
    "registration-attempts",
    async (job: { data: { registrationAttemptId: string } }) => {
      const attempt = await prisma.registrationAttempt.findUnique({
        where: { id: job.data.registrationAttemptId },
      });

      if (!attempt) {
        return;
      }

      const claim = await prisma.registrationAttempt.updateMany({
        where: { id: attempt.id, status: "pending" },
        data: { status: "submitted" },
      });

      if (claim.count === 0) {
        return;
      }

      const result = await openproviderRegistrarService.registerDomain({
        domainWatchId: attempt.domainWatchId,
        fqdn: attempt.fqdn,
        tld: inferTld(attempt.fqdn),
        idempotencyKey: attempt.idempotencyKey,
      });

      await prisma.registrationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: result.status,
          errorMessage: result.status === "failed" ? result.detail : null,
          completedAt: result.status === "submitted" ? null : new Date(),
          responseCode: result.responseCode,
          metadataSummary: result.metadataSummary,
        },
      });
    },
    {
      connection: getQueueConnection(),
      concurrency: 3,
    },
  );
}
