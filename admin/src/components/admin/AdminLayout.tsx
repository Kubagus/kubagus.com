import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  ExternalLink,
  FolderTree,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Stats } from "@/lib/types";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/profile", label: "Profil", icon: Sparkles },
  { to: "/admin/experiences", label: "Pengalaman", icon: Briefcase },
  { to: "/admin/educations", label: "Pendidikan", icon: GraduationCap },
  { to: "/admin/skills", label: "Keahlian", icon: Wrench },
  { to: "/admin/categories", label: "Kategori", icon: FolderTree },
  { to: "/admin/tech-stacks", label: "Teknologi", icon: Layers },
  { to: "/admin/projects", label: "Proyek", icon: Terminal },
  { to: "/admin/blogs", label: "Blog", icon: BookOpen },
  { to: "/admin/messages", label: "Pesan", icon: Mail },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data: stats } = useApi<Stats>(() => adminApi.get("/admin/stats"));
  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground",
            )
          }
        >
          <item.icon className="size-4" />
          <span className="flex-1">{item.label}</span>
          {item.to === "/admin/messages" && (stats?.messages_unread ?? 0) > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
              {stats?.messages_unread ?? 0}
            </Badge>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-1 border-t border-border pt-3">
      <p className="truncate px-3 py-1 text-xs text-muted-foreground">
        {user?.name} · {user?.email}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3"
        asChild
      >
        <a href="http://localhost:5173" target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" /> Lihat situs
        </a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
        onClick={async () => {
          await logout();
          navigate("/admin/login");
        }}
      >
        <LogOut className="size-4" /> Keluar
      </Button>
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-border bg-background p-4 lg:flex">
        <Link to="/admin" className="flex items-center gap-2 px-1 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Terminal className="size-4" />
          </span>
          kubagus.com / admin
        </Link>
        <NavLinks />
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col gap-4 p-4">
              <SheetHeader>
                <SheetTitle>kubagus.com / admin</SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Panel Admin</span>
        </header>

        <main className="flex-1 overflow-x-auto p-4 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}