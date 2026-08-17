import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface CheckboxOption {
  id: number;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  emptyText?: string;
}

export function CheckboxGroup({ options, selected, onChange, emptyText }: CheckboxGroupProps) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText ?? "Belum ada pilihan."}</p>;
  }

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border p-3">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
        >
          <Checkbox
            checked={selected.includes(option.id)}
            onCheckedChange={() => toggle(option.id)}
          />
          <Label className="cursor-pointer font-normal">{option.label}</Label>
        </label>
      ))}
    </div>
  );
}