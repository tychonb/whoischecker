import { cn } from "@/lib/cn";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              active ? "border-primary-200 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300",
            )}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 rounded-full border",
                  active ? "border-[5px] border-primary-600 bg-white" : "border-slate-300 bg-white",
                )}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                {option.description ? <p className="mt-1 text-xs text-slate-500">{option.description}</p> : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
