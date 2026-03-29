import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Card({ title, subtitle, action, children, className, contentClassName }: CardProps) {
  return (
    <section className={cn("panel-surface overflow-hidden", className)}>
      {title || subtitle || action ? (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            {title ? <h2 className="text-sm font-semibold text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("px-6 py-5", contentClassName)}>{children}</div>
    </section>
  );
}
