import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, projectsPath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProjectCard } from "@/components/content/ProjectCard";
import { FilterPills } from "@/components/content/FilterPills";

export function ProjectsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("projects.title"), t("projects.subtitle"), lang);
  const { data: projects, loading } = useApi<Project[]>(
    () => apiGet<Project[]>(`${projectsPath(lang)}?limit=100`),
    [lang],
  );

  const [catId, setCatId] = useState<number | "all">("all");
  const [techId, setTechId] = useState<number | "all">("all");

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const project of projects ?? []) {
      for (const cat of project.categories) map.set(cat.id, cat.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const techs = useMemo(() => {
    const map = new Map<number, string>();
    for (const project of projects ?? []) {
      for (const tech of project.tech_stack) map.set(tech.id, tech.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const filtered = useMemo(() => {
    let list = [...(projects ?? [])].sort((a, b) => b.is_featured - a.is_featured);
    if (catId !== "all") {
      list = list.filter((p) => p.categories.some((c) => c.id === catId));
    }
    if (techId !== "all") {
      list = list.filter((p) => p.tech_stack.some((t) => t.id === techId));
    }
    return list;
  }, [projects, catId, techId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("projects.title")}</h1>
        <p className="text-muted-foreground">{t("projects.subtitle")}</p>
      </header>

      <div className="mb-8 space-y-3">
        <FilterPills
          options={categories}
          selected={catId}
          onChange={setCatId}
          allLabel={t("home.filterAll")}
        />
        <FilterPills
          options={techs}
          selected={techId}
          onChange={setTechId}
          allLabel={t("home.filterAll")}
        />
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("projects.noProjects")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}