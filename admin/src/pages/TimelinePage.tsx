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
import { BulletListInput } from "@/components/admin/BulletListInput";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/types";
import type { AdminEducation, AdminExperience } from "@/lib/types";

type Item = AdminExperience | AdminEducation;

interface FormState {
  id?: number;
  name: string;
  name_en: string;
  pos_id: string;
  pos_en: string;
  desc_id: string;
  desc_en: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  name: "",
  name_en: "",
  pos_id: "",
  pos_en: "",
  desc_id: "",
  desc_en: "",
  start_date: "",
  end_date: "",
  is_current: false,
  sort_order: 0,
};

export function TimelinePage({ type }: { type: "experiences" | "educations" }) {
  const isExp = type === "experiences";
  const label = isExp ? "Pengalaman" : "Pendidikan";
  const { data: items, loading, refetch } = useApi<Item[]>(() => adminApi.get(`/admin/${type}`));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ ...emptyForm, sort_order: (items ?? []).length });
    setOpen(true);
  }

  function openEdit(item: Item) {
    const exp = item as AdminExperience;
    const edu = item as AdminEducation;
    setForm({
      id: item.id,
      name: isExp ? exp.company : edu.institution,
      name_en: isExp ? (exp.company_en ?? "") : "",
      pos_id: isExp ? (exp.position_id ?? "") : (edu.degree_id ?? ""),
      pos_en: isExp ? (exp.position_en ?? "") : (edu.degree_en ?? ""),
      desc_id: exp.description_id ?? edu.description_id ?? "",
      desc_en: exp.description_en ?? edu.description_en ?? "",
      start_date: item.start_date ? item.start_date.slice(0, 10) : "",
      end_date: item.end_date ? item.end_date.slice(0, 10) : "",
      is_current: !!item.is_current,
      sort_order: item.sort_order,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.start_date) {
      toast.error("Nama/perusahaan dan tanggal mulai wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      [isExp ? "company" : "institution"]: form.name,
      ...(isExp ? { company_en: form.name_en || null } : {}),
      [isExp ? "position_id" : "degree_id"]: form.pos_id || null,
      [isExp ? "position_en" : "degree_en"]: form.pos_en || null,
      description_id: form.desc_id || null,
      description_en: form.desc_en || null,
      start_date: form.start_date,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      sort_order: form.sort_order,
    };
    try {
      if (form.id) {
        await adminApi.put(`/admin/${type}/${form.id}`, payload);
        toast.success(`${label} diperbarui`);
      } else {
        await adminApi.post(`/admin/${type}`, payload);
        toast.success(`${label} ditambahkan`);
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Item) {
    if (!confirm(`Hapus ${label.toLowerCase()} ini?`)) return;
    try {
      await adminApi.delete(`/admin/${type}/${item.id}`);
      toast.success(`${label} dihapus`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">Timeline seperti pada CV.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" /> Tambah
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isExp ? "Perusahaan" : "Institusi"}</TableHead>
              <TableHead>Posisi / Gelar (ID)</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (items ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              (items ?? []).map((item) => {
                const exp = item as AdminExperience;
                const title = isExp ? exp.position_id : (item as AdminEducation).degree_id;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {isExp ? exp.company : (item as AdminEducation).institution}
                    </TableCell>
                    <TableCell>{title || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.start_date)} —{" "}
                      {item.is_current ? "sekarang" : formatDate(item.end_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(item)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? `Edit ${label}` : `Tambah ${label}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isExp ? "Perusahaan" : "Institusi"} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isExp ? "PT Contoh Teknologi" : "Universitas Contoh"}
              />
            </div>
            {isExp && (
              <div className="space-y-2">
                <Label>Company (EN)</Label>
                <Input
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  placeholder="Example Technology Ltd."
                />
              </div>
            )}
          </div>

            <Tabs defaultValue="id">
              <TabsList>
                <TabsTrigger value="id">Indonesia</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>
              <TabsContent value="id" className="space-y-3">
                <div className="space-y-2">
                  <Label>{isExp ? "Posisi (ID)" : "Gelar (ID)"}</Label>
                  <Input value={form.pos_id} onChange={(e) => setForm({ ...form, pos_id: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi (ID) — satu baris per poin</Label>
                  <BulletListInput
                    value={form.desc_id}
                    onChange={(v) => setForm({ ...form, desc_id: v })}
                    placeholder="Tulis poin deskripsi di sini..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="en" className="space-y-3">
                <div className="space-y-2">
                  <Label>{isExp ? "Position (EN)" : "Degree (EN)"}</Label>
                  <Input value={form.pos_en} onChange={(e) => setForm({ ...form, pos_en: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description (EN) — one bullet per line</Label>
                  <BulletListInput
                    value={form.desc_en}
                    onChange={(v) => setForm({ ...form, desc_en: v })}
                    placeholder="Write description bullet here..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal mulai *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal selesai</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  disabled={form.is_current}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_current}
                  onCheckedChange={(v) => setForm({ ...form, is_current: v })}
                  id="is-current"
                />
                <Label htmlFor="is-current">Masih berlangsung</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Urutan</Label>
                <Input
                  id="sort"
                  type="number"
                  className="w-24"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
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