import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Download, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, profilePath } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function AboutSection() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: profile, loading } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);

  return (
    <section className="space-y-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("about.title")}</h2>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : profile ? (
        <>
          <div className="mx-auto max-w-3xl space-y-4 text-justify text-muted-foreground">
            {profile.summary?.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

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
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {profile.location}
              </span>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Mail className="size-4" /> {profile.email}
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Phone className="size-4" /> {profile.phone}
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{t("common.error")}</p>
      )}
    </section>
  );
}