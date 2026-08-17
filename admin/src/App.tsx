import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { TimelinePage } from "@/pages/TimelinePage";
import { SkillsPage } from "@/pages/SkillsPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { TechStacksPage } from "@/pages/TechStacksPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { BlogsPage } from "@/pages/BlogsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { SettingsPage } from "@/pages/SettingsPage";

const ProjectFormPage = lazy(() =>
  import("@/pages/ProjectFormPage").then((m) => ({ default: m.ProjectFormPage })),
);
const BlogFormPage = lazy(() =>
  import("@/pages/BlogFormPage").then((m) => ({ default: m.BlogFormPage })),
);

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function FormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-96 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="experiences" element={<TimelinePage type="experiences" />} />
          <Route path="educations" element={<TimelinePage type="educations" />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="tech-stacks" element={<TechStacksPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route
            path="projects/new"
            element={
              <Suspense fallback={<FormFallback />}>
                <ProjectFormPage />
              </Suspense>
            }
          />
          <Route
            path="projects/:id"
            element={
              <Suspense fallback={<FormFallback />}>
                <ProjectFormPage />
              </Suspense>
            }
          />
          <Route path="blogs" element={<BlogsPage />} />
          <Route
            path="blogs/new"
            element={
              <Suspense fallback={<FormFallback />}>
                <BlogFormPage />
              </Suspense>
            }
          />
          <Route
            path="blogs/:id"
            element={
              <Suspense fallback={<FormFallback />}>
                <BlogFormPage />
              </Suspense>
            }
          />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
}