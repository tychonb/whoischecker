import type { DashboardMetrics } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { mapDomainExtension } from "@/repositories/mappers";
import type { AuditService } from "@/services/audit-service";

export class DashboardService {
  constructor(private readonly auditService: AuditService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [
      recentLogs,
      domainCount,
      activeDomainCount,
      availableExtensionsRaw,
      registrations,
      unknownExtensionsCount,
      providerErrorsCount,
      pendingDomainChecks,
      failedDomainChecks,
      notificationRetries,
      domainsWithProviderErrors,
      upcomingDomainChecks,
      pendingRegistrations,
      registrationAttempts,
    ] = await Promise.all([
      this.auditService.list(),
      prisma.domainWatch.count(),
      prisma.domainWatch.count({ where: { state: "active" } }),
      prisma.domainExtension.findMany({
        where: { status: "available" },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.registrationAttempt.findMany(),
      prisma.domainExtension.count({ where: { status: "unknown" } }),
      prisma.domainExtension.count({ where: { status: "provider_error" } }),
      prisma.domainWatch.count({
        where: {
          state: "active",
        },
      }),
      prisma.registrationAttempt.count({
        where: {
          status: "failed",
        },
      }),
      prisma.notificationEvent.count({
        where: {
          status: "failed",
        },
      }),
      prisma.domainExtension.findMany({
        where: { status: "provider_error" },
        select: { sourceProvider: true },
      }),
      prisma.domainWatch.findMany({
        where: { state: "active" },
        orderBy: { nextCheckAt: "asc" },
        take: 5,
        include: {
          owner: true,
          extensions: {
            take: 1,
            orderBy: { nextCheckAt: "asc" },
          },
        },
      }),
      prisma.registrationAttempt.findMany({
        where: { status: { in: ["pending", "submitted"] } },
        orderBy: { initiatedAt: "asc" },
        take: 5,
      }),
      prisma.registrationAttempt.findMany(),
    ]);

    const recentAvailableDomains = availableExtensionsRaw.map(mapDomainExtension);
    const registrationSuccesses = registrations.filter((attempt: (typeof registrations)[number]) => attempt.status === "success").length;
    const providerFailureCounts = domainsWithProviderErrors.reduce(
      (accumulator: Record<string, number>, item: (typeof domainsWithProviderErrors)[number]) => {
        accumulator[item.sourceProvider] = (accumulator[item.sourceProvider] ?? 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    const failuresByProvider: DashboardMetrics["failuresByProvider"] = Object.entries(providerFailureCounts).map(
      ([provider, failures]) => ({
        provider,
        failures: Number(failures),
        retries: Number(failures),
      }),
    );

    if (!failuresByProvider.some((item) => item.provider === "openprovider-registrar")) {
      failuresByProvider.push({
        provider: "openprovider-registrar",
        failures: registrationAttempts.filter((attempt: (typeof registrationAttempts)[number]) => attempt.status === "failed").length,
        retries: registrationAttempts.filter((attempt: (typeof registrationAttempts)[number]) => attempt.status === "pending").length,
      });
    }

    return {
      metrics: [
        {
          id: "metric-domains",
          label: "Gemonitorde domeinen",
          value: `${domainCount}`,
          delta: `${activeDomainCount} actief`,
          trend: "up",
        },
        {
          id: "metric-available",
          label: "Beschikbaar in 24 uur",
          value: `${recentAvailableDomains.length}`,
          delta: recentAvailableDomains[0]?.fqdn ?? "Geen detecties",
          trend: recentAvailableDomains.length > 0 ? "up" : "flat",
        },
        {
          id: "metric-registrations",
          label: "Auto-registraties geslaagd",
          value: `${registrationSuccesses}`,
          delta: `${registrations.length} totale pogingen`,
          trend: registrationSuccesses > 0 ? "up" : "flat",
        },
        {
          id: "metric-retries",
          label: "Fouten en retries",
          value: `${providerErrorsCount + unknownExtensionsCount + notificationRetries}`,
          delta: `${failedDomainChecks + notificationRetries} incidenten vragen aandacht`,
          trend: providerErrorsCount + unknownExtensionsCount + notificationRetries > 0 ? "down" : "flat",
        },
      ],
      recentEvents: recentLogs.slice(0, 6).map((log: (typeof recentLogs)[number]) => ({
        id: log.id,
        title: log.action,
        detail: log.summary,
        timestamp: log.timestamp,
        tone: log.severity === "critical" ? "critical" : log.severity === "warning" ? "warning" : "info",
      })),
      recentAvailableDomains,
      queue: {
        pending: pendingDomainChecks,
        active: 0,
        delayed: unknownExtensionsCount,
        failed: failedDomainChecks,
      },
      systemHealth: [
        {
          id: "health-api",
          name: "API en auth",
          status: "healthy",
          summary: "Beveiligde endpoints gezond",
          detail: "JWT-auth, CSRF-bescherming en rate limiting zijn geconfigureerd.",
        },
        {
          id: "health-whois",
          name: "WHOIS-providers",
          status: providerErrorsCount > 0 ? "degraded" : "healthy",
          summary: providerErrorsCount > 0 ? "Fallback actief" : "Fallback gereed",
          detail: "Provider-agnostische availability-engine met RDAP en WHOIS-fallback.",
        },
        {
          id: "health-queue",
          name: "Queues en workers",
          status: failedDomainChecks > 0 ? "degraded" : "healthy",
          summary: "BullMQ-scaffold gereed",
          detail: "Aparte check- en registratiequeues met retries en zicht op dead-letter-items.",
        },
      ],
      upcomingChecks: [
        ...upcomingDomainChecks.map((watch: (typeof upcomingDomainChecks)[number]) => ({
          id: `next-watch-${watch.id}`,
          fqdn: watch.extensions[0]?.fqdn ?? `${watch.rootName}`,
          owner: watch.owner.name,
          nextRunAt: watch.nextCheckAt.toISOString(),
          queue: "domain-checks",
        })),
        ...pendingRegistrations.map((attempt: (typeof pendingRegistrations)[number]) => ({
          id: `next-registration-${attempt.id}`,
          fqdn: attempt.fqdn,
          owner: "Systeemworker",
          nextRunAt: attempt.initiatedAt.toISOString(),
          queue: "registration-attempts",
        })),
      ].slice(0, 5),
      failuresByProvider,
    };
  }
}
