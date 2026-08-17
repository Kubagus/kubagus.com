import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, blogsPath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { BlogPost } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { BlogCard } from "@/components/content/BlogCard";
import { FilterPills } from "@/components/content/FilterPills";

export function BlogPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("blog.title"), t("blog.subtitle"), lang);
  const { data: posts, loading } = useApi<BlogPost[]>(
    () => apiGet<BlogPost[]>(`${blogsPath(lang)}?limit=100`),
    [lang],
  );

  const [catId, setCatId] = useState<number | "all">("all");

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const post of posts ?? []) {
      for (const cat of post.categories) map.set(cat.id, cat.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  const filtered = useMemo(() => {
    if (catId === "all") return posts ?? [];
    return (posts ?? []).filter((p) => p.categories.some((c) => c.id === catId));
  }, [posts, catId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("blog.title")}</h1>
        <p className="text-muted-foreground">{t("blog.subtitle")}</p>
      </header>

      <div className="mb-8">
        <FilterPills
          options={categories}
          selected={catId}
          onChange={setCatId}
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
        <p className="text-muted-foreground">{t("blog.noPosts")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}