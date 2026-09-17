import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@whoischecker/shared";

export function domainWatchScope(user: SessionUser): Prisma.DomainWatchWhereInput {
  if (user.role === "ADMIN") {
    return {};
  }

  return {
    OR: [
      { ownerId: user.id },
      ...(user.teamId ? [{ teamId: user.teamId }] : []),
    ],
  };
}
