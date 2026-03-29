import { AuditRepository } from "@/repositories/audit-repository";
import { DomainRepository } from "@/repositories/domain-repository";
import { SettingsRepository } from "@/repositories/settings-repository";
import { UserRepository } from "@/repositories/user-repository";
import { AuditService } from "@/services/audit-service";
import { AuthService } from "@/services/auth/auth-service";
import { AvailabilityEngine } from "@/services/checker/availability-engine";
import { FallbackWhoisChecker, GenericWhoisChecker, NlWhoisChecker } from "@/services/checker/checkers";
import { DashboardService } from "@/services/dashboard-service";
import { DomainWatchService } from "@/services/domain-watch-service";
import { NotificationService } from "@/services/notifications/notification-service";
import { NtfyProvider } from "@/services/notifications/providers/ntfy-provider";
import { OpenproviderRegistrarService } from "@/services/registrar/openprovider-registrar-service";
import { SettingsService } from "@/services/settings-service";

export const userRepository = new UserRepository();
export const domainRepository = new DomainRepository();
export const auditRepository = new AuditRepository();
export const settingsRepository = new SettingsRepository();
export const auditService = new AuditService(auditRepository);
export const authService = new AuthService(userRepository, auditService);
export const availabilityEngine = new AvailabilityEngine(
  [new NlWhoisChecker(), new GenericWhoisChecker()],
  new FallbackWhoisChecker(),
);
export const notificationService = new NotificationService(new NtfyProvider(), settingsRepository, userRepository);
export const openproviderRegistrarService = new OpenproviderRegistrarService(settingsRepository);
export const domainWatchService = new DomainWatchService(
  domainRepository,
  auditService,
  availabilityEngine,
  notificationService,
  openproviderRegistrarService,
);
export const dashboardService = new DashboardService(auditService);
export const settingsService = new SettingsService(settingsRepository, notificationService, openproviderRegistrarService);
