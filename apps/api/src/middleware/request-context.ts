import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContextMiddleware(request: Request, _response: Response, next: NextFunction) {
  request.requestId = randomUUID();
  request.clientIp = request.ip || request.socket.remoteAddress || "unknown";

  next();
}
