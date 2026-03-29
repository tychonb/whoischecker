import type {
  AppSettings,
  AuditLog,
  DomainWatchFormValues,
  DashboardMetrics,
  DomainFilters,
  DomainWatch,
  RegistrationAttempt,
  SessionUser,
} from "@whoischecker/shared";
import type {
  LoginInput,
  NotificationSettingsValues,
  OpenproviderSettingsValues,
} from "@whoischecker/shared";

import { useAppShellStore } from "@/store/app-shell-store";

import { mockApi } from "./mock-api";

const apiMode = import.meta.env.VITE_API_MODE ?? "live";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const csrfToken = useAppShellStore.getState().csrfToken;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestUrl =
    baseUrl && normalizedPath.startsWith(`${baseUrl}/`) ? normalizedPath : `${baseUrl}${normalizedPath}`;
  const response = await fetch(requestUrl || normalizedPath, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.method && init.method !== "GET" && csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed.");
  }

  return (await response.json()) as T;
}

export const apiClient = {
  login: (input: LoginInput) =>
    apiMode === "mock"
      ? mockApi.login(input.email, input.password)
      : request<{ user: SessionUser; csrfToken: string }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(input),
        }),

  logout: () =>
    apiMode === "mock"
      ? mockApi.logout()
      : request<boolean>("/api/auth/logout", {
          method: "POST",
        }),

  getSession: () =>
    apiMode === "mock" ? mockApi.getSession() : request<SessionUser | null>("/api/auth/me"),

  getDashboardMetrics: () =>
    apiMode === "mock" ? mockApi.getDashboardMetrics() : request<DashboardMetrics>("/api/dashboard"),

  listDomainWatches: (filters?: DomainFilters) => {
    if (apiMode === "mock") {
      return mockApi.listDomainWatches(filters);
    }

    const query = new URLSearchParams();
    if (filters?.state && filters.state !== "all") {
      query.set("state", filters.state);
    }
    if (filters?.autoRegisterEnabled && filters.autoRegisterEnabled !== "all") {
      query.set("autoRegisterEnabled", filters.autoRegisterEnabled);
    }
    if (filters?.tld && filters.tld !== "all") {
      query.set("tld", filters.tld);
    }
    if (filters?.ownerId && filters.ownerId !== "all") {
      query.set("ownerId", filters.ownerId);
    }
    if (filters?.tag && filters.tag !== "all") {
      query.set("tag", filters.tag);
    }

    return request<DomainWatch[]>(`/api/domains?${query.toString()}`);
  },

  getDomainWatch: (id: string) =>
    apiMode === "mock" ? mockApi.getDomainWatch(id) : request<DomainWatch>(`/api/domains/${id}`),

  createDomainWatch: (payload: DomainWatchFormValues) =>
    apiMode === "mock"
      ? mockApi.createDomainWatch(payload)
      : request<DomainWatch>("/api/domains", {
          method: "POST",
          body: JSON.stringify(payload),
        }),

  triggerManualCheck: (id: string) =>
    apiMode === "mock"
      ? mockApi.triggerManualCheck(id)
      : request<DomainWatch>(`/api/domains/${id}/manual-check`, {
          method: "POST",
        }),

  toggleDomainState: (id: string, state: "active" | "paused") =>
    apiMode === "mock"
      ? mockApi.toggleDomainState(id, state)
      : request<DomainWatch>(`/api/domains/${id}/${state === "paused" ? "pause" : "resume"}`, {
          method: "POST",
        }),

  saveDomainWatch: (id: string, payload: Partial<DomainWatchFormValues>) =>
    apiMode === "mock"
      ? mockApi.saveDomainWatch(id, payload)
      : request<DomainWatch>(`/api/domains/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),

  getSettings: () =>
    apiMode === "mock" ? mockApi.getSettings() : request<AppSettings>("/api/settings"),

  updateNotificationSettings: (payload: NotificationSettingsValues) =>
    apiMode === "mock"
      ? mockApi.updateNotificationSettings(payload)
      : request<NotificationSettingsValues>("/api/settings/notifications", {
          method: "PUT",
          body: JSON.stringify(payload),
        }),

  updateOpenproviderSettings: (payload: OpenproviderSettingsValues) =>
    apiMode === "mock"
      ? mockApi.updateOpenproviderSettings(payload)
      : request<OpenproviderSettingsValues>("/api/settings/openprovider", {
          method: "PUT",
          body: JSON.stringify(payload),
        }),

  sendTestNotification: () =>
    apiMode === "mock"
      ? mockApi.sendTestNotification()
      : request<{ status: string; message?: string; detail?: string }>("/api/settings/notifications/test", {
          method: "POST",
        }),

  testOpenprovider: () =>
    apiMode === "mock"
      ? mockApi.testOpenprovider()
      : request<{ ok: boolean; detail: string; metadataSummary?: string; responseCode?: string }>("/api/settings/openprovider/test", {
          method: "POST",
        }),

  listAuditLogs: () =>
    apiMode === "mock" ? mockApi.listAuditLogs() : request<AuditLog[]>("/api/audit-logs"),

  listRegistrationAttempts: () =>
    apiMode === "mock"
      ? mockApi.listRegistrationAttempts()
      : request<RegistrationAttempt[]>("/api/registrations"),
};
