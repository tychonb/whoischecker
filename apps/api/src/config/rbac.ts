import type { RoleKey } from "@whoischecker/shared";

export const permissions = [
  "dashboard:read",
  "domains:read",
  "domains:write",
  "domains:check",
  "settings:read",
  "settings:write",
  "audit:read",
  "registrations:read",
  "registrations:write",
  "users:read",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissionMap: Record<RoleKey, Permission[]> = {
  ADMIN: [...permissions],
  SECURITY_ANALYST: [
    "dashboard:read",
    "domains:read",
    "domains:write",
    "domains:check",
    "settings:read",
    "audit:read",
    "registrations:read",
  ],
  OPERATOR: ["dashboard:read", "domains:read", "domains:check", "audit:read", "registrations:read"],
  VIEWER: ["dashboard:read", "domains:read", "audit:read", "registrations:read"],
};

export function hasPermission(role: RoleKey, permission: Permission) {
  return rolePermissionMap[role].includes(permission);
}
