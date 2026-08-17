import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, blogsPath } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { BlogCard } from "@/components/content/BlogCard";

export function LatestPosts() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: posts, loading } = useApi<BlogPost[]>(
    () => apiGet<BlogPost[]>(`${blogsPath(lang)}?limit=3`),
    [lang],
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("home.latestPosts")}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/blog">
            {t("home.viewAllPosts")} <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <p className="text-muted-foreground">{t("blog.noPosts")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {(posts ?? []).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}