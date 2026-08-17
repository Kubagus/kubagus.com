import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdjacentItem } from "@/lib/types";

interface AdjacentNavProps {
  prev: AdjacentItem | null;
  next: AdjacentItem | null;
  basePath: string;
}

export function AdjacentNav({ prev, next, basePath }: AdjacentNavProps) {
  const { t } = useTranslation();
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`${basePath}/${prev.slug}`}
          className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
            <ArrowLeft className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{t("common.prev")}</span>
            <span className="line-clamp-1 block text-sm font-medium group-hover:underline">
              {prev.title ?? prev.slug}
            </span>
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
      {next && (
        <Link
          to={`${basePath}/${next.slug}`}
          className={cn(
            "group flex items-center gap-3 rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/50 hover:bg-accent/50",
            !prev && "sm:col-start-2",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">{t("common.next")}</span>
            <span className="line-clamp-1 block text-sm font-medium group-hover:underline">
              {next.title ?? next.slug}
            </span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      )}
    </nav>
  );
}