import { prisma } from "@/lib/prisma";
import { getQueues } from "@/jobs/queues";

function repeatOptionsForFrequency(
  frequency: "every_5_minutes" | "every_15_minutes" | "hourly" | "daily" | "custom",
  customSchedule?: string,
) {
  switch (frequency) {
    case "every_5_minutes":
      return { every: 5 * 60 * 1000 };
    case "every_15_minutes":
      return { every: 15 * 60 * 1000 };
    case "hourly":
      return { every: 60 * 60 * 1000 };
    case "daily":
      return { every: 24 * 60 * 60 * 1000 };
    case "custom":
      return customSchedule ? { pattern: customSchedule } : undefined;
    default:
      return undefined;
  }
}

export async function scheduleDomainChecks() {
  const queues = getQueues();
  const watches = await prisma.domainWatch.findMany({
    where: {
      state: "active",
    },
    select: {
      id: true,
      frequency: true,
      customSchedule: true,
    },
  });

  await Promise.all(
    watches.map((watch: (typeof watches)[number]) =>
      queues.domainChecks.add(
        `check:${watch.id}`,
        {
          domainWatchId: watch.id,
        },
        {
          jobId: `check:${watch.id}`,
          repeat: repeatOptionsForFrequency(watch.frequency, watch.customSchedule),
        },
      ),
    ),
  );
}
