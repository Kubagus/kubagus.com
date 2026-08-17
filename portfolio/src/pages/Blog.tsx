import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, blogsPath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { BlogPost } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { BlogCard } from "@/components/content/BlogCard";

export function BlogPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("blog.title"), t("blog.subtitle"), lang);
  const { data: posts, loading } = useApi<BlogPost[]>(() => apiGet(blogsPath(lang)), [lang]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("blog.title")}</h1>
        <p className="text-muted-foreground">{t("blog.subtitle")}</p>
      </header>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <p className="text-muted-foreground">{t("blog.noPosts")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(posts ?? []).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}