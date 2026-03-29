import { Router } from "express";
import { z } from "zod";

import { env } from "@/config/env";
import { authRateLimit } from "@/middleware/rate-limit";
import { authMiddleware } from "@/middleware/auth";
import { csrfMiddleware } from "@/middleware/csrf";
import { authService } from "@/services/container";
import { asyncHandler, requestMeta } from "@/utils/http";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export const authRouter = Router();

authRouter.post(
  "/login",
  authRateLimit,
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const result = await authService.login(payload.email, payload.password, requestMeta(request));

    response
      .cookie("session_token", result.sessionToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: env.COOKIE_SECURE,
        maxAge: 12 * 60 * 60 * 1000,
      })
      .cookie("csrf_token", result.csrfToken, {
        httpOnly: false,
        sameSite: "strict",
        secure: env.COOKIE_SECURE,
        maxAge: 12 * 60 * 60 * 1000,
      })
      .json({
        user: result.user,
        csrfToken: result.csrfToken,
      });
  }),
);

authRouter.get(
  "/me",
  authMiddleware,
  asyncHandler(async (request, response) => {
    response.json(request.sessionUser);
  }),
);

authRouter.post(
  "/logout",
  authMiddleware,
  csrfMiddleware,
  asyncHandler(async (_request, response) => {
    response.clearCookie("session_token").clearCookie("csrf_token").json({ ok: true });
  }),
);
