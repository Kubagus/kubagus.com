import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const { t } = useTranslation();
  const cover = assetUrl(post.cover_image);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {cover ? (
        <Link to={`/blog/${post.slug}`} className="block aspect-video overflow-hidden bg-muted">
          <img
            src={cover}
            alt={post.title ?? post.slug}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
          {post.slug}
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link to={`/blog/${post.slug}`} className="hover:underline">
            {post.title ?? post.slug}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {post.excerpt && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/blog/${post.slug}`}>
            {t("common.readMore")} <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="size-3.5" /> {post.views}
        </span>
      </CardFooter>
    </Card>
  );
}