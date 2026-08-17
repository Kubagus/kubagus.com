import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/lib/hooks";
import { apiGet, profilePath } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialIcon } from "@/components/content/SocialIcon";

const quickLinks = [
  { to: "/", key: "home" },
  { to: "/about", key: "about" },
  { to: "/projects", key: "projects" },
  { to: "/blog", key: "blog" },
  { to: "/contact", key: "contact" },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: profile, loading } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);

  const socials = profile?.socials ?? [];

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <p className="font-semibold">{profile?.name ?? "Ahmad Kubagus Subkhi"}</p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {profile?.name ?? "Ahmad Kubagus Subkhi"}
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-1">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </nav>

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
      </div>
    </footer>
  );
}