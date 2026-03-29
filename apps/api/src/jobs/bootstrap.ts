import { createCheckWorker } from "@/jobs/workers/check-worker";
import { createRegistrationWorker } from "@/jobs/workers/registration-worker";
import { scheduleDomainChecks } from "@/jobs/scheduler";

export async function startJobInfrastructure() {
  await scheduleDomainChecks();
  const checkWorker = createCheckWorker();
  const registrationWorker = createRegistrationWorker();

  return {
    checkWorker,
    registrationWorker,
  };
}
