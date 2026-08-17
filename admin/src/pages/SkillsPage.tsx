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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import type { AdminSkill } from "@/lib/types";

interface FormState {
  id?: number;
  name_id: string;
  name_en: string;
  category_id: string;
  category_en: string;
  icon: string;
  proficiency: number;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  name_id: "",
  name_en: "",
  category_id: "",
  category_en: "",
  icon: "",
  proficiency: 0,
  sort_order: 0,
  is_active: true,
};

export function SkillsPage() {
  const { data: skills, loading, refetch } = useApi<AdminSkill[]>(() => adminApi.get("/admin/skills"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ ...emptyForm, sort_order: (skills ?? []).length });
    setOpen(true);
  }

  function openEdit(skill: AdminSkill) {
    setForm({
      id: skill.id,
      name_id: skill.name_id ?? "",
      name_en: skill.name_en ?? "",
      category_id: skill.category_id ?? "",
      category_en: skill.category_en ?? "",
      icon: skill.icon ?? "",
      proficiency: skill.proficiency,
      sort_order: skill.sort_order,
      is_active: !!skill.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name_id.trim() && !form.name_en.trim()) {
      toast.error("Nama skill wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await adminApi.put(`/admin/skills/${form.id}`, form);
        toast.success("Skill diperbarui");
      } else {
        await adminApi.post("/admin/skills", form);
        toast.success("Skill ditambahkan");
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(skill: AdminSkill) {
    if (!confirm(`Hapus skill "${skill.name_id || skill.name_en}"?`)) return;
    try {
      await adminApi.delete(`/admin/skills/${skill.id}`);
      toast.success("Skill dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keahlian</h1>
          <p className="text-sm text-muted-foreground">Daftar skill dengan tingkat penguasaan.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" /> Tambah
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama (ID)</TableHead>
              <TableHead>Nama (EN)</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Penguasaan</TableHead>
              <TableHead>Aktif</TableHead>
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
            ) : (skills ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              (skills ?? []).map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name_id || "—"}</TableCell>
                  <TableCell>{skill.name_en || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {skill.category_id || skill.category_en || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{skill.proficiency}%</TableCell>
                  <TableCell>{skill.is_active ? "Ya" : "Tidak"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(skill)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(skill)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Skill" : "Tambah Skill"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="id">
            <TabsList>
              <TabsTrigger value="id">Indonesia</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="id" className="space-y-3">
              <div className="space-y-2">
                <Label>Nama (ID)</Label>
                <Input value={form.name_id} onChange={(e) => setForm({ ...form, name_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kategori (ID)</Label>
                <Input value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} placeholder="Frontend" />
              </div>
            </TabsContent>
            <TabsContent value="en" className="space-y-3">
              <div className="space-y-2">
                <Label>Name (EN)</Label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category (EN)</Label>
                <Input value={form.category_en} onChange={(e) => setForm({ ...form, category_en: e.target.value })} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Ikon</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="react" />
            </div>
            <div className="space-y-2">
              <Label>Penguasaan (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.proficiency}
                onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })}
              />
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

          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              id="skill-active"
            />
            <Label htmlFor="skill-active">Tampilkan di situs</Label>
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