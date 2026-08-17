import { Link } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  FolderTree,
  GraduationCap,
  Layers,
  Mail,
  MessagesSquare,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
  hint?: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, loading } = useApi<Stats>(() => adminApi.get("/admin/stats"));

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat datang, {user?.name}!</h1>
          <p className="text-sm text-muted-foreground">Ringkasan konten situs kubagus.com.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/projects/new">+ Proyek</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/blogs/new">+ Artikel</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pesan masuk"
          value={stats.messages}
          icon={Mail}
          to="/admin/messages"
          hint={`${stats.messages_unread} belum dibaca`}
        />
        <StatCard label="Proyek" value={stats.projects} icon={Terminal} to="/admin/projects" hint={`${stats.projects_published} dipublikasikan`} />
        <StatCard label="Artikel" value={stats.blogs} icon={BookOpen} to="/admin/blogs" hint={`${stats.blogs_published} dipublikasikan`} />
        <StatCard label="Keahlian" value={stats.skills} icon={Wrench} to="/admin/skills" />
        <StatCard label="Kategori" value={stats.categories} icon={FolderTree} to="/admin/categories" />
        <StatCard label="Teknologi" value={stats.tech_stacks} icon={Layers} to="/admin/tech-stacks" />
        <StatCard label="Pengalaman" value={stats.experiences} icon={Briefcase} to="/admin/experiences" />
        <StatCard label="Pendidikan" value={stats.educations} icon={GraduationCap} to="/admin/educations" />
        <StatCard label="Profil" value={1} icon={Sparkles} to="/admin/profile" hint="Data pribadi & CV" />
        <StatCard label="Pengaturan" value={1} icon={MessagesSquare} to="/admin/settings" hint="SEO & tema" />
      </div>

      {(stats.messages_unread ?? 0) > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Ada <Badge variant="destructive">{stats.messages_unread}</Badge> pesan masuk yang belum
            dibaca.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/messages?unread=1">Buka pesan</Link>
          </Button>
        </div>
      )}
    </div>
  );
}