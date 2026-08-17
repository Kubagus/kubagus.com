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
import { CheckboxGroup } from "@/components/admin/CheckboxGroup";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import { slugify } from "@/lib/types";
import type { AdminBlog, AdminCategory, BlogPayload } from "@/lib/types";

interface FormState {
  slug: string;
  title_id: string;
  title_en: string;
  excerpt_id: string;
  excerpt_en: string;
  content_id: string;
  content_en: string;
  cover_image: string | null;
  tags: string;
  is_published: boolean;
  category_ids: number[];
}

const emptyForm: FormState = {
  slug: "",
  title_id: "",
  title_en: "",
  excerpt_id: "",
  excerpt_en: "",
  content_id: "",
  content_en: "",
  cover_image: null,
  tags: "",
  is_published: false,
  category_ids: [],
};

function toForm(blog: AdminBlog): FormState {
  return {
    slug: blog.slug,
    title_id: blog.title_id ?? "",
    title_en: blog.title_en ?? "",
    excerpt_id: blog.excerpt_id ?? "",
    excerpt_en: blog.excerpt_en ?? "",
    content_id: blog.content_id ?? "",
    content_en: blog.content_en ?? "",
    cover_image: blog.cover_image,
    tags: blog.tags.join(", "),
    is_published: !!blog.is_published,
    category_ids: blog.category_ids,
  };
}

function toPayload(form: FormState): BlogPayload {
  return {
    slug: form.slug,
    title_id: form.title_id || null,
    title_en: form.title_en || null,
    excerpt_id: form.excerpt_id || null,
    excerpt_en: form.excerpt_en || null,
    content_id: form.content_id || null,
    content_en: form.content_en || null,
    cover_image: form.cover_image,
    tags: form.tags
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    is_published: form.is_published,
    category_ids: form.category_ids,
  };
}

export function BlogFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data, loading } = useApi<AdminBlog | null>(
    () => (isEdit ? adminApi.get(`/admin/blogs/${id}`) : Promise.resolve(null)),
    [id],
  );
  const { data: categories } = useApi<AdminCategory[]>(() =>
    adminApi.get("/admin/categories?type=blog"),
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
        await adminApi.put(`/admin/blogs/${id}`, toPayload(form));
        toast.success("Artikel diperbarui");
      } else {
        const res = await adminApi.post<{ id: number }>("/admin/blogs", toPayload(form));
        toast.success("Artikel dibuat");
        navigate(`/admin/blogs/${res.id}`, { replace: true });
        return;
      }
      navigate("/admin/blogs");
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
            <Link to="/admin/blogs" aria-label="Kembali">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Artikel" : "Artikel Baru"}
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
                placeholder="judul-artikel"
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
          <div className="space-y-2 sm:col-span-2">
            <Label>Tag (pisahkan dengan koma)</Label>
            <Input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="react, express, backend"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Kategori</Label>
            <CheckboxGroup
              options={(categories ?? []).map((c) => ({
                id: c.id,
                label: c.name_id || c.name_en || c.slug,
              }))}
              selected={form.category_ids}
              onChange={(ids) => update("category_ids", ids)}
              emptyText="Belum ada kategori blog. Tambahkan di menu Kategori."
            />
          </div>
          <div className="flex items-end gap-6 pb-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => update("is_published", v)}
                id="blog-published"
              />
              <Label htmlFor="blog-published">Publikasikan</Label>
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
                <Label>Ringkasan / excerpt (ID)</Label>
                <Textarea rows={2} value={form.excerpt_id} onChange={(e) => update("excerpt_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Konten (ID)</Label>
                <TipTapEditor
                  value={form.content_id}
                  onChange={(html) => update("content_id", html)}
                  placeholder="Tulis artikel di sini... Gunakan blok kode untuk source code."
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
                <Label>Excerpt (EN)</Label>
                <Textarea rows={2} value={form.excerpt_en} onChange={(e) => update("excerpt_en", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Content (EN)</Label>
                <TipTapEditor
                  value={form.content_en}
                  onChange={(html) => update("content_en", html)}
                  placeholder="Write your post here... Use code blocks for source code."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}