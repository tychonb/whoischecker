import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SessionUser } from "@whoischecker/shared";

interface AppShellState {
  sidebarCollapsed: boolean;
  globalSearch: string;
  sessionUser: SessionUser | null;
  csrfToken: string | null;
  sessionResolved: boolean;
  toggleSidebar: () => void;
  setGlobalSearch: (value: string) => void;
  setSessionUser: (value: SessionUser | null) => void;
  setCsrfToken: (value: string | null) => void;
  setSessionResolved: (value: boolean) => void;
}

export const useAppShellStore = create<AppShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      globalSearch: "",
      sessionUser: null,
      csrfToken: null,
      sessionResolved: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setGlobalSearch: (value) => set({ globalSearch: value }),
      setSessionUser: (value) => set({ sessionUser: value }),
      setCsrfToken: (value) => set({ csrfToken: value }),
      setSessionResolved: (value) => set({ sessionResolved: value }),
    }),
    {
      name: "whoischecker-shell",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sessionUser: state.sessionUser,
        csrfToken: state.csrfToken,
        sessionResolved: state.sessionResolved,
      }),
    },
  ),
);
