import type { ReactNode } from "react";

import { Breadcrumbs } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Breadcrumbs items={breadcrumbs} />
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-950">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
