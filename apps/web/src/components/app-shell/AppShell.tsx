import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useAppShellStore } from "@/store/app-shell-store";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useAppShellStore();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-900">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className={cn("min-h-screen transition-all", sidebarCollapsed ? "pl-[98px]" : "pl-[288px]")}>
        <Topbar />
        <main className="px-8 pb-10 pt-8">
          <div className="mx-auto max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
