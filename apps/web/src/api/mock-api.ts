import type {
  AppSettings,
  AuditLog,
  DomainWatchFormValues,
  DashboardMetrics,
  DomainFilters,
  DomainWatch,
  NotificationSettingsValues,
  OpenproviderSettingsValues,
  RegistrationAttempt,
  SessionUser,
} from "@whoischecker/shared";
import {
  openproviderSettingsSchema,
  domainWatchFormSchema,
  mockAuditLogs,
  mockDashboardMetrics,
  mockDomainWatches,
  mockTeams,
  mockRegistrationAttempts,
  mockSessionUser,
  mockSettings,
  notificationSettingsSchema,
} from "@whoischecker/shared";

const domainStore = structuredClone(mockDomainWatches) as DomainWatch[];
const auditStore = structuredClone(mockAuditLogs) as AuditLog[];
let settingsStore = structuredClone(mockSettings) as AppSettings;

const credentials = {
  email: "eva@monitoring.internal",
  password: "ChangeMe!123",
};

function delay<T>(value: T, timeout = 180) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), timeout);
  });
}

function withAudit(summary: string, entityId: string, action: string) {
  auditStore.unshift({
    id: `audit-${auditStore.length + 1}`,
    actor: mockSessionUser.name,
    actorRole: mockSessionUser.role,
    action,
    entityType: "DomainWatch",
    entityId,
    summary,
    ipAddress: "203.0.113.10",
    userAgent: "Mock SPA Session",
    severity: "info",
    timestamp: new Date().toISOString(),
    result: "success",
  });
}

export const mockApi = {
  async login(email: string, password: string) {
    if (email !== credentials.email || password !== credentials.password) {
      throw new Error("Ongeldige demo-inlog. Gebruik eva@monitoring.internal / ChangeMe!123.");
    }

    return delay({
      user: mockSessionUser,
      csrfToken: "mock-csrf-token",
    });
  },

  async logout() {
    return delay(true, 80);
  },

  async getSession() {
    return delay<SessionUser | null>(mockSessionUser, 100);
  },

  async getDashboardMetrics() {
    const freshMetrics: DashboardMetrics = {
      ...mockDashboardMetrics,
      recentAvailableDomains: domainStore.flatMap((watch) =>
        watch.extensions.filter((extension) => extension.status === "available"),
      ),
    };

    return delay(freshMetrics);
  },

  async listDomainWatches(filters?: DomainFilters) {
    const filtered = domainStore.filter((watch) => {
      if (filters?.state && filters.state !== "all" && watch.state !== filters.state) {
        return false;
      }

      if (filters?.autoRegisterEnabled === "enabled" && !watch.autoRegisterEnabled) {
        return false;
      }

      if (filters?.autoRegisterEnabled === "disabled" && watch.autoRegisterEnabled) {
        return false;
      }

      if (filters?.tld && filters.tld !== "all" && !watch.extensions.some((extension) => extension.tld === filters.tld)) {
        return false;
      }

      if (filters?.ownerId && filters.ownerId !== "all" && watch.owner.id !== filters.ownerId) {
        return false;
      }

      if (filters?.tag && filters.tag !== "all" && !watch.tags.includes(filters.tag)) {
        return false;
      }

      return true;
    });

    return delay(filtered);
  },

  async getDomainWatch(id: string) {
    const watch = domainStore.find((item) => item.id === id);

    if (!watch) {
      throw new Error("Domeinmonitor niet gevonden.");
    }

    return delay(watch);
  },

  async createDomainWatch(payload: DomainWatchFormValues) {
    const validated = domainWatchFormSchema.parse(payload);
    const now = new Date().toISOString();
    const watch: DomainWatch = {
      id: `dw-${domainStore.length + 1}`,
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
        name: mockSessionUser.name,
        email: mockSessionUser.email,
        role: mockSessionUser.role,
        teamId: validated.teamId,
      },
      team: mockTeams.find((team) => team.id === validated.teamId),
      ntfyEnabled: validated.ntfyEnabled,
      ntfyTopic: validated.ntfyTopic,
      autoRegisterEnabled: validated.autoRegisterEnabled,
      registrarLinked: true,
      lastCheckAt: undefined,
      nextCheckAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
      extensions: validated.selectedTlds.map((tld, index) => ({
        id: `ext-new-${domainStore.length + 1}-${index + 1}`,
        tld,
        fqdn: `${validated.rootName}${tld}`,
        status: "unknown",
        sourceProvider: "mock-whois",
        retryCount: 0,
        autoRegisterEnabled: validated.autoRegisterEnabled,
        notifyEnabled: validated.ntfyEnabled,
      })),
    };

    domainStore.unshift(watch);
    withAudit(`Nieuwe monitor aangemaakt voor ${watch.rootName}.`, watch.id, "domain_watch.created");

    return delay(watch, 300);
  },

  async triggerManualCheck(id: string) {
    const watch = domainStore.find((item) => item.id === id);

    if (!watch) {
      throw new Error("Domeinmonitor niet gevonden.");
    }

    const checkedAt = new Date().toISOString();
    watch.lastCheckAt = checkedAt;
    watch.updatedAt = checkedAt;
    watch.nextCheckAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    watch.extensions = watch.extensions.map((extension) => ({
      ...extension,
      lastCheckedAt: checkedAt,
      nextCheckAt: watch.nextCheckAt,
      latencyMs: Math.max(80, Math.round((extension.latencyMs ?? 120) * 0.95)),
    }));

    withAudit(`Handmatige check gestart voor ${watch.rootName}.`, watch.id, "domain_watch.manual_check");

    return delay(watch, 350);
  },

  async toggleDomainState(id: string, state: "active" | "paused") {
    const watch = domainStore.find((item) => item.id === id);

    if (!watch) {
      throw new Error("Domeinmonitor niet gevonden.");
    }

    watch.state = state;
    watch.updatedAt = new Date().toISOString();
    withAudit(
      state === "paused"
        ? `Monitoring gepauzeerd voor ${watch.rootName}.`
        : `Monitoring hervat voor ${watch.rootName}.`,
      watch.id,
      state === "paused" ? "domain_watch.paused" : "domain_watch.resumed",
    );

    return delay(watch, 220);
  },

  async saveDomainWatch(id: string, payload: Partial<DomainWatchFormValues>) {
    const watch = domainStore.find((item) => item.id === id);

    if (!watch) {
      throw new Error("Domeinmonitor niet gevonden.");
    }

    const nextRootName = payload.rootName ?? watch.rootName;
    const extensionMap = new Map(watch.extensions.map((extension) => [extension.tld, extension]));

    if (payload.selectedTlds) {
      watch.extensions = payload.selectedTlds.map((tld, index) => {
        const existing = extensionMap.get(tld);

        if (existing) {
          return {
            ...existing,
            fqdn: `${nextRootName}${tld}`,
          };
        }

        return {
          id: `ext-generated-${index + 1}-${tld}`,
          tld,
          fqdn: `${nextRootName}${tld}`,
          status: "unknown",
          nextCheckAt: watch.nextCheckAt,
          sourceProvider: "mock-whois",
          retryCount: 0,
          autoRegisterEnabled: payload.autoRegisterEnabled ?? watch.autoRegisterEnabled,
          notifyEnabled: payload.ntfyEnabled ?? watch.ntfyEnabled,
        };
      });
    } else {
      watch.extensions = watch.extensions.map((extension) => ({
        ...extension,
        fqdn: `${nextRootName}${extension.tld}`,
      }));
    }

    watch.rootName = nextRootName;
    watch.displayName = `${nextRootName} monitor`;
    watch.frequency = payload.frequency ?? watch.frequency;
    watch.customSchedule = payload.customSchedule ?? watch.customSchedule;
    watch.actionMode = payload.actionMode ?? watch.actionMode;
    watch.priority = payload.priority ?? watch.priority;
    watch.tags = payload.tags ?? watch.tags;
    watch.notes = payload.notes ?? watch.notes;
    watch.ntfyEnabled = payload.ntfyEnabled ?? watch.ntfyEnabled;
    watch.ntfyTopic = payload.ntfyTopic ?? watch.ntfyTopic;
    watch.autoRegisterEnabled = payload.autoRegisterEnabled ?? watch.autoRegisterEnabled;
    watch.team = payload.teamId ? mockTeams.find((team) => team.id === payload.teamId) : watch.team;
    watch.updatedAt = new Date().toISOString();

    withAudit(`Configuratie bijgewerkt voor ${watch.rootName}.`, watch.id, "domain_watch.updated");

    return delay(watch, 260);
  },

  async getSettings() {
    return delay(settingsStore);
  },

  async updateNotificationSettings(payload: NotificationSettingsValues) {
    notificationSettingsSchema.parse(payload);

    settingsStore = {
      ...settingsStore,
      notifications: {
        ntfy: {
          enabled: payload.ntfyEnabled,
          serverUrl: payload.ntfyServerUrl,
          topic: payload.ntfyTopic,
          authTokenConfigured: Boolean(payload.ntfyAuthToken),
          customHeadersConfigured: false,
        },
        webhookEnabled: payload.webhookEnabled,
        webhookUrl: payload.webhookUrl || undefined,
        emailEnabled: payload.emailEnabled,
      },
    };

    return delay(settingsStore.notifications, 280);
  },

  async updateOpenproviderSettings(payload: OpenproviderSettingsValues) {
    openproviderSettingsSchema.parse(payload);

    settingsStore = {
      ...settingsStore,
      openprovider: {
        enabled: payload.enabled,
        usernameConfigured: true,
        passwordConfigured: true,
        ownerHandle: payload.ownerHandle,
        adminHandle: payload.adminHandle,
        techHandle: payload.techHandle,
        billingHandle: payload.billingHandle,
        nsGroup: payload.nsGroup,
        defaultRegistrar: "Openprovider",
        testMode: payload.testMode,
      },
    };

    return delay(settingsStore.openprovider, 280);
  },

  async sendTestNotification() {
    return delay(
      {
        status: "sent",
        message: "Testbericht verstuurd naar het actieve ntfy-topic.",
      },
      500,
    );
  },

  async testOpenprovider() {
    return delay(
      {
        ok: true,
        detail: "Openprovider-testverbinding geslaagd.",
        metadataSummary: "Mockmodus: reseller-authenticatie en registratieprofiel zijn als geldig gemarkeerd.",
        responseCode: "OP-MOCK-VALID",
      },
      500,
    );
  },

  async listAuditLogs() {
    return delay(auditStore);
  },

  async listRegistrationAttempts() {
    return delay<RegistrationAttempt[]>(structuredClone(mockRegistrationAttempts));
  },
};
