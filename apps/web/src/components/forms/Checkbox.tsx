import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onCheckedChange, label }: CheckboxProps) {
  return (
    <button
      className="inline-flex items-center gap-3 text-left text-sm text-slate-700"
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border transition",
          checked ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      {label}
    </button>
  );
}
