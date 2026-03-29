import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "@/config/env";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import { apiRateLimit } from "@/middleware/rate-limit";
import { requestContextMiddleware } from "@/middleware/request-context";
import { auditRouter } from "@/routes/audit-routes";
import { authRouter } from "@/routes/auth-routes";
import { dashboardRouter } from "@/routes/dashboard-routes";
import { domainRouter } from "@/routes/domain-routes";
import { registrationRouter } from "@/routes/registration-routes";
import { settingsRouter } from "@/routes/settings-routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use(requestContextMiddleware);
  app.use(apiRateLimit);

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", authMiddleware, dashboardRouter);
  app.use("/api/domains", authMiddleware, domainRouter);
  app.use("/api/settings", authMiddleware, settingsRouter);
  app.use("/api/audit-logs", authMiddleware, auditRouter);
  app.use("/api/registrations", authMiddleware, registrationRouter);
  app.use(errorHandler);

  return app;
}
