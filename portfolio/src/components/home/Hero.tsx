import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, assetUrl, profilePath } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function Hero() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: profile, loading } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);

  const picture = assetUrl(profile?.profile_picture);

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-start gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t("home.hello")}</p>
          {loading ? (
            <>
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-80 max-w-full" />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {profile?.name ?? "Kubagus"}
              </h1>
              <p className="text-xl font-medium text-muted-foreground">{profile?.title}</p>
              <p className="max-w-xl text-muted-foreground">{profile?.headline}</p>
            </>
          )}
        </div>

        {!loading && profile && (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/contact">
                {t("common.contactMe")} <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            {profile.cv_url && (
              <Button asChild size="lg" variant="outline">
                <a href={profile.cv_url} target="_blank" rel="noreferrer">
                  <Download className="mr-1 size-4" /> {t("common.cv")}
                </a>
              </Button>
            )}
            <Badge variant={profile.available_for_hire ? "default" : "secondary"}>
              {profile.available_for_hire ? t("common.availableForHire") : t("common.notAvailable")}
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="size-56 shrink-0 rounded-full" />
      ) : (
        picture && (
          <Avatar className="size-56 shrink-0 border-4 border-border shadow-lg">
            <AvatarImage src={picture} alt={profile?.name ?? "Avatar"} />
            <AvatarFallback className="text-5xl">
              {profile?.name?.charAt(0) ?? "K"}
            </AvatarFallback>
          </Avatar>
        )
      )}
    </section>
  );
}