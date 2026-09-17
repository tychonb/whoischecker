import { Router } from "express";

import { authorize } from "@/middleware/authorize";
import { dashboardService } from "@/services/container";
import { asyncHandler } from "@/utils/http";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  authorize("dashboard:read"),
  asyncHandler(async (request, response) => {
    response.json(await dashboardService.getMetrics(request.sessionUser!));
  }),
);
