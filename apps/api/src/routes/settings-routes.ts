import { Router } from "express";

import { notificationSettingsSchema, openproviderSettingsSchema } from "@whoischecker/shared";

import { authorize } from "@/middleware/authorize";
import { csrfMiddleware } from "@/middleware/csrf";
import { settingsService } from "@/services/container";
import { asyncHandler, requestMeta } from "@/utils/http";

function settingsActor(request: Parameters<typeof requestMeta>[0]) {
  return {
    actor: request.sessionUser!.name,
    actorRole: request.sessionUser!.role,
    ...requestMeta(request),
  };
}

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  authorize("settings:read"),
  asyncHandler(async (_request, response) => {
    response.json(await settingsService.get());
  }),
);

settingsRouter.put(
  "/notifications",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    const payload = notificationSettingsSchema.parse(request.body);
    response.json(await settingsService.updateNotifications(payload, request.sessionUser!.id, settingsActor(request)));
  }),
);

settingsRouter.post(
  "/notifications/test",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await settingsService.testNotification(settingsActor(request)));
  }),
);

settingsRouter.put(
  "/openprovider",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    const payload = openproviderSettingsSchema.parse(request.body);
    response.json(await settingsService.updateOpenprovider(payload, request.sessionUser!.id, settingsActor(request)));
  }),
);

settingsRouter.post(
  "/openprovider/test",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await settingsService.testOpenprovider(settingsActor(request)));
  }),
);
