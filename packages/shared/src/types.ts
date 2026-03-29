import { z } from "zod";

export const supportedTlds = [
  ".nl",
  ".com",
  ".net",
  ".org",
  ".io",
  ".eu",
  ".be",
  ".de",
  ".fr",
  ".co.uk",
] as const;

export const roleSchema = z.enum(["ADMIN", "SECURITY_ANALYST", "OPERATOR", "VIEWER"]);
export const domainStateSchema = z.enum(["active", "paused", "attention"]);
export const monitorActionSchema = z.enum(["LOG_ONLY", "NOTIFY", "AUTO_REGISTER"]);
export const frequencySchema = z.enum([
  "every_5_minutes",
  "every_15_minutes",
  "hourly",
  "daily",
  "custom",
]);
export const prioritySchema = z.enum(["low", "normal", "high"]);
export const availabilityStatusSchema = z.enum([
  "available",
  "registered",
  "unknown",
  "rate_limited",
  "provider_error",
  "unsupported_tld",
]);
export const registrationStatusSchema = z.enum(["pending", "submitted", "success", "failed"]);
export const notificationChannelSchema = z.enum(["email", "webhook", "ntfy", "slack"]);
export const notificationStatusSchema = z.enum(["queued", "sent", "failed"]);
export const auditSeveritySchema = z.enum(["info", "warning", "critical"]);
export const systemHealthStatusSchema = z.enum(["healthy", "degraded", "critical"]);

export type SupportedTld = (typeof supportedTlds)[number];
export type RoleKey = z.infer<typeof roleSchema>;
export type DomainState = z.infer<typeof domainStateSchema>;
export type MonitorAction = z.infer<typeof monitorActionSchema>;
export type CheckFrequency = z.infer<typeof frequencySchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
export type AuditSeverity = z.infer<typeof auditSeveritySchema>;
export type SystemHealthStatus = z.infer<typeof systemHealthStatusSchema>;

export interface Role {
  id: string;
  key: RoleKey;
  name: string;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  teamId?: string;
}

export interface SessionUser extends UserSummary {
  lastLoginAt: string;
  ntfyEnabled: boolean;
}

export interface DomainExtension {
  id: string;
  tld: SupportedTld;
  fqdn: string;
  status: AvailabilityStatus;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  latencyMs?: number;
  rawSummary?: string;
  sourceProvider: string;
  retryCount: number;
  autoRegisterEnabled: boolean;
  notifyEnabled: boolean;
  registrationStatus?: RegistrationStatus;
}

export interface DomainWatch {
  id: string;
  rootName: string;
  displayName: string;
  state: DomainState;
  frequency: CheckFrequency;
  customSchedule?: string;
  actionMode: MonitorAction;
  priority: Priority;
  tags: string[];
  notes?: string;
  owner: UserSummary;
  team?: Team;
  ntfyEnabled: boolean;
  ntfyTopic?: string;
  autoRegisterEnabled: boolean;
  registrarLinked: boolean;
  lastCheckAt?: string;
  nextCheckAt: string;
  createdAt: string;
  updatedAt: string;
  extensions: DomainExtension[];
}

export interface CheckRun {
  id: string;
  domainWatchId: string;
  fqdn: string;
  tld: SupportedTld;
  result: AvailabilityStatus;
  rawSummary: string;
  latencyMs: number;
  sourceProvider: string;
  retryCount: number;
  checkedAt: string;
}

export interface RegistrationAttempt {
  id: string;
  domainWatchId: string;
  fqdn: string;
  provider: string;
  status: RegistrationStatus;
  initiatedAt: string;
  completedAt?: string;
  errorMessage?: string;
  responseCode?: string;
  metadataSummary?: string;
  idempotencyKey: string;
}

export interface NotificationEvent {
  id: string;
  domainWatchId?: string;
  channel: NotificationChannel;
  target: string;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  actorRole: RoleKey;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  userAgent: string;
  severity: AuditSeverity;
  timestamp: string;
  result: "success" | "failed";
}

export interface JobExecution {
  id: string;
  queue: "domain-checks" | "registration-attempts" | "notifications";
  jobName: string;
  status: "queued" | "running" | "completed" | "failed" | "retrying";
  attemptsMade: number;
  maxAttempts: number;
  nextRunAt?: string;
  lastError?: string;
}

export interface QueueSnapshot {
  pending: number;
  active: number;
  delayed: number;
  failed: number;
}

export interface SystemHealthCard {
  id: string;
  name: string;
  status: SystemHealthStatus;
  summary: string;
  detail: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
}

export interface DashboardEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: "info" | "success" | "warning" | "critical";
}

export interface UpcomingCheck {
  id: string;
  fqdn: string;
  owner: string;
  nextRunAt: string;
  queue: string;
}

export interface DashboardMetrics {
  metrics: DashboardMetric[];
  recentEvents: DashboardEvent[];
  recentAvailableDomains: DomainExtension[];
  queue: QueueSnapshot;
  systemHealth: SystemHealthCard[];
  upcomingChecks: UpcomingCheck[];
  failuresByProvider: Array<{
    provider: string;
    failures: number;
    retries: number;
  }>;
}

export interface NtfySettings {
  enabled: boolean;
  serverUrl: string;
  topic: string;
  authTokenConfigured: boolean;
  customHeadersConfigured: boolean;
}

export interface NotificationSettings {
  ntfy: NtfySettings;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl?: string;
}

export interface OpenproviderSettings {
  enabled: boolean;
  usernameConfigured: boolean;
  passwordConfigured: boolean;
  ownerHandle: string;
  adminHandle: string;
  techHandle: string;
  billingHandle: string;
  nsGroup: string;
  defaultRegistrar: string;
  testMode: boolean;
}

export interface ProviderConfiguration {
  whoisFallbackEnabled: boolean;
  genericWhoisEndpoint: string;
  supportedProviders: string[];
  retentionDays: number;
}

export interface AppSettings {
  openprovider: OpenproviderSettings;
  notifications: NotificationSettings;
  providerConfig: ProviderConfiguration;
  defaultIntervals: CheckFrequency[];
  roles: Role[];
}

export interface DomainFilters {
  state?: DomainState | "all";
  autoRegisterEnabled?: "all" | "enabled" | "disabled";
  tld?: SupportedTld | "all";
  ownerId?: string | "all";
  tag?: string | "all";
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId: string;
    generatedAt: string;
  };
}
