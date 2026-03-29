import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  widthClassName?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  className?: string;
}

export function Table<T>({ columns, data, rowKey, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-slate-100", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "border-b border-slate-100 px-5 py-4 font-semibold",
                    column.align === "right" && "text-right",
                    column.widthClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((row) => (
              <tr key={rowKey(row)} className="transition hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-slate-100 px-5 py-4 align-top text-slate-600 last:border-b-0",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
