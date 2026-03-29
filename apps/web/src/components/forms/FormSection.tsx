import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("space-y-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-5", className)}>
      <header>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
