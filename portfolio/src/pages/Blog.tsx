import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderTree, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const { data: posts, loading } = useApi<BlogPost[]>(
    () => apiGet<BlogPost[]>(`${blogsPath(lang)}?limit=100`),
    [lang],
  );

  const [catId, setCatId] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const post of posts ?? []) {
      for (const cat of post.categories) map.set(cat.id, cat.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter((p) => {
      if (catId !== "all" && !p.categories.some((c) => c.id === Number(catId))) return false;
      if (!q) return true;
      return (
        (p.title ?? p.slug).toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [posts, catId, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("blog.title")}</h1>
        <p className="text-muted-foreground">{t("blog.subtitle")}</p>
      </header>

      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("blog.searchPlaceholder")}
            aria-label={t("blog.searchPlaceholder")}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            className="pl-8"
          />
        </div>
        <Select value={catId} onValueChange={setCatId}>
          <SelectTrigger className="w-56">
            <FolderTree className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder={t("home.filterAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("home.filterAll")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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