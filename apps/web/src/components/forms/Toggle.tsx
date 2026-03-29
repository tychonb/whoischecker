import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onCheckedChange, label, disabled }: ToggleProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "inline-flex items-center gap-3 rounded-full text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60",
      )}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}
