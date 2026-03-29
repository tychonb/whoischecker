import type { AvailabilityStatus, DomainState, RegistrationStatus, SystemHealthStatus } from "@whoischecker/shared";

import { cn } from "@/lib/cn";

type StatusValue = AvailabilityStatus | DomainState | RegistrationStatus | SystemHealthStatus | "enabled" | "disabled";

interface StatusPillProps {
  status: StatusValue;
  className?: string;
}

const toneMap: Record<StatusValue, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  registered: "bg-slate-100 text-slate-700 ring-slate-200",
  unknown: "bg-amber-50 text-amber-700 ring-amber-200",
  rate_limited: "bg-amber-50 text-amber-700 ring-amber-200",
  provider_error: "bg-rose-50 text-rose-700 ring-rose-200",
  unsupported_tld: "bg-slate-100 text-slate-500 ring-slate-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paused: "bg-slate-100 text-slate-600 ring-slate-200",
  attention: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  degraded: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  enabled: "bg-primary-50 text-primary-700 ring-primary-100",
  disabled: "bg-slate-100 text-slate-500 ring-slate-200",
};

const labelMap: Record<StatusValue, string> = {
  available: "Beschikbaar",
  registered: "Geregistreerd",
  unknown: "Onbekend",
  rate_limited: "Rate-limited",
  provider_error: "Providerfout",
  unsupported_tld: "Niet ondersteund",
  active: "Actief",
  paused: "Gepauzeerd",
  attention: "Aandacht",
  pending: "Wachtend",
  submitted: "Verzonden",
  success: "Gelukt",
  failed: "Mislukt",
  healthy: "Gezond",
  degraded: "Verstoord",
  critical: "Kritiek",
  enabled: "Ingeschakeld",
  disabled: "Uitgeschakeld",
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        toneMap[status],
        className,
      )}
    >
      {labelMap[status]}
    </span>
  );
}
