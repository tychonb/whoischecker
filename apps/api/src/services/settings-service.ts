import type { NotificationSettingsValues, OpenproviderSettingsValues } from "@whoischecker/shared";

import type { SettingsRepository } from "@/repositories/settings-repository";
import type { NotificationService } from "@/services/notifications/notification-service";
import type { OpenproviderRegistrarService } from "@/services/registrar/openprovider-registrar-service";

export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly notificationService: NotificationService,
    private readonly openproviderRegistrarService: OpenproviderRegistrarService,
  ) {}

  get() {
    return this.settingsRepository.get();
  }

  updateNotifications(payload: NotificationSettingsValues, updatedById?: string) {
    return this.settingsRepository.updateNotifications(payload, updatedById);
  }

  updateOpenprovider(payload: OpenproviderSettingsValues, updatedById?: string) {
    return this.settingsRepository.updateOpenprovider(payload, updatedById);
  }

  async testNotification() {
    return this.notificationService.sendTestNotification();
  }

  async testOpenprovider() {
    return this.openproviderRegistrarService.validateCredentials();
  }
}
