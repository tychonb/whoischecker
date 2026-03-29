import type { AuditSeverity, RoleKey } from "@whoischecker/shared";
import { randomUUID } from "crypto";

import type { AuditRepository } from "@/repositories/audit-repository";

interface AuditEntryInput {
  actor: string;
  actorRole: RoleKey;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  userAgent: string;
  severity?: AuditSeverity;
  result?: "success" | "failed";
}

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  record(input: AuditEntryInput) {
    return this.auditRepository.create({
      id: randomUUID(),
      actor: input.actor,
      actorRole: input.actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.severity ?? "info",
      timestamp: new Date().toISOString(),
      result: input.result ?? "success",
    });
  }

  list() {
    return this.auditRepository.list();
  }
}
