-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('ADMIN', 'SECURITY_ANALYST', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "DomainState" AS ENUM ('active', 'paused', 'attention');

-- CreateEnum
CREATE TYPE "MonitorAction" AS ENUM ('LOG_ONLY', 'NOTIFY', 'AUTO_REGISTER');

-- CreateEnum
CREATE TYPE "CheckFrequency" AS ENUM ('every_5_minutes', 'every_15_minutes', 'hourly', 'daily', 'custom');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'registered', 'unknown', 'rate_limited', 'provider_error', 'unsupported_tld');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'submitted', 'success', 'failed');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'webhook', 'ntfy', 'slack');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'retrying');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ntfyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ntfyServerUrl" TEXT,
    "ntfyTopic" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainWatch" (
    "id" TEXT NOT NULL,
    "rootName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "state" "DomainState" NOT NULL,
    "frequency" "CheckFrequency" NOT NULL,
    "customSchedule" TEXT,
    "actionMode" "MonitorAction" NOT NULL,
    "priority" "Priority" NOT NULL,
    "tags" JSONB NOT NULL,
    "notes" TEXT,
    "ntfyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ntfyTopic" TEXT,
    "autoRegisterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrarLinked" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainExtension" (
    "id" TEXT NOT NULL,
    "domainWatchId" TEXT NOT NULL,
    "tld" TEXT NOT NULL,
    "fqdn" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL,
    "lastCheckedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "latencyMs" INTEGER,
    "rawSummary" TEXT,
    "sourceProvider" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "autoRegisterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationStatus" "RegistrationStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckRun" (
    "id" TEXT NOT NULL,
    "domainWatchId" TEXT NOT NULL,
    "domainExtensionId" TEXT,
    "fqdn" TEXT NOT NULL,
    "tld" TEXT NOT NULL,
    "result" "AvailabilityStatus" NOT NULL,
    "rawSummary" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "sourceProvider" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationAttempt" (
    "id" TEXT NOT NULL,
    "domainWatchId" TEXT NOT NULL,
    "domainExtensionId" TEXT,
    "fqdn" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "responseCode" TEXT,
    "metadataSummary" TEXT,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "RegistrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "domainWatchId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "target" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "providerMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "RoleKey" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "label" TEXT,
    "encryptedValue" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "metadata" JSONB,
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "payload" JSONB,
    "relatedDomainWatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DomainWatch_ownerId_idx" ON "DomainWatch"("ownerId");

-- CreateIndex
CREATE INDEX "DomainWatch_teamId_idx" ON "DomainWatch"("teamId");

-- CreateIndex
CREATE INDEX "DomainWatch_state_nextCheckAt_idx" ON "DomainWatch"("state", "nextCheckAt");

-- CreateIndex
CREATE INDEX "DomainExtension_fqdn_idx" ON "DomainExtension"("fqdn");

-- CreateIndex
CREATE UNIQUE INDEX "DomainExtension_domainWatchId_tld_key" ON "DomainExtension"("domainWatchId", "tld");

-- CreateIndex
CREATE INDEX "CheckRun_domainWatchId_checkedAt_idx" ON "CheckRun"("domainWatchId", "checkedAt");

-- CreateIndex
CREATE INDEX "CheckRun_result_idx" ON "CheckRun"("result");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationAttempt_idempotencyKey_key" ON "RegistrationAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_domainWatchId_status_idx" ON "RegistrationAttempt"("domainWatchId", "status");

-- CreateIndex
CREATE INDEX "NotificationEvent_channel_status_idx" ON "NotificationEvent"("channel", "status");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ProviderCredential_providerName_credentialType_idx" ON "ProviderCredential"("providerName", "credentialType");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "JobExecution_queue_status_idx" ON "JobExecution"("queue", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainWatch" ADD CONSTRAINT "DomainWatch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainWatch" ADD CONSTRAINT "DomainWatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainExtension" ADD CONSTRAINT "DomainExtension_domainWatchId_fkey" FOREIGN KEY ("domainWatchId") REFERENCES "DomainWatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckRun" ADD CONSTRAINT "CheckRun_domainWatchId_fkey" FOREIGN KEY ("domainWatchId") REFERENCES "DomainWatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckRun" ADD CONSTRAINT "CheckRun_domainExtensionId_fkey" FOREIGN KEY ("domainExtensionId") REFERENCES "DomainExtension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationAttempt" ADD CONSTRAINT "RegistrationAttempt_domainWatchId_fkey" FOREIGN KEY ("domainWatchId") REFERENCES "DomainWatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationAttempt" ADD CONSTRAINT "RegistrationAttempt_domainExtensionId_fkey" FOREIGN KEY ("domainExtensionId") REFERENCES "DomainExtension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_domainWatchId_fkey" FOREIGN KEY ("domainWatchId") REFERENCES "DomainWatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCredential" ADD CONSTRAINT "ProviderCredential_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_relatedDomainWatchId_fkey" FOREIGN KEY ("relatedDomainWatchId") REFERENCES "DomainWatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
