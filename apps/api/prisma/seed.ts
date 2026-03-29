import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  mockAuditLogs,
  mockCheckRuns,
  mockDomainWatches,
  mockNotificationEvents,
  mockRegistrationAttempts,
  mockSettings,
  mockTeams,
} from "@whoischecker/shared";

import { encryptSecret, hashPassword } from "../src/utils/crypto";

dotenv.config();

const prisma = new PrismaClient();

function assertSeedAllowed() {
  if (process.env.ALLOW_DB_SEED !== "true") {
    throw new Error("Seeding is geblokkeerd. Zet ALLOW_DB_SEED=true om expliciet demo-data te laden.");
  }

  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error("Seeding in productie is geblokkeerd. Zet SEED_ALLOW_PRODUCTION=true als je dit bewust wilt uitvoeren.");
  }
}

async function main() {
  assertSeedAllowed();

  const roles = [
    {
      id: "role-admin",
      key: "ADMIN",
      name: "Administrator",
      description: "Volledige toegang tot instellingen, audit en registraties.",
    },
    {
      id: "role-analyst",
      key: "SECURITY_ANALYST",
      name: "Security-analist",
      description: "Beheert domeinen, checks en escalaties zonder systeeminstellingen.",
    },
    {
      id: "role-operator",
      key: "OPERATOR",
      name: "Operator",
      description: "Mag checks triggeren en status opvolgen.",
    },
    {
      id: "role-viewer",
      key: "VIEWER",
      name: "Lezer",
      description: "Alleen-lezenrechten voor monitoring en audit.",
    },
  ] as const;

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
  }

  for (const team of mockTeams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: team,
      create: team,
    });
  }

  const users = [
    {
      id: "user-1",
      email: "eva@monitoring.internal",
      name: "Eva van Rijn",
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyEnabled: true,
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "platform-domain-monitoring",
      lastLoginAt: new Date("2026-03-29T16:48:00.000Z"),
      roleId: "role-admin",
      teamId: "team-1",
    },
    {
      id: "user-2",
      email: "joris@monitoring.internal",
      name: "Joris Meijer",
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyEnabled: true,
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "security-analyst-domain-monitoring",
      lastLoginAt: new Date("2026-03-28T10:15:00.000Z"),
      roleId: "role-analyst",
      teamId: "team-1",
    },
    {
      id: "user-3",
      email: "nina@monitoring.internal",
      name: "Nina Vos",
      passwordHash: hashPassword("ChangeMe!123"),
      ntfyEnabled: false,
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "corporate-it-domain-monitoring",
      lastLoginAt: new Date("2026-03-27T07:30:00.000Z"),
      roleId: "role-operator",
      teamId: "team-2",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  for (const watch of mockDomainWatches) {
    await prisma.domainWatch.upsert({
      where: { id: watch.id },
      update: {
        rootName: watch.rootName,
        displayName: watch.displayName,
        state: watch.state,
        frequency: watch.frequency,
        customSchedule: watch.customSchedule,
        actionMode: watch.actionMode,
        priority: watch.priority,
        tags: watch.tags,
        notes: watch.notes,
        ntfyEnabled: watch.ntfyEnabled,
        ntfyTopic: watch.ntfyTopic,
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
        customSchedule: watch.customSchedule,
        actionMode: watch.actionMode,
        priority: watch.priority,
        tags: watch.tags,
        notes: watch.notes,
        ntfyEnabled: watch.ntfyEnabled,
        ntfyTopic: watch.ntfyTopic,
        autoRegisterEnabled: watch.autoRegisterEnabled,
        registrarLinked: watch.registrarLinked,
        lastCheckAt: watch.lastCheckAt ? new Date(watch.lastCheckAt) : null,
        nextCheckAt: new Date(watch.nextCheckAt),
        ownerId: watch.owner.id,
        teamId: watch.team?.id ?? null,
      },
    });

    for (const extension of watch.extensions) {
      await prisma.domainExtension.upsert({
        where: {
          domainWatchId_tld: {
            domainWatchId: watch.id,
            tld: extension.tld,
          },
        },
        update: {
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
  }

  for (const run of mockCheckRuns) {
    await prisma.checkRun.upsert({
      where: { id: run.id },
      update: {},
      create: {
        id: run.id,
        domainWatchId: run.domainWatchId,
        domainExtensionId:
          mockDomainWatches
            .flatMap((watch) => watch.extensions)
            .find((extension) => extension.fqdn === run.fqdn)?.id ?? null,
        fqdn: run.fqdn,
        tld: run.tld,
        result: run.result,
        rawSummary: run.rawSummary,
        latencyMs: run.latencyMs,
        sourceProvider: run.sourceProvider,
        retryCount: run.retryCount,
        checkedAt: new Date(run.checkedAt),
      },
    });
  }

  for (const attempt of mockRegistrationAttempts) {
    await prisma.registrationAttempt.upsert({
      where: { idempotencyKey: attempt.idempotencyKey },
      update: {},
      create: {
        id: attempt.id,
        domainWatchId: attempt.domainWatchId,
        domainExtensionId:
          mockDomainWatches
            .flatMap((watch) => watch.extensions)
            .find((extension) => extension.fqdn === attempt.fqdn)?.id ?? null,
        fqdn: attempt.fqdn,
        provider: attempt.provider,
        status: attempt.status,
        initiatedAt: new Date(attempt.initiatedAt),
        completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
        errorMessage: attempt.errorMessage ?? null,
        responseCode: attempt.responseCode ?? null,
        metadataSummary: attempt.metadataSummary ?? null,
        idempotencyKey: attempt.idempotencyKey,
      },
    });
  }

  for (const event of mockNotificationEvents) {
    await prisma.notificationEvent.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        domainWatchId: event.domainWatchId ?? null,
        channel: event.channel,
        target: event.target,
        title: event.title,
        message: event.message,
        status: event.status,
        sentAt: event.sentAt ? new Date(event.sentAt) : null,
      },
    });
  }

  for (const log of mockAuditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        id: log.id,
        actorUserId: users.find((user) => user.name === log.actor)?.id ?? null,
        actorName: log.actor,
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        summary: log.summary,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        severity: log.severity,
        result: log.result,
        createdAt: new Date(log.timestamp),
      },
    });
  }

  const settingsRows = [
    { key: "notifications", value: mockSettings.notifications },
    { key: "openprovider", value: mockSettings.openprovider },
    { key: "provider_config", value: mockSettings.providerConfig },
    { key: "default_intervals", value: mockSettings.defaultIntervals },
  ] as const;

  for (const setting of settingsRows) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        updatedById: "user-1",
      },
      create: {
        key: setting.key,
        value: setting.value,
        updatedById: "user-1",
      },
    });
  }

  await prisma.providerCredential.upsert({
    where: { id: "cred-ntfy-auth_token" },
    update: {
      providerName: "ntfy",
      credentialType: "auth_token",
      encryptedValue: encryptSecret("demo-ntfy-token"),
    },
    create: {
      id: "cred-ntfy-auth_token",
      providerName: "ntfy",
      credentialType: "auth_token",
      encryptedValue: encryptSecret("demo-ntfy-token"),
    },
  });

  await prisma.providerCredential.upsert({
    where: { id: "cred-openprovider-username" },
    update: {
      providerName: "openprovider",
      credentialType: "username",
      encryptedValue: encryptSecret("demo-openprovider"),
    },
    create: {
      id: "cred-openprovider-username",
      providerName: "openprovider",
      credentialType: "username",
      encryptedValue: encryptSecret("demo-openprovider"),
    },
  });

  await prisma.providerCredential.upsert({
    where: { id: "cred-openprovider-password" },
    update: {
      providerName: "openprovider",
      credentialType: "password",
      encryptedValue: encryptSecret("demo-openprovider-password"),
    },
    create: {
      id: "cred-openprovider-password",
      providerName: "openprovider",
      credentialType: "password",
      encryptedValue: encryptSecret("demo-openprovider-password"),
    },
  });
}

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
