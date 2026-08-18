import { Briefcase, GraduationCap, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, educationsPath, experiencesPath } from "@/lib/api";
import type { Education, Experience } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

interface TimelineItem {
  id: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: number;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPeriod(start: string, end: string | null, isCurrent: number, lang: string, present: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const locale = lang === "id" ? "id-ID" : "en-US";
  const startDate = parseDate(start);
  if (!startDate) return "";
  const startLabel = startDate.toLocaleDateString(locale, opts);
  const endDate = parseDate(end);
  const endLabel = isCurrent ? present : endDate ? endDate.toLocaleDateString(locale, opts) : "—";
  return `${startLabel} — ${endLabel}`;
}

function TimelineList({
  items,
  emptyText,
  lang,
  present,
  bullets = false,
}: {
  items: TimelineItem[];
  emptyText: string;
  lang: string;
  present: string;
  bullets?: boolean;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[31px] flex size-3 items-center justify-center rounded-full bg-primary ring-4 ring-background">
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          </span>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm font-medium text-muted-foreground">{item.subtitle}</p>
          <p className="text-xs text-muted-foreground">
            {formatPeriod(item.start_date, item.end_date, item.is_current, lang, present)}
          </p>
          {item.description &&
            (bullets ? (
              <ul className="mt-2 space-y-1.5">
                {item.description
                  .split("\n")
                  .map((line) => line.replace(/^\|-\s*/, ""))
                  .filter((line) => line.trim().length > 0)
                  .map((line, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{line}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            ))}
        </li>
      ))}
    </ol>
  );
}

function TimelineColumn({
  icon: Icon,
  title,
  loading,
  items,
  emptyText,
  lang,
  present,
  bullets = false,
}: {
  icon: LucideIcon;
  title: string;
  loading: boolean;
  items: TimelineItem[];
  emptyText: string;
  lang: string;
  present: string;
  bullets?: boolean;
}) {
  return (
    <section className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Icon className="size-5" /> {title}
      </h2>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <TimelineList items={items} emptyText={emptyText} lang={lang} present={present} bullets={bullets} />
      )}
    </section>
  );
}

export function Timeline() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const present = t("common.present");

  const experiences = useApi<Experience[]>(() => apiGet(experiencesPath(lang)), [lang]);
  const educations = useApi<Education[]>(() => apiGet(educationsPath(lang)), [lang]);
  const loading = experiences.loading || educations.loading;

  return (
    <div className="space-y-10">
      <TimelineColumn
        icon={Briefcase}
        title={t("about.experience")}
        loading={loading}
        items={(experiences.data ?? []).map((e) => ({
          id: e.id,
          title: e.position,
          subtitle: e.company,
          description: e.description,
          start_date: e.start_date,
          end_date: e.end_date,
          is_current: e.is_current,
        }))}
        emptyText="—"
        lang={lang}
        present={present}
        bullets
      />
      <TimelineColumn
        icon={GraduationCap}
        title={t("about.education")}
        loading={loading}
        items={(educations.data ?? []).map((e) => ({
          id: e.id,
          title: e.degree,
          subtitle: e.institution,
          description: e.description,
          start_date: e.start_date,
          end_date: e.end_date,
          is_current: e.is_current,
        }))}
        emptyText="—"
        lang={lang}
        present={present}
      />
    </div>
  );
}