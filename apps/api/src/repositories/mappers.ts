import type {
  AuditLog,
  CheckFrequency,
  DomainExtension,
  DomainWatch,
  NotificationSettings,
  OpenproviderSettings,
  ProviderConfiguration,
  RegistrationAttempt,
  Role,
  SessionUser,
} from "@whoischecker/shared";
import { mockSettings } from "@whoischecker/shared";
import type { Prisma } from "@prisma/client";

type RoleRecord = {
  key: string;
  name: string;
  description: string;
};

type TeamRecord = {
  id: string;
  name: string;
  slug: string;
} | null;

type UserRecord = {
  id: string;
  name: string;
  email: string;
  lastLoginAt: Date | null;
  ntfyEnabled: boolean;
  teamId: string | null;
  role: RoleRecord;
};

type DomainExtensionRecord = {
  id: string;
  tld: string;
  fqdn: string;
  status: string;
  lastCheckedAt: Date | null;
  nextCheckAt: Date | null;
  latencyMs: number | null;
  rawSummary: string | null;
  sourceProvider: string;
  retryCount: number;
  autoRegisterEnabled: boolean;
  notifyEnabled: boolean;
  registrationStatus: string | null;
};

type DomainWatchRecord = {
  id: string;
  rootName: string;
  displayName: string;
  state: string;
  frequency: string;
  customSchedule: string | null;
  actionMode: string;
  priority: string;
  tags: JsonValue;
  notes: string | null;
  ntfyEnabled: boolean;
  ntfyTopic: string | null;
  autoRegisterEnabled: boolean;
  registrarLinked: boolean;
  lastCheckAt: Date | null;
  nextCheckAt: Date;
  createdAt: Date;
  updatedAt: Date;
  owner: UserRecord;
  team: TeamRecord;
  extensions: DomainExtensionRecord[];
};

type AuditLogRecord = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  userAgent: string;
  severity: string;
  result: string;
  createdAt: Date;
};

type RegistrationAttemptRecord = {
  id: string;
  domainWatchId: string;
  fqdn: string;
  provider: string;
  status: string;
  initiatedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  responseCode: string | null;
  metadataSummary: string | null;
  idempotencyKey: string;
};

type NotificationSettingsValue = NotificationSettings;
type OpenproviderSettingsValue = OpenproviderSettings;
type ProviderConfigurationValue = ProviderConfiguration;

export function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function coerceTags(value: JsonValue): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export function mapUserToSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.key as SessionUser["role"],
    teamId: user.teamId ?? undefined,
    ntfyEnabled: user.ntfyEnabled,
    lastLoginAt: toIsoString(user.lastLoginAt) ?? new Date(0).toISOString(),
  };
}

export function mapDomainExtension(extension: DomainExtensionRecord): DomainExtension {
  return {
    id: extension.id,
    tld: extension.tld as DomainExtension["tld"],
    fqdn: extension.fqdn,
    status: extension.status as DomainExtension["status"],
    lastCheckedAt: toIsoString(extension.lastCheckedAt),
    nextCheckAt: toIsoString(extension.nextCheckAt),
    latencyMs: extension.latencyMs ?? undefined,
    rawSummary: extension.rawSummary ?? undefined,
    sourceProvider: extension.sourceProvider,
    retryCount: extension.retryCount,
    autoRegisterEnabled: extension.autoRegisterEnabled,
    notifyEnabled: extension.notifyEnabled,
    registrationStatus: extension.registrationStatus as DomainExtension["registrationStatus"],
  };
}

export function mapDomainWatch(record: DomainWatchRecord): DomainWatch {
  return {
    id: record.id,
    rootName: record.rootName,
    displayName: record.displayName,
    state: record.state as DomainWatch["state"],
    frequency: record.frequency as CheckFrequency,
    customSchedule: record.customSchedule ?? undefined,
    actionMode: record.actionMode as DomainWatch["actionMode"],
    priority: record.priority as DomainWatch["priority"],
    tags: coerceTags(record.tags),
    notes: record.notes ?? undefined,
    owner: {
      id: record.owner.id,
      name: record.owner.name,
      email: record.owner.email,
      role: record.owner.role.key as DomainWatch["owner"]["role"],
      teamId: record.owner.teamId ?? undefined,
    },
    team: record.team
      ? {
          id: record.team.id,
          name: record.team.name,
          slug: record.team.slug,
        }
      : undefined,
    ntfyEnabled: record.ntfyEnabled,
    ntfyTopic: record.ntfyTopic ?? undefined,
    autoRegisterEnabled: record.autoRegisterEnabled,
    registrarLinked: record.registrarLinked,
    lastCheckAt: toIsoString(record.lastCheckAt),
    nextCheckAt: record.nextCheckAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    extensions: record.extensions.map(mapDomainExtension),
  };
}

export function mapAuditLog(record: AuditLogRecord): AuditLog {
  return {
    id: record.id,
    actor: record.actorName,
    actorRole: record.actorRole as AuditLog["actorRole"],
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    summary: record.summary,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    severity: record.severity as AuditLog["severity"],
    timestamp: record.createdAt.toISOString(),
    result: record.result as AuditLog["result"],
  };
}

export function mapRegistrationAttempt(record: RegistrationAttemptRecord): RegistrationAttempt {
  return {
    id: record.id,
    domainWatchId: record.domainWatchId,
    fqdn: record.fqdn,
    provider: record.provider,
    status: record.status as RegistrationAttempt["status"],
    initiatedAt: record.initiatedAt.toISOString(),
    completedAt: toIsoString(record.completedAt),
    errorMessage: record.errorMessage ?? undefined,
    responseCode: record.responseCode ?? undefined,
    metadataSummary: record.metadataSummary ?? undefined,
    idempotencyKey: record.idempotencyKey,
  };
}

export function mapRole(record: { id: string; key: string; name: string; description: string }): Role {
  return {
    id: record.id,
    key: record.key as Role["key"],
    name: record.name,
    description: record.description,
  };
}

function extractTypedSetting<T>(value: JsonValue | null | undefined, fallback: T): T {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  return value as T;
}

export function mapAppSettingsFromRows(input: {
  notificationSetting?: JsonValue | null;
  openproviderSetting?: JsonValue | null;
  providerConfigSetting?: JsonValue | null;
  defaultIntervalsSetting?: JsonValue | null;
  roles: Array<{ id: string; key: string; name: string; description: string }>;
}): {
  settings: {
    openprovider: OpenproviderSettingsValue;
    notifications: NotificationSettingsValue;
    providerConfig: ProviderConfigurationValue;
    defaultIntervals: CheckFrequency[];
    roles: Role[];
  };
} {
  const notifications = extractTypedSetting<NotificationSettingsValue>(input.notificationSetting, mockSettings.notifications);
  const openprovider = extractTypedSetting<OpenproviderSettingsValue>(input.openproviderSetting, mockSettings.openprovider);
  const providerConfig = extractTypedSetting<ProviderConfigurationValue>(input.providerConfigSetting, mockSettings.providerConfig);
  const defaultIntervals = Array.isArray(input.defaultIntervalsSetting)
    ? (input.defaultIntervalsSetting.filter((value): value is CheckFrequency => typeof value === "string") as CheckFrequency[])
    : mockSettings.defaultIntervals;

  return {
    settings: {
      openprovider,
      notifications,
      providerConfig,
      defaultIntervals,
      roles: input.roles.map(mapRole),
    },
  };
}
export type JsonValue = Prisma.JsonValue;
