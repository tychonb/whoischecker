import type { NextFunction, Request, Response } from "express";

import type { Permission } from "@/config/rbac";
import { hasPermission } from "@/config/rbac";
import { createHttpError } from "@/utils/http";

export function authorize(permission: Permission) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.sessionUser) {
      next(createHttpError(401, "Authenticatie is vereist.", "auth_required"));
      return;
    }

    if (!hasPermission(request.sessionUser.role, permission)) {
      next(createHttpError(403, "Toegang geweigerd.", "forbidden"));
      return;
    }

    next();
  };
}
