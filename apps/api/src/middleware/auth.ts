import type { NextFunction, Request, Response } from "express";

import { authService } from "@/services/container";
import { createHttpError } from "@/utils/http";

function resolveToken(request: Request) {
  const cookieToken = request.cookies?.session_token as string | undefined;
  const authHeader = request.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  return cookieToken ?? bearerToken;
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  const token = resolveToken(request);

  if (!token) {
    next(createHttpError(401, "Authenticatie is vereist.", "auth_required"));
    return;
  }

  void authService
    .verifySessionToken(token)
    .then((sessionUser) => {
      request.sessionUser = sessionUser;
      next();
    })
    .catch((error) => {
      next(error);
    });
}
