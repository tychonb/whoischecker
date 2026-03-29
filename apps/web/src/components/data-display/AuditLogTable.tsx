import type { AuditLog } from "@whoischecker/shared";

import { formatDateTime } from "@/lib/format";

import { StatusPill } from "../feedback/StatusPill";
import { Table, type TableColumn } from "./Table";

interface AuditLogTableProps {
  logs: AuditLog[];
}

function formatRole(role: AuditLog["actorRole"]) {
  switch (role) {
    case "ADMIN":
      return "Beheerder";
    case "SECURITY_ANALYST":
      return "Security-analist";
    case "OPERATOR":
      return "Operator";
    case "VIEWER":
      return "Lezer";
    default:
      return role;
  }
}

const columns: TableColumn<AuditLog>[] = [
  {
    key: "timestamp",
    header: "Moment",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{formatDateTime(row.timestamp)}</p>
        <p className="text-xs text-slate-500">{row.ipAddress}</p>
      </div>
    ),
  },
  {
    key: "actor",
    header: "Uitvoerder",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.actor}</p>
        <p className="text-xs text-slate-500">{formatRole(row.actorRole)}</p>
      </div>
    ),
  },
  {
    key: "action",
    header: "Actie",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.action}</p>
        <p className="text-xs text-slate-500">{row.summary}</p>
      </div>
    ),
  },
  {
    key: "result",
    header: "Resultaat",
    render: (row) => <StatusPill status={row.result === "success" ? "success" : "failed"} />,
  },
];

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return <Table columns={columns} data={logs} rowKey={(row) => row.id} />;
}
