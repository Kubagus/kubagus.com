import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl } from "@/lib/api";
import { SocialIcon } from "@/components/content/SocialIcon";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  const cover = assetUrl(project.cover_image);

  return (
    <Card className="relative flex h-full flex-col overflow-hidden">
      <Link
        to={`/projects/${project.slug}`}
        className="absolute inset-0 z-10"
        aria-label={project.title ?? project.slug}
      />
      {cover ? (
        <Link to={`/projects/${project.slug}`} className="block aspect-video overflow-hidden bg-muted">
          <img
            src={cover}
            alt={project.title ?? project.slug}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
          {project.slug}
        </div>
      )}
      <CardHeader className="pb-2">
        {project.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {project.categories.map((cat) => (
              <Badge key={cat.id} variant="outline" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
        <CardTitle className="text-lg">
          <Link to={`/projects/${project.slug}`} className="hover:underline">
            {project.title ?? project.slug}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {project.summary && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{project.summary}</p>
        )}
        {project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.map((tech) => (
              <Badge key={tech.id} variant="secondary">
                {tech.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" asChild className="relative z-20">
          <Link to={`/projects/${project.slug}`}>
            {t("home.viewProject")} <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
        {project.demo_url && (
          <Button size="sm" variant="ghost" asChild className="relative z-20">
            <a href={project.demo_url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
        {project.github_url && (
          <Button size="sm" variant="ghost" asChild className="relative z-20">
            <a href={project.github_url} target="_blank" rel="noreferrer" aria-label="GitHub">
              <SocialIcon name="github" className="size-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}