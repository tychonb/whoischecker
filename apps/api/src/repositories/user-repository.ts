import type { SessionUser } from "@whoischecker/shared";

import { prisma } from "@/lib/prisma";
import { mapUserToSessionUser } from "@/repositories/mappers";

const userInclude = {
  role: true,
  team: true,
} as const;

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userInclude,
    });
  }

  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });
  }

  async updateLastLogin(userId: string, at: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: at,
      },
      include: userInclude,
    });
  }

  async updateNtfyPreferences(
    userId: string,
    input: {
      ntfyEnabled: boolean;
      ntfyServerUrl: string;
      ntfyTopic: string;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ntfyEnabled: input.ntfyEnabled,
        ntfyServerUrl: input.ntfyServerUrl,
        ntfyTopic: input.ntfyTopic,
      },
      include: userInclude,
    });
  }

  toSessionUser(user: Awaited<ReturnType<UserRepository["findById"]>> extends infer T ? NonNullable<T> : never): SessionUser {
    return mapUserToSessionUser(user);
  }
}
