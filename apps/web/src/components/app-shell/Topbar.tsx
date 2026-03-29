import { Bell, PanelLeft, Search, ShieldCheck } from "lucide-react";

import { useAppShellStore } from "@/store/app-shell-store";

import { Button } from "../feedback/Button";

export function Topbar() {
  const { globalSearch, setGlobalSearch, sessionUser, toggleSidebar } = useAppShellStore();
  const roleLabel =
    sessionUser?.role === "ADMIN"
      ? "Beheerder"
      : sessionUser?.role === "SECURITY_ANALYST"
        ? "Security-analist"
        : sessionUser?.role === "OPERATOR"
          ? "Operator"
          : sessionUser?.role === "VIEWER"
            ? "Lezer"
            : "Niet aangemeld";

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-[var(--app-bg)]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-8 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button onClick={toggleSidebar} size="sm" variant="secondary">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-2xl border border-white/70 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Zoek op domein, team of gebeurtenis..."
              value={globalSearch}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 md:flex">
            <ShieldCheck className="h-4 w-4" />
            Beveiligingscontroles actief
          </div>
          <Button size="sm" variant="secondary">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {sessionUser?.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("") ?? "WC"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-900">{sessionUser?.name ?? "Gast"}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
