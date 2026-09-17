import { Router } from "express";

import { authorize } from "@/middleware/authorize";
import { csrfMiddleware } from "@/middleware/csrf";
import { prisma } from "@/lib/prisma";
import { getQueues } from "@/jobs/queues";
import { mapRegistrationAttempt } from "@/repositories/mappers";
import { auditService } from "@/services/container";
import { asyncHandler, createHttpError, requestMeta } from "@/utils/http";
import { domainWatchScope } from "@/utils/authorization-scope";

export const registrationRouter = Router();

registrationRouter.get(
  "/",
  authorize("registrations:read"),
  asyncHandler(async (request, response) => {
    const records = await prisma.registrationAttempt.findMany({
      where: { domainWatch: domainWatchScope(request.sessionUser!) },
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
      where: { id, domainWatch: domainWatchScope(request.sessionUser!) },
    });

    if (!registration) {
      throw createHttpError(404, "Registratiepoging niet gevonden.", "registration_not_found");
    }

    const isDryRun = registration.status === "submitted" && ["OP-TEST-MODE", "OP-DELIVERY-DISABLED"].includes(registration.responseCode ?? "");
    if (registration.status !== "failed" && !isDryRun) {
      throw createHttpError(409, "Alleen mislukte registratiepogingen kunnen opnieuw worden gestart.", "registration_not_retryable");
    }

    const updated = await prisma.registrationAttempt.update({
      where: { id: registration.id },
      data: {
        status: "pending",
        errorMessage: null,
        completedAt: null,
      },
    });

    await getQueues().registrations.add(
      `retry:${registration.id}`,
      { registrationAttemptId: registration.id },
      {
        jobId: `retry:${registration.id}:${Date.now()}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

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
