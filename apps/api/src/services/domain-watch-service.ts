import { randomUUID } from "crypto";

import {
  domainWatchPartialSchema,
  domainWatchFormSchema,
  mockTeams,
  type DomainFilters,
  type DomainWatch,
  type DomainWatchFormValues,
} from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import type { DomainRepository } from "@/repositories/domain-repository";
import { createHttpError } from "@/utils/http";
import type { AuditService } from "@/services/audit-service";
import type { AvailabilityEngine } from "@/services/checker/availability-engine";
import type { NotificationService } from "@/services/notifications/notification-service";
import type { OpenproviderRegistrarService } from "@/services/registrar/openprovider-registrar-service";

interface ActorMeta {
  actorName: string;
  actorRole: DomainWatch["owner"]["role"];
  ipAddress: string;
  userAgent: string;
}

export class DomainWatchService {
  private readonly locks = new Set<string>();

  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly auditService: AuditService,
    private readonly availabilityEngine: AvailabilityEngine,
    private readonly notificationService: NotificationService,
    private readonly openproviderRegistrarService: OpenproviderRegistrarService,
  ) {}

  list(filters?: DomainFilters) {
    return this.domainRepository.list(filters);
  }

  async getById(id: string) {
    const watch = await this.domainRepository.getById(id);

    if (!watch) {
      throw createHttpError(404, "Domeinmonitor niet gevonden.", "domain_not_found");
    }

    return watch;
  }

  async create(payload: DomainWatchFormValues, meta: ActorMeta) {
    const validated = domainWatchFormSchema.parse(payload);
    const now = new Date().toISOString();
    const watch: DomainWatch = {
      id: randomUUID(),
      rootName: validated.rootName,
      displayName: `${validated.rootName} monitor`,
      state: "active",
      frequency: validated.frequency,
      customSchedule: validated.customSchedule,
      actionMode: validated.actionMode,
      priority: validated.priority,
      tags: validated.tags,
      notes: validated.notes,
      owner: {
        id: validated.ownerId,
        name: meta.actorName,
        email: "owner@monitoring.internal",
        role: meta.actorRole,
      },
      team: mockTeams.find((team) => team.id === validated.teamId),
      ntfyEnabled: validated.ntfyEnabled,
      ntfyTopic: validated.ntfyTopic,
      autoRegisterEnabled: validated.autoRegisterEnabled,
      registrarLinked: true,
      lastCheckAt: undefined,
      nextCheckAt: this.computeNextRun(validated.frequency),
      createdAt: now,
      updatedAt: now,
      extensions: validated.selectedTlds.map((tld) => ({
        id: randomUUID(),
        tld,
        fqdn: `${validated.rootName}${tld}`,
        status: "unknown",
        sourceProvider: "whois-generic",
        retryCount: 0,
        autoRegisterEnabled: validated.autoRegisterEnabled,
        notifyEnabled: validated.ntfyEnabled,
      })),
    };

    await this.domainRepository.save(watch);
    await this.auditService.record({
      actor: meta.actorName,
      actorRole: meta.actorRole,
      action: "domain_watch.created",
      entityType: "DomainWatch",
      entityId: watch.id,
      summary: `Domeinmonitor aangemaakt voor ${watch.rootName}.`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return watch;
  }

  async update(id: string, payload: Partial<DomainWatchFormValues>, meta: ActorMeta) {
    const validated = domainWatchPartialSchema.parse(payload);
    const watch = await this.getById(id);
    const nextRootName = validated.rootName ?? watch.rootName;
    const extensionMap = new Map(watch.extensions.map((extension) => [extension.tld, extension]));

    watch.rootName = nextRootName;
    watch.displayName = `${nextRootName} monitor`;
    watch.frequency = validated.frequency ?? watch.frequency;
    watch.customSchedule = validated.customSchedule ?? watch.customSchedule;
    watch.actionMode = validated.actionMode ?? watch.actionMode;
    watch.priority = validated.priority ?? watch.priority;
    watch.tags = validated.tags ?? watch.tags;
    watch.notes = validated.notes ?? watch.notes;
    watch.ntfyEnabled = validated.ntfyEnabled ?? watch.ntfyEnabled;
    watch.ntfyTopic = validated.ntfyTopic ?? watch.ntfyTopic;
    watch.autoRegisterEnabled = validated.autoRegisterEnabled ?? watch.autoRegisterEnabled;
    watch.team = validated.teamId ? mockTeams.find((team) => team.id === validated.teamId) : watch.team;
    watch.updatedAt = new Date().toISOString();

    if (validated.selectedTlds) {
      watch.extensions = validated.selectedTlds.map((tld: DomainWatch["extensions"][number]["tld"]) => {
        const existing = extensionMap.get(tld);

        return {
          ...(existing ?? {
            id: randomUUID(),
            status: "unknown" as const,
            sourceProvider: "whois-generic",
            retryCount: 0,
          }),
          tld,
          fqdn: `${nextRootName}${tld}`,
          autoRegisterEnabled: watch.autoRegisterEnabled,
          notifyEnabled: watch.ntfyEnabled,
        };
      });
    } else {
      watch.extensions = watch.extensions.map((extension) => ({
        ...extension,
        fqdn: `${nextRootName}${extension.tld}`,
        autoRegisterEnabled: watch.autoRegisterEnabled,
        notifyEnabled: watch.ntfyEnabled,
      }));
    }

    await this.domainRepository.save(watch);
    await this.auditService.record({
      actor: meta.actorName,
      actorRole: meta.actorRole,
      action: "domain_watch.updated",
      entityType: "DomainWatch",
      entityId: watch.id,
      summary: `Configuratie bijgewerkt voor ${watch.rootName}.`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return watch;
  }

  async triggerManualCheck(id: string, meta: ActorMeta) {
    const lockKey = `manual-check:${id}`;

    if (this.locks.has(lockKey)) {
      throw createHttpError(409, "Deze domeinmonitor wordt al verwerkt.", "domain_locked");
    }

    this.locks.add(lockKey);

    try {
      const watch = await this.getById(id);

      if (watch.state === "paused") {
        throw createHttpError(409, "Gepauzeerde monitoren kunnen niet worden gecontroleerd.", "domain_paused");
      }

      const checkedAt = new Date().toISOString();

      for (const extension of watch.extensions) {
        const result = await this.availabilityEngine.check({
          fqdn: extension.fqdn,
          tld: extension.tld,
          currentStatus: extension.status,
        });

        extension.status = result.status;
        extension.latencyMs = result.latencyMs;
        extension.rawSummary = result.rawSummary;
        extension.sourceProvider = result.sourceProvider;
        extension.retryCount = result.retryCount;
        extension.lastCheckedAt = checkedAt;
        extension.nextCheckAt = this.computeNextRun(watch.frequency);

        await prisma.checkRun.create({
          data: {
            id: randomUUID(),
            domainWatchId: watch.id,
            domainExtensionId: extension.id,
            fqdn: extension.fqdn,
            tld: extension.tld,
            result: result.status,
            rawSummary: result.rawSummary,
            latencyMs: result.latencyMs,
            sourceProvider: result.sourceProvider,
            retryCount: result.retryCount,
            checkedAt: new Date(checkedAt),
          },
        });

        if (result.status === "available") {
          await this.auditService.record({
            actor: meta.actorName,
            actorRole: meta.actorRole,
            action: "availability.detected",
            entityType: "DomainExtension",
            entityId: extension.id,
            summary: `${extension.fqdn} gedetecteerd als beschikbaar.`,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            severity: "critical",
          });

          if (watch.actionMode !== "LOG_ONLY" && extension.notifyEnabled) {
            await this.notificationService.sendAvailabilityDetected(watch, extension);
          }

          if (watch.actionMode === "AUTO_REGISTER" && extension.autoRegisterEnabled && watch.registrarLinked) {
            const registrationResult = await this.openproviderRegistrarService.registerDomain({
              domainWatchId: watch.id,
              fqdn: extension.fqdn,
              tld: extension.tld,
              idempotencyKey: `${watch.id}:${extension.fqdn}:${checkedAt}`,
            });

            extension.registrationStatus = registrationResult.status;

            await prisma.registrationAttempt.create({
              data: {
                id: randomUUID(),
                domainWatchId: watch.id,
                domainExtensionId: extension.id,
                fqdn: extension.fqdn,
                provider: registrationResult.provider,
                status: registrationResult.status,
                initiatedAt: new Date(checkedAt),
                completedAt: registrationResult.status === "submitted" ? null : new Date(),
                errorMessage: registrationResult.status === "failed" ? registrationResult.detail : null,
                responseCode: registrationResult.responseCode,
                metadataSummary: registrationResult.metadataSummary,
                idempotencyKey: `${watch.id}:${extension.fqdn}:${checkedAt}`,
              },
            });

            await this.notificationService.sendAutoRegistrationResult(
              watch,
              extension,
              registrationResult.status === "submitted" ? "submitted" : registrationResult.status,
              registrationResult.detail,
            );
          }
        }
      }

      watch.lastCheckAt = checkedAt;
      watch.updatedAt = checkedAt;
      watch.nextCheckAt = this.computeNextRun(watch.frequency);
      await this.domainRepository.save(watch);

      await this.auditService.record({
        actor: meta.actorName,
        actorRole: meta.actorRole,
        action: "domain_watch.manual_check",
        entityType: "DomainWatch",
        entityId: watch.id,
        summary: `Handmatige check uitgevoerd voor ${watch.rootName}.`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return watch;
    } finally {
      this.locks.delete(lockKey);
    }
  }

  async setState(id: string, state: "active" | "paused", meta: ActorMeta) {
    const watch = await this.getById(id);
    watch.state = state;
    watch.updatedAt = new Date().toISOString();
    await this.domainRepository.save(watch);

    await this.auditService.record({
      actor: meta.actorName,
      actorRole: meta.actorRole,
      action: state === "paused" ? "domain_watch.paused" : "domain_watch.resumed",
      entityType: "DomainWatch",
      entityId: watch.id,
      summary: `${state === "paused" ? "Monitoring gepauzeerd" : "Monitoring hervat"} voor ${watch.rootName}.`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      severity: state === "paused" ? "warning" : "info",
    });

    return watch;
  }

  private computeNextRun(frequency: DomainWatch["frequency"]) {
    const now = Date.now();

    switch (frequency) {
      case "every_5_minutes":
        return new Date(now + 5 * 60 * 1000).toISOString();
      case "every_15_minutes":
        return new Date(now + 15 * 60 * 1000).toISOString();
      case "hourly":
        return new Date(now + 60 * 60 * 1000).toISOString();
      case "daily":
        return new Date(now + 24 * 60 * 60 * 1000).toISOString();
      case "custom":
      default:
        return new Date(now + 20 * 60 * 1000).toISOString();
    }
  }
}
