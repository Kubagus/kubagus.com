import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { slugify } from "@/lib/types";
import type { AdminCategory } from "@/lib/types";

type CatType = "blog" | "project";

interface FormState {
  id?: number;
  type: CatType;
  name_id: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

const emptyForm: FormState = {
  type: "blog",
  name_id: "",
  name_en: "",
  slug: "",
  sort_order: 0,
};

export function CategoriesPage() {
  const [tab, setTab] = useState<CatType>("blog");
  const { data: categories, loading, refetch } = useApi<AdminCategory[]>(
    () => adminApi.get(`/admin/categories?type=${tab}`),
    [tab],
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ ...emptyForm, type: tab, sort_order: (categories ?? []).length });
    setOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      id: cat.id,
      type: cat.type,
      name_id: cat.name_id ?? "",
      name_en: cat.name_en ?? "",
      slug: cat.slug,
      sort_order: cat.sort_order,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.slug.trim() || (!form.name_id.trim() && !form.name_en.trim())) {
      toast.error("Slug dan nama (salah satu bahasa) wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.put(`/admin/categories/${form.id}`, form);
        toast.success("Kategori diperbarui");
      } else {
        await adminApi.post("/admin/categories", form);
        toast.success("Kategori ditambahkan");
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: AdminCategory) {
    if (!confirm(`Hapus kategori "${cat.name_id || cat.name_en}"?`)) return;
    try {
      await adminApi.delete(`/admin/categories/${cat.id}`);
      toast.success("Kategori dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
          <p className="text-sm text-muted-foreground">Kategori untuk artikel blog dan proyek.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" /> Tambah
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CatType)}>
        <TabsList>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="project">Proyek</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="rounded-lg border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama (ID)</TableHead>
                  <TableHead>Nama (EN)</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (categories ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Belum ada kategori.
                    </TableCell>
                  </TableRow>
                ) : (
                  (categories ?? []).map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name_id || "—"}</TableCell>
                      <TableCell>{cat.name_en || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell>
                        <Badge variant={cat.type === "blog" ? "secondary" : "outline"}>
                          {cat.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cat.sort_order}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => remove(cat)}
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
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe</Label>
              <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={form.type === "blog" ? "default" : "ghost"}
                  onClick={() => setForm({ ...form, type: "blog" })}
                >
                  Blog
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.type === "project" ? "default" : "ghost"}
                  onClick={() => setForm({ ...form, type: "project" })}
                >
                  Proyek
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama (ID)</Label>
                <Input value={form.name_id} onChange={(e) => setForm({ ...form, name_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nama (EN)</Label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex gap-2">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="nama-kategori"
                  disabled={!!form.id}
                />
                {!form.id && form.name_id && !form.slug && (
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, slug: slugify(form.name_id) })}>
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