import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import type { AdminProfile, AdminSocial } from "@/lib/types";

interface ProfileState {
  name: string;
  title_id: string;
  title_en: string;
  headline_id: string;
  headline_en: string;
  summary_id: string;
  summary_en: string;
  profile_picture: string | null;
  location_id: string;
  location_en: string;
  cv_url_id: string;
  cv_url_en: string;
  email: string;
  phone: string;
  available_for_hire: boolean;
}

const emptyProfile: ProfileState = {
  name: "",
  title_id: "",
  title_en: "",
  headline_id: "",
  headline_en: "",
  summary_id: "",
  summary_en: "",
  profile_picture: null,
  location_id: "",
  location_en: "",
  cv_url_id: "",
  cv_url_en: "",
  email: "",
  phone: "",
  available_for_hire: true,
};

function mapProfile(p: AdminProfile | null): ProfileState {
  if (!p) return emptyProfile;
  return {
    name: p.name,
    title_id: p.title_id ?? "",
    title_en: p.title_en ?? "",
    headline_id: p.headline_id ?? "",
    headline_en: p.headline_en ?? "",
    summary_id: p.summary_id ?? "",
    summary_en: p.summary_en ?? "",
    profile_picture: p.profile_picture,
    location_id: p.location_id ?? "",
    location_en: p.location_en ?? "",
    cv_url_id: p.cv_url_id ?? "",
    cv_url_en: p.cv_url_en ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    available_for_hire: !!p.available_for_hire,
  };
}

export function ProfilePage() {
  const { data, loading, refetch } = useApi<{ profile: AdminProfile | null; socials: AdminSocial[] }>(() =>
    adminApi.get("/admin/profile"),
  );

  const [form, setForm] = useState<ProfileState>(emptyProfile);
  const [socials, setSocials] = useState<AdminSocial[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(mapProfile(data.profile));
      setSocials(data.socials);
    }
  }, [data]);

  function update<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await adminApi.put("/admin/profile", form);
      toast.success("Profil tersimpan");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function addSocial() {
    try {
      await adminApi.post("/admin/profile/socials", {
        platform: "Platform",
        url: "https://",
        icon: "globe",
        sort_order: socials.length,
        is_active: true,
      });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah");
    }
  }

  async function updateSocial(id: number, patch: Partial<AdminSocial>) {
    const current = socials.find((s) => s.id === id);
    if (!current) return;
    try {
      await adminApi.put(`/admin/profile/socials/${id}`, { ...current, ...patch });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function deleteSocial(id: number) {
    try {
      await adminApi.delete(`/admin/profile/socials/${id}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <Button onClick={saveProfile} disabled={saving}>
          {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
          <Save className="mr-1 size-4" /> Simpan
        </Button>
      </div>

      <Tabs defaultValue="id">
        <TabsList>
          <TabsTrigger value="id">Indonesia</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        <TabsContent value="id" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Konten Bahasa Indonesia</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jabatan (title)</Label>
                <Input value={form.title_id} onChange={(e) => update("title_id", e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input value={form.location_id} onChange={(e) => update("location_id", e.target.value)} placeholder="Indonesia" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tagline (headline)</Label>
                <Input value={form.headline_id} onChange={(e) => update("headline_id", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Ringkasan profil</Label>
                <Textarea rows={5} value={form.summary_id} onChange={(e) => update("summary_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link CV (bahasa Indonesia)</Label>
                <Input value={form.cv_url_id} onChange={(e) => update("cv_url_id", e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="en" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>English Content</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title_en} onChange={(e) => update("title_en", e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location_en} onChange={(e) => update("location_en", e.target.value)} placeholder="Indonesia" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Headline</Label>
                <Input value={form.headline_en} onChange={(e) => update("headline_en", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Profile summary</Label>
                <Textarea rows={5} value={form.summary_en} onChange={(e) => update("summary_en", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CV link (English)</Label>
                <Input value={form.cv_url_en} onChange={(e) => update("cv_url_en", e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Data Umum</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama lengkap</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Foto profil</Label>
            <ImageUpload value={form.profile_picture} onChange={(v) => update("profile_picture", v)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Tersedia untuk proyek</p>
              <p className="text-xs text-muted-foreground">Menampilkan badge di beranda</p>
            </div>
            <Switch
              checked={form.available_for_hire}
              onCheckedChange={(v) => update("available_for_hire", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tautan Media Sosial</CardTitle>
          <Button variant="outline" size="sm" onClick={addSocial}>
            <Plus className="mr-1 size-4" /> Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {socials.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada tautan.</p>
          )}
          {socials.map((social) => (
            <div key={social.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
              <Input
                value={social.platform}
                onChange={(e) => updateSocial(social.id, { platform: e.target.value })}
                placeholder="Platform (mis. GitHub)"
                className="w-40"
              />
              <Input
                value={social.icon ?? ""}
                onChange={(e) => updateSocial(social.id, { icon: e.target.value })}
                placeholder="ikon (mis. github)"
                className="w-32"
              />
              <Input
                value={social.url}
                onChange={(e) => updateSocial(social.id, { url: e.target.value })}
                placeholder="https://..."
                className="min-w-48 flex-1"
              />
              <Switch
                checked={!!social.is_active}
                onCheckedChange={(v) => updateSocial(social.id, { is_active: v ? 1 : 0 })}
                aria-label="Aktif"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSocial(social.id)}
                aria-label="Hapus"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}