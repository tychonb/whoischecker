import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  ChevronDown,
  CloudCog,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Logs,
  ShieldCheck,
  Users2,
  Waypoints,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";

interface SidebarProps {
  collapsed: boolean;
}

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    to: string;
    icon: LucideIcon;
    badge?: string;
  }>;
}

const navSections: NavSection[] = [
  {
    title: "Menu",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Domeinen", to: "/domains", icon: Waypoints },
      { label: "Auditlogs", to: "/audit-logs", icon: Logs },
      { label: "Systeemstatus", to: "/system-health", icon: Gauge },
    ],
  },
  {
    title: "Ondersteuning",
    items: [
      { label: "Notificaties", to: "/settings", icon: BellRing, badge: "NTFY" },
      { label: "Openprovider", to: "/settings", icon: CloudCog },
    ],
  },
  {
    title: "Overig",
    items: [
      { label: "Gebruikers & rollen", to: "/users", icon: Users2 },
      { label: "Beveiliging", to: "/settings", icon: ShieldCheck },
      { label: "Help", to: "/help", icon: LifeBuoy },
    ],
  },
];

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-200/80 bg-white/95 px-5 py-6 backdrop-blur-xl transition-all",
        collapsed ? "w-[98px]" : "w-[288px]",
      )}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-100">
          WC
        </div>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold text-slate-900">WhoisChecker</p>
            <p className="text-xs text-slate-500">Veilige domeinmonitoring</p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto pr-1">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed ? <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{section.title}</p> : null}
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )
                  }
                  to={item.to}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary-600" : "text-slate-400")} />
                      {!collapsed ? (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-300" />
                          )}
                        </>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
