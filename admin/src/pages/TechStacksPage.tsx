import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { slugify } from "@/lib/types";
import type { AdminTechStack } from "@/lib/types";

interface FormState {
  id?: number;
  name: string;
  slug: string;
  sort_order: number;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  sort_order: 0,
};

export function TechStacksPage() {
  const { data: stacks, loading, refetch } = useApi<AdminTechStack[]>(() =>
    adminApi.get("/admin/tech-stacks"),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ ...emptyForm, sort_order: (stacks ?? []).length });
    setOpen(true);
  }

  function openEdit(stack: AdminTechStack) {
    setForm({
      id: stack.id,
      name: stack.name,
      slug: stack.slug,
      sort_order: stack.sort_order,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Nama dan slug wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.put(`/admin/tech-stacks/${form.id}`, form);
        toast.success("Tech stack diperbarui");
      } else {
        await adminApi.post("/admin/tech-stacks", form);
        toast.success("Tech stack ditambahkan");
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(stack: AdminTechStack) {
    if (!confirm(`Hapus tech stack "${stack.name}"?`)) return;
    try {
      await adminApi.delete(`/admin/tech-stacks/${stack.id}`);
      toast.success("Tech stack dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tech Stack</h1>
          <p className="text-sm text-muted-foreground">Daftar teknologi yang dapat dipakai proyek.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" /> Tambah
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (stacks ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada tech stack.
                </TableCell>
              </TableRow>
            ) : (
              (stacks ?? []).map((stack) => (
                <TableRow key={stack.id}>
                  <TableCell className="font-medium">{stack.name}</TableCell>
                  <TableCell className="text-muted-foreground">{stack.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{stack.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(stack)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(stack)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Tech Stack" : "Tambah Tech Stack"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="React"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex gap-2">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value).replace(/-/g, ".").replace(/\.\.+/g, ".") })}
                  placeholder="react"
                  disabled={!!form.id}
                />
                {!form.id && form.name && !form.slug && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ ...form, slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, ".") })}
                  >
                    Buat dari nama
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}