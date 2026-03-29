import { Clock3 } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

interface TimelineItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: "info" | "success" | "warning" | "critical";
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

const toneClasses = {
  info: "bg-primary-50 text-primary-700 ring-primary-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  critical: "bg-rose-50 text-rose-700 ring-rose-100",
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pl-1">
          {index < items.length - 1 ? <span className="absolute left-[13px] top-9 h-[calc(100%-12px)] w-px bg-slate-200" /> : null}
          <div
            className={cn(
              "relative z-10 mt-1 flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset",
              toneClasses[item.tone],
            )}
          >
            <Clock3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{item.title}</p>
              <span className="text-xs text-slate-500">{formatDateTime(item.timestamp)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
