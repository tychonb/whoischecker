import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DataGridProps {
  children: ReactNode;
  className?: string;
}

export function DataGrid({ children, className }: DataGridProps) {
  return <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
