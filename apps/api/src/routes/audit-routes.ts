import { Router } from "express";

import { authorize } from "@/middleware/authorize";
import { auditService } from "@/services/container";
import { asyncHandler } from "@/utils/http";

export const auditRouter = Router();

auditRouter.get(
  "/",
  authorize("audit:read"),
  asyncHandler(async (_request, response) => {
    response.json(await auditService.list());
  }),
);
