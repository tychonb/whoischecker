import type { SessionUser } from "@whoischecker/shared";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      clientIp: string;
      sessionUser?: SessionUser;
    }
  }
}

export {};
