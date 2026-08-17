import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RichContent } from "@/components/content/RichContent";
import { AdjacentNav } from "@/components/content/AdjacentNav";
import { useApi } from "@/lib/hooks";
import { apiGet, assetUrl, blogDetailPath, blogView } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { BlogPost } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: post, loading, error } = useApi<BlogPost>(
    () => apiGet(blogDetailPath(lang, slug!)),
    [lang, slug],
  );
  useSeo(post?.title, post?.excerpt, lang);

  const [views, setViews] = useState<number | null>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    if (!post || countedRef.current) return;
    countedRef.current = true;
    blogView(lang, post.slug)
      .then((res) => setViews(res.views))
      .catch(() => {});
  }, [post, lang]);

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

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("common.error")}</h1>
        <Button variant="outline" asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-1 size-4" /> {t("blog.backToBlog")}
          </Link>
        </Button>
      </div>
    );
  }

  const cover = assetUrl(post.cover_image);
  const dateLabel = post.published_at
    ? new Date(post.published_at).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const displayViews = views ?? post.views;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/blog">
          <ArrowLeft className="mr-1 size-4" /> {t("blog.backToBlog")}
        </Link>
      </Button>

      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <Badge key={cat.id} variant="outline">
              {cat.name}
            </Badge>
          ))}
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title ?? post.slug}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {dateLabel && (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" /> {t("blog.postedOn")} {dateLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="size-4" /> {displayViews} {t("blog.views")}
          </span>
        </div>
        {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
      </header>

      {cover && (
        <img
          src={cover}
          alt={post.title ?? post.slug}
          className="my-8 w-full rounded-lg border border-border object-cover"
        />
      )}

      <RichContent html={post.content} />

      <AdjacentNav prev={post.prev} next={post.next} basePath="/blog" />
    </article>
  );
}