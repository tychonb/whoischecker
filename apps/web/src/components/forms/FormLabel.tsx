import type { ReactNode } from "react";

interface FormLabelProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormLabel({ label, hint, htmlFor, children }: FormLabelProps) {
  return (
    <label className="block space-y-2" htmlFor={htmlFor}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
