import type { Prisma } from "@prisma/client";
import type { AppSettings, NotificationSettingsValues, OpenproviderSettingsValues } from "@whoischecker/shared";
import { mockSettings } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { mapAppSettingsFromRows, type JsonValue } from "@/repositories/mappers";
import { decryptSecret, encryptSecret } from "@/utils/crypto";

const SETTINGS_KEYS = {
  notifications: "notifications",
  openprovider: "openprovider",
  providerConfig: "provider_config",
  defaultIntervals: "default_intervals",
} as const;

const PROVIDER_KEYS = {
  ntfyAuthToken: { providerName: "ntfy", credentialType: "auth_token" },
  openproviderUsername: { providerName: "openprovider", credentialType: "username" },
  openproviderPassword: { providerName: "openprovider", credentialType: "password" },
} as const;

export class SettingsRepository {
  async get(): Promise<AppSettings> {
    const [settingsRows, roles, openproviderUsername, openproviderPassword, ntfyAuthToken] = await Promise.all([
      prisma.systemSetting.findMany({
        where: {
          key: {
            in: Object.values(SETTINGS_KEYS),
          },
        },
      }),
      prisma.role.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      prisma.providerCredential.findFirst({
        where: PROVIDER_KEYS.openproviderUsername,
      }),
      prisma.providerCredential.findFirst({
        where: PROVIDER_KEYS.openproviderPassword,
      }),
      prisma.providerCredential.findFirst({
        where: PROVIDER_KEYS.ntfyAuthToken,
      }),
    ]);

    const rowMap = new Map(settingsRows.map((row: (typeof settingsRows)[number]) => [row.key, row.value]));
    const mapped = mapAppSettingsFromRows({
      notificationSetting: rowMap.get(SETTINGS_KEYS.notifications) as JsonValue | undefined,
      openproviderSetting: rowMap.get(SETTINGS_KEYS.openprovider) as JsonValue | undefined,
      providerConfigSetting: rowMap.get(SETTINGS_KEYS.providerConfig) as JsonValue | undefined,
      defaultIntervalsSetting: rowMap.get(SETTINGS_KEYS.defaultIntervals) as JsonValue | undefined,
      roles,
    }).settings;

    return {
      ...mapped,
      notifications: {
        ...mapped.notifications,
        ntfy: {
          ...mapped.notifications.ntfy,
          authTokenConfigured: Boolean(ntfyAuthToken),
        },
      },
      openprovider: {
        ...mapped.openprovider,
        usernameConfigured: Boolean(openproviderUsername),
        passwordConfigured: Boolean(openproviderPassword),
      },
    };
  }

  async updateNotifications(payload: NotificationSettingsValues, updatedById?: string) {
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.systemSetting.upsert({
        where: { key: SETTINGS_KEYS.notifications },
        update: {
          value: {
            ntfy: {
              enabled: payload.ntfyEnabled,
              serverUrl: payload.ntfyServerUrl,
              topic: payload.ntfyTopic,
              authTokenConfigured: Boolean(payload.ntfyAuthToken),
              customHeadersConfigured: false,
            },
            emailEnabled: payload.emailEnabled,
            webhookEnabled: payload.webhookEnabled,
            webhookUrl: payload.webhookUrl || undefined,
          },
          updatedById: updatedById ?? null,
        },
        create: {
          key: SETTINGS_KEYS.notifications,
          value: {
            ntfy: {
              enabled: payload.ntfyEnabled,
              serverUrl: payload.ntfyServerUrl,
              topic: payload.ntfyTopic,
              authTokenConfigured: Boolean(payload.ntfyAuthToken),
              customHeadersConfigured: false,
            },
            emailEnabled: payload.emailEnabled,
            webhookEnabled: payload.webhookEnabled,
            webhookUrl: payload.webhookUrl || undefined,
          },
          updatedById: updatedById ?? null,
        },
      });

      if (payload.ntfyAuthToken) {
        await transaction.providerCredential.upsert({
          where: {
            id: `cred-${PROVIDER_KEYS.ntfyAuthToken.providerName}-${PROVIDER_KEYS.ntfyAuthToken.credentialType}`,
          },
          update: {
            encryptedValue: encryptSecret(payload.ntfyAuthToken),
            providerName: PROVIDER_KEYS.ntfyAuthToken.providerName,
            credentialType: PROVIDER_KEYS.ntfyAuthToken.credentialType,
          },
          create: {
            id: `cred-${PROVIDER_KEYS.ntfyAuthToken.providerName}-${PROVIDER_KEYS.ntfyAuthToken.credentialType}`,
            providerName: PROVIDER_KEYS.ntfyAuthToken.providerName,
            credentialType: PROVIDER_KEYS.ntfyAuthToken.credentialType,
            encryptedValue: encryptSecret(payload.ntfyAuthToken),
          },
        });
      }
    });

    return (await this.get()).notifications;
  }

  async updateOpenprovider(payload: OpenproviderSettingsValues, updatedById?: string) {
    const existingSecrets = await this.getOpenproviderSecrets();

    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.systemSetting.upsert({
        where: { key: SETTINGS_KEYS.openprovider },
        update: {
          value: {
            enabled: payload.enabled,
            usernameConfigured: Boolean(payload.username || existingSecrets?.username),
            passwordConfigured: Boolean(payload.password || existingSecrets?.password),
            ownerHandle: payload.ownerHandle,
            adminHandle: payload.adminHandle,
            techHandle: payload.techHandle,
            billingHandle: payload.billingHandle,
            nsGroup: payload.nsGroup,
            defaultRegistrar: "Openprovider",
            testMode: payload.testMode,
          },
          updatedById: updatedById ?? null,
        },
        create: {
          key: SETTINGS_KEYS.openprovider,
          value: {
            enabled: payload.enabled,
            usernameConfigured: Boolean(payload.username || existingSecrets?.username),
            passwordConfigured: Boolean(payload.password || existingSecrets?.password),
            ownerHandle: payload.ownerHandle,
            adminHandle: payload.adminHandle,
            techHandle: payload.techHandle,
            billingHandle: payload.billingHandle,
            nsGroup: payload.nsGroup,
            defaultRegistrar: "Openprovider",
            testMode: payload.testMode,
          },
          updatedById: updatedById ?? null,
        },
      });

      if (payload.username) {
        await transaction.providerCredential.upsert({
          where: { id: `cred-${PROVIDER_KEYS.openproviderUsername.providerName}-${PROVIDER_KEYS.openproviderUsername.credentialType}` },
          update: {
            providerName: PROVIDER_KEYS.openproviderUsername.providerName,
            credentialType: PROVIDER_KEYS.openproviderUsername.credentialType,
            encryptedValue: encryptSecret(payload.username),
          },
          create: {
            id: `cred-${PROVIDER_KEYS.openproviderUsername.providerName}-${PROVIDER_KEYS.openproviderUsername.credentialType}`,
            providerName: PROVIDER_KEYS.openproviderUsername.providerName,
            credentialType: PROVIDER_KEYS.openproviderUsername.credentialType,
            encryptedValue: encryptSecret(payload.username),
          },
        });
      }

      if (payload.password) {
        await transaction.providerCredential.upsert({
          where: { id: `cred-${PROVIDER_KEYS.openproviderPassword.providerName}-${PROVIDER_KEYS.openproviderPassword.credentialType}` },
          update: {
            providerName: PROVIDER_KEYS.openproviderPassword.providerName,
            credentialType: PROVIDER_KEYS.openproviderPassword.credentialType,
            encryptedValue: encryptSecret(payload.password),
          },
          create: {
            id: `cred-${PROVIDER_KEYS.openproviderPassword.providerName}-${PROVIDER_KEYS.openproviderPassword.credentialType}`,
            providerName: PROVIDER_KEYS.openproviderPassword.providerName,
            credentialType: PROVIDER_KEYS.openproviderPassword.credentialType,
            encryptedValue: encryptSecret(payload.password),
          },
        });
      }
    });

    return (await this.get()).openprovider;
  }

  async ensureDefaults(updatedById?: string) {
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const defaultRows = [
        { key: SETTINGS_KEYS.notifications, value: mockSettings.notifications },
        { key: SETTINGS_KEYS.openprovider, value: mockSettings.openprovider },
        { key: SETTINGS_KEYS.providerConfig, value: mockSettings.providerConfig },
        { key: SETTINGS_KEYS.defaultIntervals, value: mockSettings.defaultIntervals },
      ] as const;

      for (const row of defaultRows) {
        await transaction.systemSetting.upsert({
          where: { key: row.key },
          update: {},
          create: {
            key: row.key,
            value: row.value,
            updatedById: updatedById ?? null,
          },
        });
      }
    });
  }

  async getOpenproviderSecrets() {
    const [usernameRecord, passwordRecord] = await Promise.all([
      prisma.providerCredential.findFirst({
        where: PROVIDER_KEYS.openproviderUsername,
      }),
      prisma.providerCredential.findFirst({
        where: PROVIDER_KEYS.openproviderPassword,
      }),
    ]);

    if (!usernameRecord || !passwordRecord) {
      return null;
    }

    return {
      username: decryptSecret(usernameRecord.encryptedValue),
      password: decryptSecret(passwordRecord.encryptedValue),
    };
  }

  async getNtfyAuthToken() {
    const record = await prisma.providerCredential.findFirst({
      where: PROVIDER_KEYS.ntfyAuthToken,
    });

    return record ? decryptSecret(record.encryptedValue) : undefined;
  }
}
