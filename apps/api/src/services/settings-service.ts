import type { NotificationSettingsValues, OpenproviderSettingsValues } from "@whoischecker/shared";

import type { SettingsRepository } from "@/repositories/settings-repository";
import type { NotificationService } from "@/services/notifications/notification-service";
import type { OpenproviderRegistrarService } from "@/services/registrar/openprovider-registrar-service";
import type { AuditService } from "@/services/audit-service";

interface SettingsActor {
  actor: string;
  actorRole: "ADMIN" | "SECURITY_ANALYST" | "OPERATOR" | "VIEWER";
  ipAddress: string;
  userAgent: string;
}

export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly notificationService: NotificationService,
    private readonly openproviderRegistrarService: OpenproviderRegistrarService,
    private readonly auditService: AuditService,
  ) {}

  get() {
    return this.settingsRepository.get();
  }

  async updateNotifications(payload: NotificationSettingsValues, updatedById: string, actor: SettingsActor) {
    const result = await this.settingsRepository.updateNotifications(payload, updatedById);
    await this.auditService.record({ ...actor, action: "settings.notifications.updated", entityType: "SystemSetting", entityId: "notifications", summary: "Notificatie-instellingen gewijzigd." });
    return result;
  }

  async updateOpenprovider(payload: OpenproviderSettingsValues, updatedById: string, actor: SettingsActor) {
    const result = await this.settingsRepository.updateOpenprovider(payload, updatedById);
    await this.auditService.record({ ...actor, action: "settings.openprovider.updated", entityType: "SystemSetting", entityId: "openprovider", summary: "Openprovider-instellingen gewijzigd." });
    return result;
  }

  async testNotification(actor: SettingsActor) {
    const result = await this.notificationService.sendTestNotification();
    await this.auditService.record({ ...actor, action: "settings.notifications.tested", entityType: "SystemSetting", entityId: "notifications", summary: "Testnotificatie uitgevoerd.", result: result.status === "failed" ? "failed" : "success" });
    return result;
  }

  async testOpenprovider(actor: SettingsActor) {
    const result = await this.openproviderRegistrarService.validateCredentials();
    await this.auditService.record({ ...actor, action: "settings.openprovider.tested", entityType: "SystemSetting", entityId: "openprovider", summary: "Openprovider-verbinding getest.", result: result.ok ? "success" : "failed" });
    return result;
  }
}
