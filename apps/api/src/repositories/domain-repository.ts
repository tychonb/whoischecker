import type { Prisma } from "@prisma/client";
import type { DomainFilters, DomainWatch, SessionUser } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { mapDomainWatch } from "@/repositories/mappers";
import { domainWatchScope } from "@/utils/authorization-scope";

const domainWatchInclude = {
  owner: {
    include: {
      role: true,
      team: true,
    },
  },
  team: true,
  extensions: {
    orderBy: {
      fqdn: "asc",
    },
  },
} as const;

export class DomainRepository {
  async list(filters: DomainFilters | undefined, user: SessionUser) {
    const records = await prisma.domainWatch.findMany({
      where: {
        ...domainWatchScope(user),
        ...(filters?.state && filters.state !== "all" ? { state: filters.state } : {}),
        ...(filters?.autoRegisterEnabled && filters.autoRegisterEnabled !== "all"
          ? { autoRegisterEnabled: filters.autoRegisterEnabled === "enabled" }
          : {}),
        ...(filters?.ownerId && filters.ownerId !== "all" ? { ownerId: filters.ownerId } : {}),
        ...(filters?.tag && filters.tag !== "all"
          ? {
              tags: {
                array_contains: [filters.tag],
              },
            }
          : {}),
        ...(filters?.tld && filters.tld !== "all"
          ? {
              extensions: {
                some: {
                  tld: filters.tld,
                },
              },
            }
          : {}),
      },
      include: domainWatchInclude,
      orderBy: [{ priority: "desc" }, { rootName: "asc" }],
    });

    return records.map(mapDomainWatch);
  }

  async getById(id: string, user?: SessionUser) {
    const record = await prisma.domainWatch.findFirst({
      where: { id, ...(user ? domainWatchScope(user) : {}) },
      include: domainWatchInclude,
    });

    return record ? mapDomainWatch(record) : null;
  }

  async listForScheduling() {
    return prisma.domainWatch.findMany({
      select: {
        id: true,
        frequency: true,
        customSchedule: true,
      },
    });
  }

  async save(watch: DomainWatch) {
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.domainWatch.upsert({
        where: { id: watch.id },
        update: {
          rootName: watch.rootName,
          displayName: watch.displayName,
          state: watch.state,
          frequency: watch.frequency,
          customSchedule: watch.customSchedule ?? null,
          actionMode: watch.actionMode,
          priority: watch.priority,
          tags: watch.tags,
          notes: watch.notes ?? null,
          ntfyEnabled: watch.ntfyEnabled,
          ntfyTopic: watch.ntfyTopic ?? null,
          autoRegisterEnabled: watch.autoRegisterEnabled,
          registrarLinked: watch.registrarLinked,
          lastCheckAt: watch.lastCheckAt ? new Date(watch.lastCheckAt) : null,
          nextCheckAt: new Date(watch.nextCheckAt),
          ownerId: watch.owner.id,
          teamId: watch.team?.id ?? null,
        },
        create: {
          id: watch.id,
          rootName: watch.rootName,
          displayName: watch.displayName,
          state: watch.state,
          frequency: watch.frequency,
          customSchedule: watch.customSchedule ?? null,
          actionMode: watch.actionMode,
          priority: watch.priority,
          tags: watch.tags,
          notes: watch.notes ?? null,
          ntfyEnabled: watch.ntfyEnabled,
          ntfyTopic: watch.ntfyTopic ?? null,
          autoRegisterEnabled: watch.autoRegisterEnabled,
          registrarLinked: watch.registrarLinked,
          lastCheckAt: watch.lastCheckAt ? new Date(watch.lastCheckAt) : null,
          nextCheckAt: new Date(watch.nextCheckAt),
          ownerId: watch.owner.id,
          teamId: watch.team?.id ?? null,
          createdAt: new Date(watch.createdAt),
          updatedAt: new Date(watch.updatedAt),
        },
      });

      await transaction.domainExtension.deleteMany({
        where: {
          domainWatchId: watch.id,
          tld: {
            notIn: watch.extensions.map((extension) => extension.tld),
          },
        },
      });

      for (const extension of watch.extensions) {
        await transaction.domainExtension.upsert({
          where: { id: extension.id },
          update: {
            domainWatchId: watch.id,
            tld: extension.tld,
            fqdn: extension.fqdn,
            status: extension.status,
            lastCheckedAt: extension.lastCheckedAt ? new Date(extension.lastCheckedAt) : null,
            nextCheckAt: extension.nextCheckAt ? new Date(extension.nextCheckAt) : null,
            latencyMs: extension.latencyMs ?? null,
            rawSummary: extension.rawSummary ?? null,
            sourceProvider: extension.sourceProvider,
            retryCount: extension.retryCount,
            autoRegisterEnabled: extension.autoRegisterEnabled,
            notifyEnabled: extension.notifyEnabled,
            registrationStatus: extension.registrationStatus ?? null,
          },
          create: {
            id: extension.id,
            domainWatchId: watch.id,
            tld: extension.tld,
            fqdn: extension.fqdn,
            status: extension.status,
            lastCheckedAt: extension.lastCheckedAt ? new Date(extension.lastCheckedAt) : null,
            nextCheckAt: extension.nextCheckAt ? new Date(extension.nextCheckAt) : null,
            latencyMs: extension.latencyMs ?? null,
            rawSummary: extension.rawSummary ?? null,
            sourceProvider: extension.sourceProvider,
            retryCount: extension.retryCount,
            autoRegisterEnabled: extension.autoRegisterEnabled,
            notifyEnabled: extension.notifyEnabled,
            registrationStatus: extension.registrationStatus ?? null,
          },
        });
      }
    });

    return this.getById(watch.id);
  }
}
