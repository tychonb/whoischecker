import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/utils/http";

export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: error.expose ? error.message : "Request failed.",
      code: error.code,
      requestId: request.requestId,
    });
    return;
  }

  response.status(500).json({
    error: "Internal server error.",
    code: "internal_error",
    requestId: request.requestId,
  });
}
