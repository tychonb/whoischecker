import type { NextFunction, Request, Response } from "express";

import { createHttpError } from "@/utils/http";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfMiddleware(request: Request, _response: Response, next: NextFunction) {
  if (safeMethods.has(request.method.toUpperCase())) {
    next();
    return;
  }

  const cookieToken = request.cookies?.csrf_token;
  const headerToken = request.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(createHttpError(403, "Ongeldig CSRF-token.", "invalid_csrf"));
    return;
  }

  next();
}
