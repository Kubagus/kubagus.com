import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, projectsPath } from "@/lib/api";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProjectCard } from "@/components/content/ProjectCard";

export function FeaturedProjects() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: projects, loading } = useApi<Project[]>(
    () => apiGet<Project[]>(`${projectsPath(lang)}?limit=6`),
    [lang],
  );

  const featured = (projects ?? []).filter((p) => p.is_featured).slice(0, 3);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("home.featuredProjects")}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            {t("home.viewAllProjects")} <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : featured.length === 0 ? (
        <p className="text-muted-foreground">{t("home.noFeatured")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}