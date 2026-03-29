import { Router } from "express";

import { notificationSettingsSchema, openproviderSettingsSchema } from "@whoischecker/shared";

import { authorize } from "@/middleware/authorize";
import { csrfMiddleware } from "@/middleware/csrf";
import { settingsService } from "@/services/container";
import { asyncHandler } from "@/utils/http";

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
    response.json(await settingsService.updateNotifications(payload, request.sessionUser?.id));
  }),
);

settingsRouter.post(
  "/notifications/test",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (_request, response) => {
    response.json(await settingsService.testNotification());
  }),
);

settingsRouter.put(
  "/openprovider",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    const payload = openproviderSettingsSchema.parse(request.body);
    response.json(await settingsService.updateOpenprovider(payload, request.sessionUser?.id));
  }),
);

settingsRouter.post(
  "/openprovider/test",
  authorize("settings:write"),
  csrfMiddleware,
  asyncHandler(async (_request, response) => {
    response.json(await settingsService.testOpenprovider());
  }),
);
