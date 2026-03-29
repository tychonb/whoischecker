import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DomainFilters,
  DomainWatchFormValues,
  LoginInput,
  NotificationSettingsValues,
  OpenproviderSettingsValues,
} from "@whoischecker/shared";

import { apiClient } from "@/api/client";
import { useAppShellStore } from "@/store/app-shell-store";

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.getDashboardMetrics(),
  });
}

export function useDomainWatchesQuery(filters?: DomainFilters) {
  return useQuery({
    queryKey: ["domains", filters],
    queryFn: () => apiClient.listDomainWatches(filters),
  });
}

export function useDomainWatchQuery(id?: string) {
  return useQuery({
    queryKey: ["domain", id],
    queryFn: () => apiClient.getDomainWatch(id!),
    enabled: Boolean(id),
  });
}

export function useCreateDomainMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DomainWatchFormValues) => apiClient.createDomainWatch(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domains"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.getSettings(),
  });
}

export function useAuditLogsQuery() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => apiClient.listAuditLogs(),
  });
}

export function useRegistrationAttemptsQuery() {
  return useQuery({
    queryKey: ["registrations"],
    queryFn: () => apiClient.listRegistrationAttempts(),
  });
}

export function useLoginMutation() {
  const setSessionUser = useAppShellStore((state) => state.setSessionUser);
  const setCsrfToken = useAppShellStore((state) => state.setCsrfToken);

  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.login(input),
    onSuccess: (payload) => {
      setSessionUser(payload.user);
      setCsrfToken(payload.csrfToken);
    },
  });
}

export function useLogoutMutation() {
  const setSessionUser = useAppShellStore((state) => state.setSessionUser);
  const setCsrfToken = useAppShellStore((state) => state.setCsrfToken);

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      setSessionUser(null);
      setCsrfToken(null);
    },
  });
}

export function useManualCheckMutation(domainId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.triggerManualCheck(domainId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      void queryClient.invalidateQueries({ queryKey: ["domains"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useToggleDomainStateMutation(domainId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (state: "active" | "paused") => apiClient.toggleDomainState(domainId, state),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      void queryClient.invalidateQueries({ queryKey: ["domains"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useSaveDomainMutation(domainId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<DomainWatchFormValues>) => apiClient.saveDomainWatch(domainId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      void queryClient.invalidateQueries({ queryKey: ["domains"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, NotificationSettingsValues>({
    mutationFn: (payload: NotificationSettingsValues) => apiClient.updateNotificationSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateOpenproviderSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, OpenproviderSettingsValues>({
    mutationFn: (payload: OpenproviderSettingsValues) => apiClient.updateOpenproviderSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useSendTestNotificationMutation() {
  return useMutation<{ status: string; message?: string; detail?: string }, Error, void>({
    mutationFn: () => apiClient.sendTestNotification(),
  });
}

export function useTestOpenproviderMutation() {
  return useMutation<{ ok: boolean; detail: string; metadataSummary?: string; responseCode?: string }, Error, void>({
    mutationFn: () => apiClient.testOpenprovider(),
  });
}
