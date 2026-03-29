import type { AuditLog } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { mapAuditLog } from "@/repositories/mappers";

export class AuditRepository {
  async list() {
    const records = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map(mapAuditLog);
  }

  async create(entry: AuditLog) {
    const record = await prisma.auditLog.create({
      data: {
        id: entry.id,
        actorName: entry.actor,
        actorRole: entry.actorRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        severity: entry.severity,
        result: entry.result,
        createdAt: new Date(entry.timestamp),
      },
    });

    return mapAuditLog(record);
  }
}
