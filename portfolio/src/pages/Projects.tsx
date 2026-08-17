import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, projectsPath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProjectCard } from "@/components/content/ProjectCard";

export function ProjectsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("projects.title"), t("projects.subtitle"), lang);
  const { data: projects, loading } = useApi<Project[]>(() => apiGet(projectsPath(lang)), [lang]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("projects.title")}</h1>
        <p className="text-muted-foreground">{t("projects.subtitle")}</p>
      </header>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (projects ?? []).length === 0 ? (
        <p className="text-muted-foreground">{t("projects.noProjects")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(projects ?? []).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}