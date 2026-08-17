import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi, assetUrl } from "@/lib/api";
import { formatDate } from "@/lib/types";
import type { AdminProject } from "@/lib/types";

export function ProjectsPage() {
  const { data: projects, loading, refetch } = useApi<AdminProject[]>(() =>
    adminApi.get("/admin/projects"),
  );

  async function remove(project: AdminProject) {
    if (!confirm(`Hapus proyek "${project.title_id || project.title_en || project.slug}"?`)) return;
    try {
      await adminApi.delete(`/admin/projects/${project.id}`);
      toast.success("Proyek dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyek</h1>
          <p className="text-sm text-muted-foreground">
            {(projects ?? []).filter((p) => p.is_published).length} dari {(projects ?? []).length} dipublikasikan.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/projects/new">
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
              <TableHead>Teknologi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terbit</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (projects ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada proyek.
                </TableCell>
              </TableRow>
            ) : (
              (projects ?? []).map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    {project.cover_image ? (
                      <img
                        src={assetUrl(project.cover_image) ?? undefined}
                        alt=""
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {project.title_id || project.title_en || project.slug}
                      {!!project.is_featured && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="size-3 fill-current" /> Unggulan
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.slug}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.tech_stack.length > 0 ? project.tech_stack.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    {project.is_published ? (
                      <Badge>Terbit</Badge>
                    ) : (
                      <Badge variant="secondary">Draf</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.published_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild aria-label="Edit">
                      <Link to={`/admin/projects/${project.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(project)}
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