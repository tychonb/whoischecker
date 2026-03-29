import type {
  AppSettings,
  AuditLog,
  CheckRun,
  DomainWatch,
  JobExecution,
  NotificationEvent,
  RegistrationAttempt,
  SessionUser,
} from "@whoischecker/shared";
import {
  mockAuditLogs,
  mockCheckRuns,
  mockDomainWatches,
  mockNotificationEvents,
  mockRegistrationAttempts,
  mockSettings,
  mockSessionUser,
} from "@whoischecker/shared";

import { encryptSecret, hashPassword } from "@/utils/crypto";

export interface StoredUser extends SessionUser {
  passwordHash: string;
  ntfyServerUrl: string;
  ntfyTopic: string;
  ntfyTokenEncrypted?: string;
}

export interface ProviderCredentialRecord {
  id: string;
  provider: "openprovider";
  usernameEncrypted: string;
  passwordEncrypted: string;
  createdAt: string;
  updatedAt: string;
}

export interface InMemoryDatabase {
  users: StoredUser[];
  domains: DomainWatch[];
  auditLogs: AuditLog[];
  checkRuns: CheckRun[];
  registrations: RegistrationAttempt[];
  notifications: NotificationEvent[];
  settings: AppSettings;
  jobs: JobExecution[];
  providerCredentials: ProviderCredentialRecord[];
}

function buildUsers(): StoredUser[] {
  return [
    {
      ...mockSessionUser,
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "platform-domain-monitoring",
      ntfyTokenEncrypted: encryptSecret("demo-ntfy-token"),
    },
    {
      id: "user-2",
      name: "Joris Meijer",
      email: "joris@monitoring.internal",
      role: "SECURITY_ANALYST",
      teamId: "team-1",
      ntfyEnabled: true,
      lastLoginAt: "2026-03-28T10:15:00.000Z",
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "security-analyst-domain-monitoring",
    },
    {
      id: "user-3",
      name: "Nina Vos",
      email: "nina@monitoring.internal",
      role: "OPERATOR",
      teamId: "team-2",
      ntfyEnabled: false,
      lastLoginAt: "2026-03-27T07:30:00.000Z",
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "corporate-it-domain-monitoring",
    },
  ];
}

function buildJobs(): JobExecution[] {
  return [
    {
      id: "job-1",
      queue: "domain-checks",
      jobName: "northgrid.com",
      status: "queued",
      attemptsMade: 0,
      maxAttempts: 5,
      nextRunAt: "2026-03-29T17:00:00.000Z",
    },
    {
      id: "job-2",
      queue: "domain-checks",
      jobName: "acmesecure.de",
      status: "retrying",
      attemptsMade: 3,
      maxAttempts: 5,
      nextRunAt: "2026-03-29T17:00:00.000Z",
      lastError: "denic-gateway timeout",
    },
    {
      id: "job-3",
      queue: "registration-attempts",
      jobName: "northgrid.io",
      status: "queued",
      attemptsMade: 0,
      maxAttempts: 3,
      nextRunAt: "2026-03-29T17:02:00.000Z",
    },
  ];
}

export const db: InMemoryDatabase = {
  users: buildUsers(),
  domains: structuredClone(mockDomainWatches) as DomainWatch[],
  auditLogs: structuredClone(mockAuditLogs) as AuditLog[],
  checkRuns: structuredClone(mockCheckRuns) as CheckRun[],
  registrations: structuredClone(mockRegistrationAttempts) as RegistrationAttempt[],
  notifications: structuredClone(mockNotificationEvents) as NotificationEvent[],
  settings: structuredClone(mockSettings) as AppSettings,
  jobs: buildJobs(),
  providerCredentials: [
    {
      id: "cred-1",
      provider: "openprovider",
      usernameEncrypted: encryptSecret("demo-openprovider"),
      passwordEncrypted: encryptSecret("demo-openprovider-password"),
      createdAt: "2026-03-20T09:00:00.000Z",
      updatedAt: "2026-03-28T11:20:00.000Z",
    },
  ],
};
