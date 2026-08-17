import { cn } from "@/lib/utils";

export interface FilterOption {
  id: number;
  name: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: number | "all";
  onChange: (id: number | "all") => void;
  allLabel: string;
}

export function FilterPills({ options, selected, onChange, allLabel }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
          selected === "all"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
        )}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
            selected === option.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}