import { Activity, AlertTriangle, ArrowRight, Clock4, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge, Button, Card, DataGrid, PageHeader, StatusPill, ActivityTimeline } from "@/components";
import { formatDateTime, formatRelativeQueue } from "@/lib/format";
import { useDashboardQuery } from "@/hooks/use-platform-data";

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <div className="text-sm text-slate-500">Dashboard wordt geladen...</div>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <div className="text-sm text-rose-600">Kon dashboardgegevens niet laden.</div>;
  }

  const dashboard = dashboardQuery.data;

  return (
    <div>
      <PageHeader
        actions={
          <>
            <Button leadingIcon={<RefreshCcw className="h-4 w-4" />} variant="secondary">
              Queue verversen
            </Button>
            <Button leadingIcon={<Activity className="h-4 w-4" />}>Workerstatus bekijken</Button>
          </>
        }
        breadcrumbs={[{ label: "Start", href: "/dashboard" }, { label: "Dashboard" }]}
        description="Realtime overzicht van monitoringvolumes, beschikbaarheidsdetecties, queuegezondheid en beveiligingsrelevante gebeurtenissen."
        title="Monitoringdashboard"
      />

      <DataGrid>
        {dashboard.metrics.map((metric) => (
          <Card key={metric.id} className="min-h-[152px]" contentClassName="flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <Badge tone={metric.trend === "down" ? "warning" : "primary"}>{metric.delta}</Badge>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.delta}</p>
            </div>
          </Card>
        ))}
      </DataGrid>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card
            action={<Link className="text-sm font-semibold text-primary-600" to="/audit-logs">Auditspoor openen</Link>}
            subtitle="Beschikbaarheidsdetecties, escalaties en schedulergebeurtenissen van de laatste uren."
            title="Recente events"
          >
            <ActivityTimeline items={dashboard.recentEvents} />
          </Card>

          <Card subtitle="Providerstatus en herpogingsdruk per upstream integratie." title="Providerfouten en herpogingen">
            <div className="space-y-4">
              {dashboard.failuresByProvider.map((provider) => (
                <div key={provider.provider} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{provider.provider}</p>
                    <Badge tone={provider.failures > 2 ? "warning" : "neutral"}>{provider.failures} fouten</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-primary-600"
                      style={{ width: `${Math.min(100, provider.retries * 12)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{provider.retries} herpogingen in het laatste venster.</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card subtitle="Live zicht op de check- en registratiequeues." title="Queuestatus">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Wachtend", value: dashboard.queue.pending.toString() },
                { label: "Actief", value: dashboard.queue.active.toString() },
                { label: "Vertraagd", value: dashboard.queue.delayed.toString() },
                { label: "Mislukt", value: dashboard.queue.failed.toString() },
              ].map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{entry.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{entry.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card subtitle="Services, providers en queues met security-grade observability." title="Systeemstatus">
            <div className="space-y-4">
              {dashboard.systemHealth.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.summary}</p>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card subtitle="Beschikbare domeinen en queue-items die als volgende worden verwerkt." title="Operationele focus">
            <div className="space-y-4">
              {dashboard.recentAvailableDomains.map((extension) => (
                <div key={extension.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{extension.fqdn}</p>
                      <p className="mt-1 text-sm text-emerald-700">{extension.rawSummary}</p>
                    </div>
                    <StatusPill status={extension.status} />
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                {dashboard.upcomingChecks.map((job) => (
                  <div key={job.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{job.fqdn}</p>
                      <p className="text-xs text-slate-500">{job.owner}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{formatRelativeQueue(job.nextRunAt)}</p>
                      <p className="text-xs text-slate-400">
                        {job.queue === "domain-checks"
                          ? "domeinchecks"
                          : job.queue === "registration-attempts"
                            ? "registratiepogingen"
                            : job.queue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card subtitle="Fouten, drempels en prioriteiten die handmatige aandacht nodig hebben." title="Aandachtspunten">
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Provider-fallback actief voor `acmesecure.de`</p>
                  <p className="text-sm text-slate-500">Drempel bereikt op 29 maart 2026 om 15:00.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3">
                <Clock4 className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-900">Dead-letter-queue stabiel</p>
                  <p className="text-sm text-slate-500">2 mislukte jobs klaar voor inspectie en herpoging.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card subtitle="Snelle routes naar de schermen die operators het meest gebruiken." title="Snelle acties">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                title: "Domeinlijst openen",
                detail: "Filter op status, TLD of auto-register.",
                to: "/domains",
              },
              {
                title: "Auditlogs bekijken",
                detail: "Controleer login, wijzigingen en workergebeurtenissen.",
                to: "/audit-logs",
              },
              {
                title: "Notificaties instellen",
                detail: "NTFY, webhook en rolgebaseerde defaults.",
                to: "/settings",
              },
              {
                title: "Openprovider-configuratie bekijken",
                detail: "Valideer credentials, dry-run-modus en provider-scope.",
                to: "/settings",
              },
            ].map((action) => (
              <Link key={action.title} className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-primary-200 hover:bg-primary-50/50" to={action.to}>
                <p className="font-semibold text-slate-900">{action.title}</p>
                <p className="mt-1 text-sm text-slate-500">{action.detail}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600">
                  Openen
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
