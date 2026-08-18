import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulletListInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BulletListInput({ value, onChange, placeholder }: BulletListInputProps) {
  const items = value ? value.split("\n") : [];

  function update(i: number, text: string) {
    const next = [...items];
    next[i] = text;
    onChange(next.join("\n"));
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i).join("\n"));
  }

  function add() {
    onChange([...items, ""].join("\n"));
  }

  return (
    <div className="space-y-2">
      {(items.length ? items : [""]).map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
          <Input
            value={line}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
          />
          {items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => remove(i)}
              aria-label="Hapus poin"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 size-4" /> Tambah poin
      </Button>
    </div>
  );
}