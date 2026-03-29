import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, Plus, Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import type { DomainFilters, DomainWatch, DomainWatchFormValues } from "@whoischecker/shared";
import { domainWatchFormSchema, mockDomainWatches, supportedTlds } from "@whoischecker/shared";

import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  FormLabel,
  FormSection,
  Input,
  MultiSelect,
  PageHeader,
  RadioGroup,
  Select,
  StatusPill,
  Table,
  Toggle,
} from "@/components";
import { formatDateTime, titleCase } from "@/lib/format";
import { useCreateDomainMutation, useDomainWatchesQuery } from "@/hooks/use-platform-data";
import { useAppShellStore } from "@/store/app-shell-store";

export function DomainsPage() {
  const globalSearch = useAppShellStore((state) => state.globalSearch);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<DomainFilters>({
    state: "all",
    autoRegisterEnabled: "all",
    ownerId: "all",
    tag: "all",
    tld: "all",
  });

  const domainsQuery = useDomainWatchesQuery(filters);
  const createMutation = useCreateDomainMutation();
  const createForm = useForm<DomainWatchFormValues>({
    resolver: zodResolver(domainWatchFormSchema),
    defaultValues: {
      rootName: "",
      selectedTlds: [".nl", ".com"],
      frequency: "every_15_minutes",
      actionMode: "NOTIFY",
      priority: "normal",
      tags: ["brand"],
      notes: "",
      ownerId: "user-1",
      teamId: "team-1",
      ntfyEnabled: true,
      ntfyTopic: "",
      autoRegisterEnabled: false,
    },
  });

  const owners = useMemo(
    () =>
      Array.from(new Map(mockDomainWatches.map((watch) => [watch.owner.id, watch.owner])).values()),
    [],
  );
  const tags = useMemo(() => Array.from(new Set(mockDomainWatches.flatMap((watch) => watch.tags))), []);

  const visibleRows = useMemo(() => {
    if (!domainsQuery.data) {
      return [];
    }

    const query = globalSearch.trim().toLowerCase();

    if (!query) {
      return domainsQuery.data;
    }

    return domainsQuery.data.filter((watch) => {
      const haystack = [
        watch.rootName,
        watch.displayName,
        watch.owner.name,
        watch.tags.join(" "),
        watch.extensions.map((extension) => extension.fqdn).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [domainsQuery.data, globalSearch]);

  return (
    <div>
      <PageHeader
        actions={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>
            Nieuwe monitor
          </Button>
        }
        breadcrumbs={[{ label: "Start", href: "/dashboard" }, { label: "Domeinen" }]}
        description="Beheer roottermen, extensies, notificatieroutes en registrar-automatisering vanuit één overzicht."
        title="Domeinmonitoring"
      />

      <Card
        action={<Filter className="h-4 w-4 text-slate-400" />}
        className="mb-6"
        subtitle="Filter op operationele status, auto-register, TLD, eigenaar en tags."
        title="Filters"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value as DomainFilters["state"] }))}>
            <option value="all">Alle statuses</option>
            <option value="active">Actief</option>
            <option value="attention">Aandacht</option>
            <option value="paused">Gepauzeerd</option>
          </Select>
          <Select
            value={filters.autoRegisterEnabled}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                autoRegisterEnabled: event.target.value as DomainFilters["autoRegisterEnabled"],
              }))
            }
          >
            <option value="all">Auto-register: alle</option>
            <option value="enabled">Ingeschakeld</option>
            <option value="disabled">Uitgeschakeld</option>
          </Select>
          <Select value={filters.tld} onChange={(event) => setFilters((current) => ({ ...current, tld: event.target.value as DomainFilters["tld"] }))}>
            <option value="all">Alle TLD’s</option>
            {supportedTlds.map((tld) => (
              <option key={tld} value={tld}>
                {tld}
              </option>
            ))}
          </Select>
          <Select
            value={filters.ownerId}
            onChange={(event) => setFilters((current) => ({ ...current, ownerId: event.target.value as DomainFilters["ownerId"] }))}
          >
            <option value="all">Alle eigenaren</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </Select>
          <Select value={filters.tag} onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value as DomainFilters["tag"] }))}>
            <option value="all">Alle tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
          <Search className="h-4 w-4 text-slate-400" />
          De globale zoekbalk uit de topbar filtert live op domeinnaam, eigenaar en tags.
        </div>
      </Card>

      {domainsQuery.isLoading ? (
        <div className="text-sm text-slate-500">Domeinen worden geladen...</div>
      ) : visibleRows.length === 0 ? (
        <EmptyState
          description="Geen monitoren gevonden voor de huidige combinatie van filters en zoekterm."
          title="Geen resultaten"
        />
      ) : (
        <Card subtitle="Rustige enterprise tabelweergave met status, extensies en operationele flags." title="Actief monitoringoverzicht">
          <Table
            columns={[
              {
                key: "rootName",
                header: "Rootnaam",
                render: (row: DomainWatch) => (
                  <div>
                    <Link className="font-semibold text-slate-900 transition hover:text-primary-600" to={`/domains/${row.id}`}>
                      {row.rootName}
                    </Link>
                    <p className="text-xs text-slate-500">{row.displayName}</p>
                  </div>
                ),
              },
              {
                key: "extensions",
                header: "Extensies",
                render: (row: DomainWatch) => (
                  <div className="flex flex-wrap gap-2">
                    {row.extensions.map((extension) => (
                      <Badge key={extension.id} tone={extension.status === "available" ? "success" : "neutral"}>
                        {extension.tld}
                      </Badge>
                    ))}
                  </div>
                ),
              },
              {
                key: "frequency",
                header: "Frequentie",
                render: (row: DomainWatch) => (
                  <div>
                    <p className="font-medium text-slate-900">{titleCase(row.frequency)}</p>
                    {row.customSchedule ? <p className="text-xs text-slate-500">{row.customSchedule}</p> : null}
                  </div>
                ),
              },
              {
                key: "lastCheck",
                header: "Laatste check",
                render: (row: DomainWatch) => (
                  <div>
                    <p className="font-medium text-slate-900">{formatDateTime(row.lastCheckAt)}</p>
                    <p className="text-xs text-slate-500">Volgende: {formatDateTime(row.nextCheckAt)}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row: DomainWatch) => <StatusPill status={row.state} />,
              },
              {
                key: "flags",
                header: "Kenmerken",
                render: (row: DomainWatch) => (
                  <div className="space-y-2">
                    <StatusPill status={row.autoRegisterEnabled ? "enabled" : "disabled"} />
                    <div className="text-xs text-slate-500">
                      Openprovider: {row.registrarLinked ? "gekoppeld" : "niet gekoppeld"}
                    </div>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Acties",
                align: "right",
                render: (row: DomainWatch) => (
                  <div className="flex justify-end">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      to={`/domains/${row.id}`}
                    >
                      Detail openen
                    </Link>
                  </div>
                ),
              },
            ]}
            data={visibleRows}
            rowKey={(row) => row.id}
          />
        </Card>
      )}

      <Drawer onClose={() => setDrawerOpen(false)} open={drawerOpen} title="Nieuwe domeinmonitor aanmaken">
        <form
          className="space-y-5"
          onSubmit={createForm.handleSubmit(async (values) => {
            await createMutation.mutateAsync(values);
            createForm.reset();
            setDrawerOpen(false);
          })}
        >
          <FormSection description="Nieuwe rootterm plus extensies en interval." title="Monitoringbereik">
            <FormLabel label="Rootnaam">
              <Input error={createForm.formState.errors.rootName?.message} {...createForm.register("rootName")} />
            </FormLabel>

            <FormLabel label="Extensies">
              <Controller
                control={createForm.control}
                name="selectedTlds"
                render={({ field }) => (
                  <MultiSelect
                    onChange={field.onChange}
                    options={supportedTlds.map((tld) => ({ label: tld, value: tld }))}
                    value={field.value}
                  />
                )}
              />
            </FormLabel>

            <FormLabel label="Frequentie">
              <Select error={createForm.formState.errors.frequency?.message} {...createForm.register("frequency")}>
                <option value="every_5_minutes">Elke 5 minuten</option>
                <option value="every_15_minutes">Elke 15 minuten</option>
                  <option value="hourly">Elk uur</option>
                  <option value="daily">Dagelijks</option>
                  <option value="custom">Aangepaste cron</option>
                </Select>
              </FormLabel>

            {createForm.watch("frequency") === "custom" ? (
              <FormLabel label="Aangepast schema">
                <Input
                  error={createForm.formState.errors.customSchedule?.message}
                  {...createForm.register("customSchedule")}
                />
              </FormLabel>
            ) : null}
          </FormSection>

          <FormSection description="Beschikbaarheidsactie, ntfy-routing en auto-registerbeleid." title="Responsbeleid">
            <Controller
              control={createForm.control}
              name="actionMode"
              render={({ field }) => (
                <RadioGroup
                  onChange={field.onChange}
                  options={[
                    { label: "Alleen loggen", value: "LOG_ONLY", description: "Alleen audit en historie." },
                    { label: "Notificeren", value: "NOTIFY", description: "Stuur ntfy/webhook zonder registrarflow." },
                    { label: "Auto-register", value: "AUTO_REGISTER", description: "Openprovider-flow na beschikbaarheid." },
                  ]}
                  value={field.value}
                />
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={createForm.control}
                name="ntfyEnabled"
                render={({ field }) => (
                  <Toggle checked={field.value} label="Ntfy inschakelen" onCheckedChange={field.onChange} />
                )}
              />
              <Controller
                control={createForm.control}
                name="autoRegisterEnabled"
                render={({ field }) => (
                  <Toggle checked={field.value} label="Auto-register inschakelen" onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <FormLabel label="Ntfy topic-override">
              <Input error={createForm.formState.errors.ntfyTopic?.message} {...createForm.register("ntfyTopic")} />
            </FormLabel>
          </FormSection>

          <FormSection description="Tags en eigenaarschap blijven onderdeel van de basisconfiguratie." title="Eigenaarschap">
            <div className="grid gap-4 md:grid-cols-2">
              <FormLabel label="Eigenaar">
                <Select {...createForm.register("ownerId")}>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </Select>
              </FormLabel>
              <FormLabel label="Team">
                <Select {...createForm.register("teamId")}>
                  <option value="team-1">Merkbescherming</option>
                  <option value="team-2">Corporate IT</option>
                </Select>
              </FormLabel>
            </div>

            <FormLabel label="Prioriteit">
              <Select {...createForm.register("priority")}>
                <option value="low">Laag</option>
                <option value="normal">Normaal</option>
                <option value="high">Hoog</option>
              </Select>
            </FormLabel>

            <FormLabel label="Tags">
              <Input
                onChange={(event) =>
                  createForm.setValue(
                    "tags",
                    event.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="merk, prioriteit-1, juridisch"
                value={createForm.watch("tags").join(", ")}
              />
            </FormLabel>
          </FormSection>

          {createMutation.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {createMutation.error.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button onClick={() => setDrawerOpen(false)} variant="secondary">
              Annuleren
            </Button>
            <Button disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? "Aanmaken..." : "Monitor aanmaken"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
