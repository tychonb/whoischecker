import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "http_error",
    public expose = true,
  ) {
    super(message);
  }
}

export function createHttpError(statusCode: number, message: string, code?: string) {
  return new HttpError(statusCode, message, code);
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function requestMeta(request: Request) {
  return {
    requestId: request.requestId,
    ipAddress: request.clientIp,
    userAgent: request.get("user-agent") ?? "unknown",
  };
}
