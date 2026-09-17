import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import type { UserRepository } from "@/repositories/user-repository";
import { createHttpError } from "@/utils/http";
import { verifyPassword } from "@/utils/crypto";
import type { AuditService } from "@/services/audit-service";

interface AuthMeta {
  ipAddress: string;
  userAgent: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string, meta: AuthMeta) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      await this.auditService.record({
        actor: email,
        actorRole: "VIEWER",
        action: "auth.login.failed",
        entityType: "User",
        entityId: user?.id ?? "unknown",
        summary: "Mislukte inlogpoging.",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        severity: "warning",
        result: "failed",
      });

      throw createHttpError(401, "Ongeldige inloggegevens.", "invalid_credentials");
    }

    const sessionUser = this.userRepository.toSessionUser(user);
    const sessionToken = jwt.sign(
      {
        sub: sessionUser.id,
        role: sessionUser.role,
        tokenVersion: user.tokenVersion,
      },
      env.JWT_SECRET,
      {
        expiresIn: "12h",
      },
    );
    const csrfToken = randomBytes(24).toString("hex");

    await this.userRepository.updateLastLogin(sessionUser.id, new Date());

    await this.auditService.record({
      actor: sessionUser.name,
      actorRole: sessionUser.role,
      action: "auth.login.success",
      entityType: "User",
      entityId: sessionUser.id,
      summary: "Succesvolle aanmelding.",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: sessionUser,
      sessionToken,
      csrfToken,
    };
  }

  async verifySessionToken(token: string) {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      sub: string;
      tokenVersion: number;
    };
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw createHttpError(401, "Niet geautoriseerd.", "unauthorized");
    }

    return this.userRepository.toSessionUser(user);
  }

  revokeSessions(userId: string) {
    return this.userRepository.revokeSessions(userId);
  }
}
