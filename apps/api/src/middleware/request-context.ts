import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContextMiddleware(request: Request, _response: Response, next: NextFunction) {
  request.requestId = randomUUID();
  request.clientIp =
    request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? request.socket.remoteAddress ?? "unknown";

  next();
}
