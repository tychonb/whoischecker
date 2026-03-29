import { Router } from "express";

import { authorize } from "@/middleware/authorize";
import { csrfMiddleware } from "@/middleware/csrf";
import { prisma } from "@/lib/prisma";
import { mapRegistrationAttempt } from "@/repositories/mappers";
import { auditService } from "@/services/container";
import { asyncHandler, createHttpError, requestMeta } from "@/utils/http";

export const registrationRouter = Router();

registrationRouter.get(
  "/",
  authorize("registrations:read"),
  asyncHandler(async (_request, response) => {
    const records = await prisma.registrationAttempt.findMany({
      orderBy: {
        initiatedAt: "desc",
      },
    });

    response.json(records.map(mapRegistrationAttempt));
  }),
);

registrationRouter.post(
  "/:id/retry",
  authorize("registrations:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const registration = await prisma.registrationAttempt.findUnique({
      where: { id },
    });

    if (!registration) {
      throw createHttpError(404, "Registratiepoging niet gevonden.", "registration_not_found");
    }

    const updated = await prisma.registrationAttempt.update({
      where: { id: registration.id },
      data: {
        status: "pending",
        errorMessage: null,
        completedAt: null,
      },
    });

    await auditService.record({
      actor: request.sessionUser!.name,
      actorRole: request.sessionUser!.role,
      action: "registration.retry_requested",
      entityType: "RegistrationAttempt",
      entityId: registration.id,
      summary: `Retry aangevraagd voor ${registration.fqdn}.`,
      ...requestMeta(request),
    });

    response.json(mapRegistrationAttempt(updated));
  }),
);
