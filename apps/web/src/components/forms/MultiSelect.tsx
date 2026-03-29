import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (nextValue: string[]) => void;
}

export function MultiSelect({ options, value, onChange }: MultiSelectProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value);

          return (
            <button
              key={option.value}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                active
                  ? "border-primary-200 bg-primary-50 text-primary-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
              onClick={() =>
                onChange(
                  active ? value.filter((entry) => entry !== option.value) : [...value, option.value],
                )
              }
              type="button"
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  active ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 text-transparent",
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
