import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RichContent } from "@/components/content/RichContent";
import { SocialIcon } from "@/components/content/SocialIcon";
import { useApi } from "@/lib/hooks";
import { apiGet, assetUrl, projectDetailPath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: project, loading, error } = useApi<Project>(
    () => apiGet(projectDetailPath(lang, slug!)),
    [lang, slug],
  );
  useSeo(project?.title, project?.summary, lang);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("common.error")}</h1>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-1 size-4" /> {t("projects.backToProjects")}
          </Link>
        </Button>
      </div>
    );
  }

  const cover = assetUrl(project.cover_image);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/projects">
          <ArrowLeft className="mr-1 size-4" /> {t("projects.backToProjects")}
        </Link>
      </Button>

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title ?? project.slug}
        </h1>
        {project.summary && <p className="text-lg text-muted-foreground">{project.summary}</p>}
        <div className="flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {project.demo_url && (
            <Button asChild>
              <a href={project.demo_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 size-4" /> {t("home.visitDemo")}
              </a>
            </Button>
          )}
          {project.github_url && (
            <Button asChild variant="outline">
              <a href={project.github_url} target="_blank" rel="noreferrer">
                <SocialIcon name="github" className="mr-1 size-4" /> {t("home.sourceCode")}
              </a>
            </Button>
          )}
        </div>
      </header>

      {cover && (
        <img
          src={cover}
          alt={project.title ?? project.slug}
          className="my-8 w-full rounded-lg border border-border object-cover"
        />
      )}

      <RichContent html={project.content} />
    </article>
  );
}