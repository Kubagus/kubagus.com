import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { TipTapEditor } from "@/components/admin/TipTapEditor";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { slugify } from "@/lib/types";
import type { AdminProject, ProjectPayload } from "@/lib/types";

interface FormState {
  slug: string;
  title_id: string;
  title_en: string;
  summary_id: string;
  summary_en: string;
  content_id: string;
  content_en: string;
  cover_image: string | null;
  tech_stack: string;
  github_url: string;
  demo_url: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  slug: "",
  title_id: "",
  title_en: "",
  summary_id: "",
  summary_en: "",
  content_id: "",
  content_en: "",
  cover_image: null,
  tech_stack: "",
  github_url: "",
  demo_url: "",
  is_featured: false,
  is_published: false,
  sort_order: 0,
};

function toForm(project: AdminProject): FormState {
  return {
    slug: project.slug,
    title_id: project.title_id ?? "",
    title_en: project.title_en ?? "",
    summary_id: project.summary_id ?? "",
    summary_en: project.summary_en ?? "",
    content_id: project.content_id ?? "",
    content_en: project.content_en ?? "",
    cover_image: project.cover_image,
    tech_stack: project.tech_stack.join(", "),
    github_url: project.github_url ?? "",
    demo_url: project.demo_url ?? "",
    is_featured: !!project.is_featured,
    is_published: !!project.is_published,
    sort_order: project.sort_order,
  };
}

function toPayload(form: FormState): ProjectPayload {
  return {
    slug: form.slug,
    title_id: form.title_id || null,
    title_en: form.title_en || null,
    summary_id: form.summary_id || null,
    summary_en: form.summary_en || null,
    content_id: form.content_id || null,
    content_en: form.content_en || null,
    cover_image: form.cover_image,
    tech_stack: form.tech_stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    github_url: form.github_url || null,
    demo_url: form.demo_url || null,
    is_featured: form.is_featured,
    is_published: form.is_published,
    sort_order: form.sort_order,
  };
}

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data, loading } = useApi<AdminProject | null>(
    () => (isEdit ? adminApi.get(`/admin/projects/${id}`) : Promise.resolve(null)),
    [id],
  );

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.slug.trim() || (!form.title_id.trim() && !form.title_en.trim())) {
      toast.error("Slug dan judul (salah satu bahasa) wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.put(`/admin/projects/${id}`, toPayload(form));
        toast.success("Proyek diperbarui");
      } else {
        const res = await adminApi.post<{ id: number }>("/admin/projects", toPayload(form));
        toast.success("Proyek dibuat");
        navigate(`/admin/projects/${res.id}`, { replace: true });
        return;
      }
      navigate("/admin/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/projects" aria-label="Kembali">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Proyek" : "Proyek Baru"}
          </h1>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
          <Save className="mr-1 size-4" /> Simpan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Slug *</Label>
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                placeholder="nama-proyek"
                disabled={isEdit}
              />
              {!isEdit && form.title_id && !form.slug && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => update("slug", slugify(form.title_id))}
                >
                  Buat dari judul
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gambar sampul</Label>
            <ImageUpload value={form.cover_image} onChange={(v) => update("cover_image", v)} />
          </div>
          <div className="space-y-2">
            <Label>URL GitHub</Label>
            <Input
              value={form.github_url}
              onChange={(e) => update("github_url", e.target.value)}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>URL Demo</Label>
            <Input
              value={form.demo_url}
              onChange={(e) => update("demo_url", e.target.value)}
              placeholder="https://demo.kubagus.com"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Teknologi (pisahkan dengan koma)</Label>
            <Input
              value={form.tech_stack}
              onChange={(e) => update("tech_stack", e.target.value)}
              placeholder="React, Express, MySQL"
            />
          </div>
          <div className="space-y-2">
            <Label>Urutan</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </div>
          <div className="flex items-end gap-6 pb-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => update("is_published", v)}
                id="project-published"
              />
              <Label htmlFor="project-published">Publikasikan</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => update("is_featured", v)}
                id="project-featured"
              />
              <Label htmlFor="project-featured">Unggulan</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="id">
        <TabsList>
          <TabsTrigger value="id">Konten Indonesia</TabsTrigger>
          <TabsTrigger value="en">English Content</TabsTrigger>
        </TabsList>
        <TabsContent value="id" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="space-y-2">
                <Label>Judul (ID)</Label>
                <Input value={form.title_id} onChange={(e) => update("title_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ringkasan (ID)</Label>
                <Textarea rows={3} value={form.summary_id} onChange={(e) => update("summary_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Konten (ID)</Label>
                <TipTapEditor
                  value={form.content_id}
                  onChange={(html) => update("content_id", html)}
                  placeholder="Tulis deskripsi proyek di sini..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="en" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="space-y-2">
                <Label>Title (EN)</Label>
                <Input value={form.title_en} onChange={(e) => update("title_en", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Summary (EN)</Label>
                <Textarea rows={3} value={form.summary_en} onChange={(e) => update("summary_en", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Content (EN)</Label>
                <TipTapEditor
                  value={form.content_en}
                  onChange={(html) => update("content_en", html)}
                  placeholder="Write project description here..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}