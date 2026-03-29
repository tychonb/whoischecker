import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Save, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";

import { domainWatchFormSchema, supportedTlds, type DomainWatchFormValues } from "@whoischecker/shared";

import {
  ActivityTimeline,
  AuditLogTable,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FormLabel,
  FormSection,
  Input,
  MultiSelect,
  PageHeader,
  RadioGroup,
  Select,
  StatusPill,
  Toggle,
} from "@/components";
import { formatDateTime, titleCase } from "@/lib/format";
import {
  useAuditLogsQuery,
  useDomainWatchQuery,
  useManualCheckMutation,
  useRegistrationAttemptsQuery,
  useSaveDomainMutation,
  useToggleDomainStateMutation,
} from "@/hooks/use-platform-data";

const tldOptions = supportedTlds.map((tld) => ({ label: tld, value: tld }));

export function DomainDetailPage() {
  const { domainId } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const domainQuery = useDomainWatchQuery(domainId);
  const auditQuery = useAuditLogsQuery();
  const registrationsQuery = useRegistrationAttemptsQuery();
  const manualCheckMutation = useManualCheckMutation(domainId!);
  const toggleStateMutation = useToggleDomainStateMutation(domainId!);
  const saveMutation = useSaveDomainMutation(domainId!);

  const form = useForm<DomainWatchFormValues>({
    resolver: zodResolver(domainWatchFormSchema),
    defaultValues: {
      rootName: "",
      selectedTlds: [],
      frequency: "every_15_minutes",
      actionMode: "NOTIFY",
      priority: "normal",
      tags: [],
      notes: "",
      ownerId: "",
      teamId: "",
      ntfyEnabled: false,
      ntfyTopic: "",
      autoRegisterEnabled: false,
    },
  });

  useEffect(() => {
    if (!domainQuery.data) {
      return;
    }

    form.reset({
      rootName: domainQuery.data.rootName,
      selectedTlds: domainQuery.data.extensions.map((extension) => extension.tld),
      frequency: domainQuery.data.frequency,
      customSchedule: domainQuery.data.customSchedule,
      actionMode: domainQuery.data.actionMode,
      priority: domainQuery.data.priority,
      tags: domainQuery.data.tags,
      notes: domainQuery.data.notes,
      ownerId: domainQuery.data.owner.id,
      teamId: domainQuery.data.team?.id,
      ntfyEnabled: domainQuery.data.ntfyEnabled,
      ntfyTopic: domainQuery.data.ntfyTopic,
      autoRegisterEnabled: domainQuery.data.autoRegisterEnabled,
    });
  }, [domainQuery.data, form]);

  const domain = domainQuery.data;

  const filteredAuditLogs = useMemo(
    () => auditQuery.data?.filter((log) => log.entityId === domainId) ?? [],
    [auditQuery.data, domainId],
  );

  const relatedRegistrations = useMemo(
    () => registrationsQuery.data?.filter((item) => item.domainWatchId === domainId) ?? [],
    [registrationsQuery.data, domainId],
  );

  if (domainQuery.isLoading) {
    return <div className="text-sm text-slate-500">Domeindetail wordt geladen...</div>;
  }

  if (!domain) {
    return <div className="text-sm text-rose-600">Domeindetail niet gevonden.</div>;
  }

  return (
    <div>
      <PageHeader
        actions={
          <>
            <Button
              disabled={manualCheckMutation.isPending}
              leadingIcon={<Play className="h-4 w-4" />}
              onClick={() => manualCheckMutation.mutate()}
              variant="secondary"
            >
              {manualCheckMutation.isPending ? "Controleren..." : "Handmatige check"}
            </Button>
            <Button
              leadingIcon={domain.state === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              onClick={() => setConfirmOpen(true)}
              variant={domain.state === "paused" ? "primary" : "secondary"}
            >
              {domain.state === "paused" ? "Monitoring hervatten" : "Monitoring pauzeren"}
            </Button>
          </>
        }
        breadcrumbs={[
          { label: "Start", href: "/dashboard" },
          { label: "Domeinen", href: "/domains" },
          { label: domain.rootName },
        ]}
        description="Configuratie, extensiestatus, auditspoor en registrar-automatisering voor deze monitor."
        title={domain.rootName}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card subtitle="Kernstatus van monitoring, notificatierouting en eigenaarschap." title="Overzicht">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Status", value: <StatusPill status={domain.state} /> },
                { label: "Actiemodus", value: <StatusPill status={domain.actionMode === "AUTO_REGISTER" ? "enabled" : "disabled"} /> },
                { label: "Eigenaar", value: <span className="font-semibold text-slate-900">{domain.owner.name}</span> },
                { label: "Volgende check", value: <span className="font-semibold text-slate-900">{formatDateTime(domain.nextCheckAt)}</span> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
                  <div className="mt-2">{item.value}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card subtitle="Beheer frequentie, extensies, escalatiepad en ntfy-override." title="Configuratie">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                await saveMutation.mutateAsync(values);
              })}
            >
              <FormSection description="Rootterm, geselecteerde extensies en controlefrequentie." title="Monitoringbereik">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormLabel label="Rootnaam">
                    <Input error={form.formState.errors.rootName?.message} {...form.register("rootName")} />
                  </FormLabel>
                  <FormLabel label="Frequentie">
                    <Select error={form.formState.errors.frequency?.message} {...form.register("frequency")}>
                      <option value="every_5_minutes">Elke 5 minuten</option>
                      <option value="every_15_minutes">Elke 15 minuten</option>
                      <option value="hourly">Elk uur</option>
                      <option value="daily">Dagelijks</option>
                        <option value="custom">Aangepaste cron</option>
                    </Select>
                  </FormLabel>
                </div>

                {form.watch("frequency") === "custom" ? (
                  <FormLabel label="Aangepast schema">
                    <Input error={form.formState.errors.customSchedule?.message} {...form.register("customSchedule")} />
                  </FormLabel>
                ) : null}

                <FormLabel label="Extensies">
                  <Controller
                    control={form.control}
                    name="selectedTlds"
                    render={({ field }) => <MultiSelect onChange={field.onChange} options={tldOptions} value={field.value} />}
                  />
                </FormLabel>
              </FormSection>

              <FormSection description="Kies wat er gebeurt zodra een extensie beschikbaar wordt." title="Respons bij beschikbaarheid">
                <Controller
                  control={form.control}
                  name="actionMode"
                  render={({ field }) => (
                    <RadioGroup
                      onChange={(value) => field.onChange(value)}
                      options={[
                        { label: "Alleen loggen", value: "LOG_ONLY", description: "Alleen audit en historie." },
                        { label: "Notificeren", value: "NOTIFY", description: "Stuur notificaties zonder registrarflow." },
                        {
                          label: "Auto-register",
                          value: "AUTO_REGISTER",
                          description: "Verifieer opnieuw en stuur door naar Openprovider.",
                        },
                      ]}
                      value={field.value}
                    />
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormLabel label="Prioriteit">
                    <Select error={form.formState.errors.priority?.message} {...form.register("priority")}>
                      <option value="low">Laag</option>
                      <option value="normal">Normaal</option>
                      <option value="high">Hoog</option>
                    </Select>
                  </FormLabel>
                  <FormLabel label="Eigenaar-ID">
                    <Input error={form.formState.errors.ownerId?.message} {...form.register("ownerId")} />
                  </FormLabel>
                </div>

                <FormLabel label="Tags">
                  <Input
                    onChange={(event) =>
                      form.setValue(
                        "tags",
                        event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="merk, prioriteit-1, juridisch"
                    value={form.watch("tags").join(", ")}
                  />
                </FormLabel>

                <FormLabel label="Notities">
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                    {...form.register("notes")}
                  />
                </FormLabel>
              </FormSection>

              <FormSection description="Per domein ntfy-override en auto-registerbeleid." title="Notificatie en registrar">
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="ntfyEnabled"
                    render={({ field }) => <Toggle checked={field.value} label="Ntfy inschakelen voor dit domein" onCheckedChange={field.onChange} />}
                  />
                  <Controller
                    control={form.control}
                    name="autoRegisterEnabled"
                    render={({ field }) => (
                      <Toggle checked={field.value} label="Openprovider auto-register inschakelen" onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <FormLabel label="Domeinspecifiek ntfy-topic">
                  <Input error={form.formState.errors.ntfyTopic?.message} {...form.register("ntfyTopic")} />
                </FormLabel>
              </FormSection>

              {saveMutation.isSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Configuratie opgeslagen. Server-side validatie en audit logging zijn gekoppeld in de backendlaag.
                </div>
              ) : null}

              <Button disabled={saveMutation.isPending} leadingIcon={<Save className="h-4 w-4" />} type="submit">
                {saveMutation.isPending ? "Opslaan..." : "Configuratie opslaan"}
              </Button>
            </form>
          </Card>

          <Card subtitle="Beschikbaarheidsstatus per extensie met provider, latency en retry-signalen." title="Extensies en historie">
            <div className="space-y-4">
              {domain.extensions.map((extension) => (
                <div key={extension.id} className="rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-950">{extension.fqdn}</h3>
                        <StatusPill status={extension.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{extension.rawSummary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {extension.notifyEnabled ? <Badge tone="primary">Notificeren</Badge> : null}
                      {extension.autoRegisterEnabled ? <Badge tone="success">Auto-register</Badge> : null}
                      {extension.registrationStatus ? <StatusPill status={extension.registrationStatus} /> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {[
                      { label: "Provider", value: extension.sourceProvider },
                      { label: "Latentie", value: `${extension.latencyMs ?? "?"} ms` },
                      { label: "Retry-aantal", value: String(extension.retryCount) },
                      { label: "Laatst gecontroleerd", value: formatDateTime(extension.lastCheckedAt) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card subtitle="Auditbare domeinevents en door workers geïnitieerde transities." title="Activiteitstijdlijn">
            <ActivityTimeline
              items={filteredAuditLogs.map((log) => ({
                id: log.id,
                title: log.action,
                detail: log.summary,
                timestamp: log.timestamp,
                tone: log.severity === "critical" ? "critical" : log.severity === "warning" ? "warning" : "info",
              }))}
            />
          </Card>

          <Card subtitle="Idempotente registrarflow en foutmetadata." title="Registratiequeue">
            <div className="space-y-4">
              {relatedRegistrations.length === 0 ? (
                <p className="text-sm text-slate-500">Nog geen registratiepogingen voor dit domein.</p>
              ) : (
                relatedRegistrations.map((attempt) => (
                  <div key={attempt.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{attempt.fqdn}</p>
                        <p className="text-sm text-slate-500">{attempt.provider}</p>
                      </div>
                      <StatusPill status={attempt.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Idempotentiesleutel: <span className="font-medium text-slate-700">{attempt.idempotencyKey}</span>
                    </p>
                    {attempt.errorMessage ? (
                      <p className="mt-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {attempt.errorMessage}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card subtitle="Beveiligingshouding voor deze monitor." title="Besturingsvlak">
            <div className="space-y-4 text-sm text-slate-500">
              <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Auto-register-beveiliging</p>
                    <p className="mt-1">
                      Backend reconfirmeert availability, gebruikt locks en schrijft een audit-entry voordat een registrar-call vertrekt.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                Laatste check: <span className="font-medium text-slate-700">{formatDateTime(domain.lastCheckAt)}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                Team: <span className="font-medium text-slate-700">{domain.team?.name ?? "Niet toegewezen"}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                Frequentielabel: <span className="font-medium text-slate-700">{titleCase(domain.frequency)}</span>
              </div>
            </div>
          </Card>

          <Card subtitle="Wie deed wat, wanneer en met welk resultaat." title="Auditspoor">
            <AuditLogTable logs={filteredAuditLogs} />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel={domain.state === "paused" ? "Hervatten" : "Pauzeren"}
        description={
          domain.state === "paused"
            ? "Monitoring wordt hervat en de scheduler kan de monitor opnieuw in de check-queue plaatsen."
            : "Monitoring wordt gepauzeerd. Lopende jobs kunnen nog afronden maar nieuwe checks worden geblokkeerd."
        }
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await toggleStateMutation.mutateAsync(domain.state === "paused" ? "active" : "paused");
          setConfirmOpen(false);
        }}
        open={confirmOpen}
        title={domain.state === "paused" ? "Monitoring hervatten" : "Monitoring pauzeren"}
      />
    </div>
  );
}
