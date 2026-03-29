import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, error, ...props }, ref) {
  return (
    <div>
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-50",
          error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-50" : "border-slate-200",
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
});
