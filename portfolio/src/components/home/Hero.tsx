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
    <section className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        {loading ? (
          <>
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-16 w-72" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </>
        ) : (
          <>
            {picture && (
              <Avatar className="size-28 border-4 border-border shadow-lg">
                <AvatarImage src={picture} alt={profile?.name ?? "Avatar"} />
                <AvatarFallback className="text-4xl">
                  {profile?.name?.charAt(0) ?? "A"}
                </AvatarFallback>
              </Avatar>
            )}
            <p className="text-sm font-medium text-muted-foreground">{t("home.hello")}</p>
            <h1 className="pb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {profile?.name ?? "Ahmad Kubagus Subkhi"}
            </h1>
            <p className="text-lg font-medium text-muted-foreground md:text-xl">{profile?.title}</p>
            <p className="max-w-2xl text-muted-foreground">{profile?.headline}</p>
          </>
        )}

        {!loading && profile && (
          <div className="flex flex-wrap items-center justify-center gap-3">
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
    </section>
  );
}