import { useMemo, useState } from "react";

import { AuditLogTable, Card, Input, PageHeader, Select } from "@/components";
import { useAuditLogsQuery } from "@/hooks/use-platform-data";

export function AuditLogsPage() {
  const auditQuery = useAuditLogsQuery();
  const [actorFilter, setActorFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    if (!auditQuery.data) {
      return [];
    }

    return auditQuery.data.filter((log) => {
      if (actorFilter !== "all" && log.actorRole !== actorFilter) {
        return false;
      }

      if (resultFilter !== "all" && log.result !== resultFilter) {
        return false;
      }

      if (search) {
        const haystack = `${log.actor} ${log.action} ${log.summary}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }

      return true;
    });
  }, [actorFilter, auditQuery.data, resultFilter, search]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Start", href: "/dashboard" }, { label: "Auditlogs" }]}
        description="Filterbare audit trail voor login-events, wijzigingen, checks en registraracties inclusief actor, IP en resultaat."
        title="Auditlogs"
      />

      <Card className="mb-6" subtitle="Filter op actorrol, resultaat en vrije tekst." title="Filters">
        <div className="grid gap-4 md:grid-cols-3">
          <Select value={actorFilter} onChange={(event) => setActorFilter(event.target.value)}>
            <option value="all">Alle rollen</option>
            <option value="ADMIN">Beheerder</option>
            <option value="SECURITY_ANALYST">Security-analist</option>
            <option value="OPERATOR">Operator</option>
          </Select>
          <Select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
            <option value="all">Alle resultaten</option>
            <option value="success">Gelukt</option>
            <option value="failed">Mislukt</option>
          </Select>
          <Input onChange={(event) => setSearch(event.target.value)} placeholder="Zoek in auditspoor..." value={search} />
        </div>
      </Card>

      <Card subtitle="Wie deed wat, wanneer, vanaf welk IP en met welk resultaat." title="Auditregels">
        <AuditLogTable logs={filteredLogs} />
      </Card>
    </div>
  );
}
