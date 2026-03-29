import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AppShell } from "@/components";
import { useAppShellStore } from "@/store/app-shell-store";

import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DomainDetailPage } from "@/pages/DomainDetailPage";
import { DomainsPage } from "@/pages/DomainsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { SettingsPage } from "@/pages/SettingsPage";

function ProtectedLayout() {
  const sessionUser = useAppShellStore((state) => state.sessionUser);
  const sessionResolved = useAppShellStore((state) => state.sessionResolved);

  if (!sessionResolved) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Sessie wordt geladen...</div>;
  }

  if (!sessionUser) {
    return <Navigate replace to="/login" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/domains", element: <DomainsPage /> },
      { path: "/domains/:domainId", element: <DomainDetailPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/audit-logs", element: <AuditLogsPage /> },
      {
        path: "/system-health",
        element: (
          <PlaceholderPage
            description="Queue-observability, dead-letter-herstel en provider-SLO-dashboards kunnen hier verder worden uitgebouwd."
            title="Systeemstatus"
          />
        ),
      },
      {
        path: "/users",
        element: (
          <PlaceholderPage
            description="Gebruikersbeheer en fijnmazige roltoewijzing zijn voorbereid in de shared types en backendservices."
            title="Gebruikers en rollen"
          />
        ),
      },
      {
        path: "/help",
        element: (
          <PlaceholderPage
            description="Documentatie, runbooks en incidentworkflows kunnen hier direct aanhaken."
            title="Help"
          />
        ),
      },
    ],
  },
]);
