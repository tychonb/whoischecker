import { randomUUID } from "crypto";

import type { DomainExtension, DomainWatch } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import type { SettingsRepository } from "@/repositories/settings-repository";
import type { UserRepository } from "@/repositories/user-repository";

import type { NtfyNotificationPayload } from "./types";
import { NtfyProvider } from "./providers/ntfy-provider";

export class NotificationService {
  constructor(
    private readonly ntfyProvider: NtfyProvider,
    private readonly settingsRepository: SettingsRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private async resolveNtfyPayload(domainWatch: DomainWatch, extension: DomainExtension, title: string, body: string) {
    const [owner, globalSettings, globalAuthToken] = await Promise.all([
      this.userRepository.findById(domainWatch.owner.id),
      this.settingsRepository.get(),
      this.settingsRepository.getNtfyAuthToken(),
    ]);

    if (!owner || !owner.ntfyEnabled || !globalSettings.notifications.ntfy.enabled || !domainWatch.ntfyEnabled) {
      return null;
    }

    const payload: NtfyNotificationPayload = {
      serverUrl: owner.ntfyServerUrl || globalSettings.notifications.ntfy.serverUrl,
      topic: domainWatch.ntfyTopic || owner.ntfyTopic || globalSettings.notifications.ntfy.topic,
      title,
      body,
      tags: ["domain", "alert", extension.status === "available" ? "success" : "warning"],
      priority: extension.status === "available" ? "high" : "default",
      authToken: globalAuthToken,
    };

    return payload;
  }

  async sendAvailabilityDetected(domainWatch: DomainWatch, extension: DomainExtension) {
    const title = "Domein beschikbaar";
    const body = [
      `Domein: ${extension.fqdn}`,
      `Status: BESCHIKBAAR`,
      `Tijd: ${new Date().toISOString()}`,
      `Auto-register: ${domainWatch.autoRegisterEnabled ? "INGESCHAKELD" : "UITGESCHAKELD"}`,
    ].join("\n");

    const ntfyPayload = await this.resolveNtfyPayload(domainWatch, extension, title, body);

    if (!ntfyPayload) {
      return null;
    }

    const result = await this.ntfyProvider.send(ntfyPayload);

    await prisma.notificationEvent.create({
      data: {
        id: randomUUID(),
        domainWatchId: domainWatch.id,
        channel: "ntfy",
        target: ntfyPayload.topic,
        title,
        message: body,
        status: result.status,
        sentAt: result.status === "sent" ? new Date() : null,
      },
    });

    return result;
  }

  async sendAutoRegistrationResult(
    domainWatch: DomainWatch,
    extension: DomainExtension,
    status: "success" | "failed" | "submitted",
    detail: string,
  ) {
    const title =
      status === "success"
        ? "Auto-registratie voltooid"
        : status === "failed"
          ? "Auto-registratie mislukt"
          : "Auto-registratie gestart";
    const statusLabel = status === "success" ? "GELUKT" : status === "failed" ? "MISLUKT" : "GESTART";
    const body = [`Domein: ${extension.fqdn}`, `Status: ${statusLabel}`, `Detail: ${detail}`].join("\n");
    const ntfyPayload = await this.resolveNtfyPayload(domainWatch, extension, title, body);

    if (!ntfyPayload) {
      return null;
    }

    ntfyPayload.priority = status === "success" ? "urgent" : status === "failed" ? "high" : "default";

    const result = await this.ntfyProvider.send(ntfyPayload);

    await prisma.notificationEvent.create({
      data: {
        id: randomUUID(),
        domainWatchId: domainWatch.id,
        channel: "ntfy",
        target: ntfyPayload.topic,
        title,
        message: body,
        status: result.status,
        sentAt: result.status === "sent" ? new Date() : null,
      },
    });

    return result;
  }

  async sendTestNotification() {
    const [settings, authToken] = await Promise.all([this.settingsRepository.get(), this.settingsRepository.getNtfyAuthToken()]);
    const payload: NtfyNotificationPayload = {
      serverUrl: settings.notifications.ntfy.serverUrl,
      topic: settings.notifications.ntfy.topic,
      title: "Testnotificatie domeinmonitoring",
      body: "Dit is een testnotificatie van het veilige domeinmonitoringplatform.",
      tags: ["domain", "alert", "success"],
      priority: "default",
      authToken,
    };

    return this.ntfyProvider.send(payload);
  }
}
