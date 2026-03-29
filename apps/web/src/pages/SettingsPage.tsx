import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { BellRing, CheckCircle2, Cloud, KeyRound, ShieldCheck, TestTube2 } from "lucide-react";
import { useEffect } from "react";

import {
  notificationSettingsSchema,
  openproviderSettingsSchema,
  type NotificationSettingsValues,
  type OpenproviderSettingsValues,
} from "@whoischecker/shared";

import {
  Button,
  Card,
  FormLabel,
  FormSection,
  Input,
  PageHeader,
  SecretField,
  Table,
  Toggle,
} from "@/components";
import {
  useSendTestNotificationMutation,
  useSettingsQuery,
  useTestOpenproviderMutation,
  useUpdateNotificationSettingsMutation,
  useUpdateOpenproviderSettingsMutation,
} from "@/hooks/use-platform-data";

export function SettingsPage() {
  const settingsQuery = useSettingsQuery();
  const saveNotificationMutation = useUpdateNotificationSettingsMutation();
  const saveOpenproviderMutation = useUpdateOpenproviderSettingsMutation();
  const testNotificationMutation = useSendTestNotificationMutation();
  const testOpenproviderMutation = useTestOpenproviderMutation();

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      ntfyEnabled: true,
      ntfyServerUrl: "https://ntfy.sh",
      ntfyTopic: "platform-domain-monitoring",
      ntfyAuthToken: "",
      webhookEnabled: false,
      webhookUrl: "",
      emailEnabled: true,
    },
  });

  const openproviderForm = useForm<OpenproviderSettingsValues>({
    resolver: zodResolver(openproviderSettingsSchema),
    defaultValues: {
      enabled: true,
      username: "",
      password: "",
      ownerHandle: "CP000000-NL",
      adminHandle: "CP000000-NL",
      techHandle: "CP000000-NL",
      billingHandle: "CP000000-NL",
      nsGroup: "op-default",
      testMode: true,
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    notificationForm.reset({
      ntfyEnabled: settingsQuery.data.notifications.ntfy.enabled,
      ntfyServerUrl: settingsQuery.data.notifications.ntfy.serverUrl,
      ntfyTopic: settingsQuery.data.notifications.ntfy.topic,
      ntfyAuthToken: "",
      webhookEnabled: settingsQuery.data.notifications.webhookEnabled,
      webhookUrl: settingsQuery.data.notifications.webhookUrl ?? "",
      emailEnabled: settingsQuery.data.notifications.emailEnabled,
    });

    openproviderForm.reset({
      enabled: settingsQuery.data.openprovider.enabled,
      username: "",
      password: "",
      ownerHandle: settingsQuery.data.openprovider.ownerHandle,
      adminHandle: settingsQuery.data.openprovider.adminHandle,
      techHandle: settingsQuery.data.openprovider.techHandle,
      billingHandle: settingsQuery.data.openprovider.billingHandle,
      nsGroup: settingsQuery.data.openprovider.nsGroup,
      testMode: settingsQuery.data.openprovider.testMode,
    });
  }, [notificationForm, openproviderForm, settingsQuery.data]);

  if (settingsQuery.isLoading) {
    return <div className="text-sm text-slate-500">Instellingen worden geladen...</div>;
  }

  if (!settingsQuery.data) {
    return <div className="text-sm text-rose-600">Kon instellingen niet laden.</div>;
  }

  const settings = settingsQuery.data;

  return (
    <div>
      <PageHeader
        actions={<Button leadingIcon={<ShieldCheck className="h-4 w-4" />}>Beveiligingshouding bekijken</Button>}
        breadcrumbs={[{ label: "Start", href: "/dashboard" }, { label: "Instellingen" }]}
        description="Openprovider, ntfy, providercontrols, retentie en rolmodellen voor het platform."
        title="Platforminstellingen"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card subtitle="Ingebouwde ntfy.sh-ondersteuning, webhookrouting en aflevercontroles." title="Notificatieconfiguratie">
            <form
              className="space-y-5"
              onSubmit={notificationForm.handleSubmit(async (values) => {
                await saveNotificationMutation.mutateAsync(values);
              })}
            >
              <FormSection description="Per gebruiker en per domein kan later worden ge-override, maar deze waarden vormen de veilige standaard." title="NTFY">
                <Controller
                  control={notificationForm.control}
                  name="ntfyEnabled"
                  render={({ field }) => <Toggle checked={field.value} label="Ntfy-aflevering inschakelen" onCheckedChange={field.onChange} />}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormLabel label="Server-URL">
                    <Input error={notificationForm.formState.errors.ntfyServerUrl?.message} {...notificationForm.register("ntfyServerUrl")} />
                  </FormLabel>
                  <FormLabel label="Standaardtopic">
                    <Input error={notificationForm.formState.errors.ntfyTopic?.message} {...notificationForm.register("ntfyTopic")} />
                  </FormLabel>
                </div>
                <FormLabel label="Auth-token">
                  <SecretField error={notificationForm.formState.errors.ntfyAuthToken?.message} {...notificationForm.register("ntfyAuthToken")} />
                </FormLabel>
              </FormSection>

              <FormSection description="Uitbreidbare architectuur voor e-mail, webhook en later Slack." title="Fallback-kanalen">
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={notificationForm.control}
                    name="emailEnabled"
                    render={({ field }) => <Toggle checked={field.value} label="E-mail inschakelen" onCheckedChange={field.onChange} />}
                  />
                  <Controller
                    control={notificationForm.control}
                    name="webhookEnabled"
                    render={({ field }) => <Toggle checked={field.value} label="Webhook inschakelen" onCheckedChange={field.onChange} />}
                  />
                </div>
                <FormLabel label="Webhook-URL">
                  <Input error={notificationForm.formState.errors.webhookUrl?.message} {...notificationForm.register("webhookUrl")} />
                </FormLabel>
              </FormSection>

              <div className="flex flex-wrap gap-3">
                <Button disabled={saveNotificationMutation.isPending} leadingIcon={<BellRing className="h-4 w-4" />} type="submit">
                  {saveNotificationMutation.isPending ? "Opslaan..." : "Notificatie-instellingen opslaan"}
                </Button>
                <Button
                  disabled={testNotificationMutation.isPending}
                  leadingIcon={<TestTube2 className="h-4 w-4" />}
                  onClick={() => testNotificationMutation.mutate()}
                  type="button"
                  variant="secondary"
                >
                  {testNotificationMutation.isPending ? "Verzenden..." : "Testnotificatie versturen"}
                </Button>
              </div>

              {testNotificationMutation.isSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {testNotificationMutation.data.message ?? testNotificationMutation.data.detail ?? "Testnotificatie verwerkt."}
                </div>
              ) : null}
            </form>
          </Card>

          <Card subtitle="Reseller-authenticatie, handles en registrar-gereedheid." title="Openprovider-registratie">
            <form
              className="space-y-5"
              onSubmit={openproviderForm.handleSubmit(async (values) => {
                await saveOpenproviderMutation.mutateAsync(values);
              })}
            >
              <FormSection
                description="Gebruikersnaam en wachtwoord blijven server-side en worden versleuteld opgeslagen. Laat een secret-veld leeg om een bestaand geheim te behouden."
                title="Inloggegevens"
              >
                <Controller
                  control={openproviderForm.control}
                  name="enabled"
                  render={({ field }) => <Toggle checked={field.value} label="Openprovider-integratie inschakelen" onCheckedChange={field.onChange} />}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormLabel label="Gebruikersnaam">
                    <Input error={openproviderForm.formState.errors.username?.message} {...openproviderForm.register("username")} />
                  </FormLabel>
                  <FormLabel label="Wachtwoord">
                    <SecretField error={openproviderForm.formState.errors.password?.message} {...openproviderForm.register("password")} />
                  </FormLabel>
                </div>
              </FormSection>

              <FormSection description="Deze handles en nameservergroep worden gebruikt bij createDomainRequest." title="Registratieprofiel">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormLabel label="Owner handle">
                    <Input error={openproviderForm.formState.errors.ownerHandle?.message} {...openproviderForm.register("ownerHandle")} />
                  </FormLabel>
                  <FormLabel label="Admin handle">
                    <Input error={openproviderForm.formState.errors.adminHandle?.message} {...openproviderForm.register("adminHandle")} />
                  </FormLabel>
                  <FormLabel label="Tech handle">
                    <Input error={openproviderForm.formState.errors.techHandle?.message} {...openproviderForm.register("techHandle")} />
                  </FormLabel>
                  <FormLabel label="Billing handle">
                    <Input error={openproviderForm.formState.errors.billingHandle?.message} {...openproviderForm.register("billingHandle")} />
                  </FormLabel>
                </div>
                <FormLabel label="NS-group">
                  <Input error={openproviderForm.formState.errors.nsGroup?.message} {...openproviderForm.register("nsGroup")} />
                </FormLabel>
                <Controller
                  control={openproviderForm.control}
                  name="testMode"
                  render={({ field }) => <Toggle checked={field.value} label="Proefdraaien / testmodus" onCheckedChange={field.onChange} />}
                />
              </FormSection>

              <div className="flex flex-wrap gap-3">
                <Button disabled={saveOpenproviderMutation.isPending} leadingIcon={<Cloud className="h-4 w-4" />} type="submit">
                  {saveOpenproviderMutation.isPending ? "Opslaan..." : "Openprovider-instellingen opslaan"}
                </Button>
                <Button
                  disabled={testOpenproviderMutation.isPending}
                  leadingIcon={<TestTube2 className="h-4 w-4" />}
                  onClick={() => testOpenproviderMutation.mutate()}
                  type="button"
                  variant="secondary"
                >
                  {testOpenproviderMutation.isPending ? "Controleren..." : "Openprovider-verbinding testen"}
                </Button>
              </div>

              {testOpenproviderMutation.data ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    testOpenproviderMutation.data.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <p>{testOpenproviderMutation.data.detail}</p>
                  {testOpenproviderMutation.data.metadataSummary ? (
                    <p className="mt-1 text-xs opacity-80">{testOpenproviderMutation.data.metadataSummary}</p>
                  ) : null}
                </div>
              ) : null}
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card subtitle="Rolmodel voor RBAC en server-side autorisatie." title="Gebruikers en rollen">
            <Table
              columns={[
                {
                  key: "name",
                  header: "Rol",
                  render: (row) => (
                    <div>
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.key}</p>
                    </div>
                  ),
                },
                {
                  key: "description",
                  header: "Rechten",
                  render: (row) => <p className="max-w-md text-sm text-slate-500">{row.description}</p>,
                },
              ]}
              data={settings.roles}
              rowKey={(row) => row.id}
            />
          </Card>

          <Card subtitle="Providerdefaults, retentie en fallbackgedrag." title="Providerconfiguratie">
            <div className="space-y-4">
              {[
                {
                  label: "WHOIS-fallback",
                  value: settings.providerConfig.whoisFallbackEnabled ? "Ingeschakeld" : "Uitgeschakeld",
                  icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
                },
                {
                  label: "Retentie",
                  value: `${settings.providerConfig.retentionDays} dagen`,
                  icon: <KeyRound className="h-5 w-5 text-primary-600" />,
                },
                {
                  label: "Generiek eindpunt",
                  value: settings.providerConfig.genericWhoisEndpoint,
                  icon: <Cloud className="h-5 w-5 text-slate-500" />,
                },
              ].map((entry) => (
                <div key={entry.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  {entry.icon}
                  <div>
                    <p className="font-semibold text-slate-900">{entry.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card subtitle="Samenvatting van safeguards die in backend en jobs zijn voorzien." title="Beveiligingshouding">
            <div className="space-y-4 text-sm text-slate-500">
              {[
                "Versleutelde providercredentials via AES-GCM en door omgevingsvariabelen beheerd sleutelmateriaal.",
                "Rate limiting, CSRF-tokencontrole en server-side rolchecks op muterende endpoints.",
                "Idempotente registratiepogingen met locking, retries en auditregels vóór side effects.",
                "Geen secrets in de frontend-bundle; alleen gemaskeerde configuratiestatus wordt aan de UI getoond.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
