import { Router } from "express";
import { z } from "zod";

import { domainWatchFormSchema, supportedTlds } from "@whoischecker/shared";

import { authorize } from "@/middleware/authorize";
import { csrfMiddleware } from "@/middleware/csrf";
import { domainWatchService } from "@/services/container";
import { asyncHandler, requestMeta } from "@/utils/http";

const tldFilterValues = [...supportedTlds, "all"] as const;

const filterSchema = z.object({
  state: z.enum(["active", "attention", "paused", "all"]).optional(),
  autoRegisterEnabled: z.enum(["all", "enabled", "disabled"]).optional(),
  ownerId: z.string().optional(),
  tag: z.string().optional(),
  tld: z.enum(tldFilterValues).optional(),
});

function actorMeta(request: Parameters<typeof requestMeta>[0]) {
  return {
    actorName: request.sessionUser!.name,
    actorRole: request.sessionUser!.role,
    ...requestMeta(request),
  };
}

function getRouteId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export const domainRouter = Router();

domainRouter.get(
  "/",
  authorize("domains:read"),
  asyncHandler(async (request, response) => {
    const filters = filterSchema.parse(request.query);
    response.json(await domainWatchService.list(filters));
  }),
);

domainRouter.post(
  "/",
  authorize("domains:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    const payload = domainWatchFormSchema.parse(request.body);
    response.status(201).json(await domainWatchService.create(payload, actorMeta(request)));
  }),
);

domainRouter.get(
  "/:id",
  authorize("domains:read"),
  asyncHandler(async (request, response) => {
    response.json(await domainWatchService.getById(getRouteId(request.params.id)));
  }),
);

domainRouter.patch(
  "/:id",
  authorize("domains:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await domainWatchService.update(getRouteId(request.params.id), request.body, actorMeta(request)));
  }),
);

domainRouter.post(
  "/:id/manual-check",
  authorize("domains:check"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await domainWatchService.triggerManualCheck(getRouteId(request.params.id), actorMeta(request)));
  }),
);

domainRouter.post(
  "/:id/pause",
  authorize("domains:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await domainWatchService.setState(getRouteId(request.params.id), "paused", actorMeta(request)));
  }),
);

domainRouter.post(
  "/:id/resume",
  authorize("domains:write"),
  csrfMiddleware,
  asyncHandler(async (request, response) => {
    response.json(await domainWatchService.setState(getRouteId(request.params.id), "active", actorMeta(request)));
  }),
);
