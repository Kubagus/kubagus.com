import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/lib/hooks";
import { apiGet, profilePath } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialIcon } from "@/components/content/SocialIcon";

export function Footer() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: profile, loading } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);

  const socials = profile?.socials ?? [];

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {profile?.name ?? "kubagus.com"}
        </p>
        <div className="flex items-center gap-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="size-8 rounded-md" />)
            : socials.map((social) => (
                <Button key={social.id} variant="ghost" size="icon" asChild>
                  <a href={social.url} target="_blank" rel="noreferrer" aria-label={social.platform}>
                    <SocialIcon name={social.icon} />
                  </a>
                </Button>
              ))}
        </div>
        <Link to="/admin" className="text-xs text-muted-foreground/60 hover:text-foreground">
          {t("nav.home")} · admin
        </Link>
      </div>
    </footer>
  );
}