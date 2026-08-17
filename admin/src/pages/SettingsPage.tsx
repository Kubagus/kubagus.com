import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";

export function SettingsPage() {
  const { data: settings, loading, refetch } = useApi<Record<string, unknown>>(() =>
    adminApi.get("/admin/settings"),
  );

  const [seo, setSeo] = useState({ title: "", description: "" });
  const [theme, setTheme] = useState({ defaultTheme: "dark" });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const s = (settings.seo ?? {}) as { title?: string; description?: string };
    const t = (settings.theme ?? {}) as { defaultTheme?: string };
    setSeo({ title: s.title ?? "", description: s.description ?? "" });
    setTheme({ defaultTheme: t.defaultTheme ?? "dark" });
  }, [settings]);

  async function saveSeo() {
    setSaving("seo");
    try {
      await adminApi.put("/admin/settings/seo", { svalue: seo });
      toast.success("Pengaturan SEO tersimpan");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(null);
    }
  }

  async function saveTheme() {
    setSaving("theme");
    try {
      await adminApi.put("/admin/settings/theme", { svalue: theme });
      toast.success("Pengaturan tema tersimpan");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(null);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi global situs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Judul dan deskripsi untuk mesin pencari.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Judul situs</Label>
            <Input value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Input
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            />
          </div>
          <Button onClick={saveSeo} disabled={saving === "seo"}>
            {saving === "seo" && <Loader2 className="mr-1 size-4 animate-spin" />}
            <Save className="mr-1 size-4" /> Simpan SEO
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>Tema default untuk pengunjung baru.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema default</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={theme.defaultTheme}
              onChange={(e) => setTheme({ defaultTheme: e.target.value })}
            >
              <option value="dark">Gelap</option>
              <option value="light">Terang</option>
            </select>
          </div>
          <Button onClick={saveTheme} disabled={saving === "theme"}>
            {saving === "theme" && <Loader2 className="mr-1 size-4 animate-spin" />}
            <Save className="mr-1 size-4" /> Simpan Tema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}