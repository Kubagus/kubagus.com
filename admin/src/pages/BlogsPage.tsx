import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi, assetUrl } from "@/lib/api";
import { formatDate } from "@/lib/types";
import type { AdminBlog } from "@/lib/types";

export function BlogsPage() {
  const { data: blogs, loading, refetch } = useApi<AdminBlog[]>(() => adminApi.get("/admin/blogs"));

  async function remove(blog: AdminBlog) {
    if (!confirm(`Hapus artikel "${blog.title_id || blog.title_en || blog.slug}"?`)) return;
    try {
      await adminApi.delete(`/admin/blogs/${blog.id}`);
      toast.success("Artikel dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground">
            {(blogs ?? []).filter((b) => b.is_published).length} dari {(blogs ?? []).length} dipublikasikan.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/blogs/new">
            <Plus className="mr-1 size-4" /> Tambah
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Gambar</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Dilihat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terbit</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (blogs ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Belum ada artikel.
                </TableCell>
              </TableRow>
            ) : (
              (blogs ?? []).map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    {blog.cover_image ? (
                      <img
                        src={assetUrl(blog.cover_image) ?? undefined}
                        alt=""
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {blog.title_id || blog.title_en || blog.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{blog.slug}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {blog.tags.length > 0 ? blog.tags.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {blog.views}
                    </span>
                  </TableCell>
                  <TableCell>
                    {blog.is_published ? <Badge>Terbit</Badge> : <Badge variant="secondary">Draf</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(blog.published_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild aria-label="Edit">
                      <Link to={`/admin/blogs/${blog.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(blog)}
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
    </div>
  );
}