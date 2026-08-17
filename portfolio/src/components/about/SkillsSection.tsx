import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { apiGet, skillsPath } from "@/lib/api";
import type { Skill } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function SkillsSection() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data: skills, loading } = useApi<Skill[]>(() => apiGet(skillsPath(lang)), [lang]);

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{t("about.skills")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </section>
    );
  }

  const grouped = new Map<string, Skill[]>();
  for (const skill of skills ?? []) {
    const category = skill.category ?? "Lainnya";
    const list = grouped.get(category) ?? [];
    list.push(skill);
    grouped.set(category, list);
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t("about.skills")}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {Array.from(grouped.entries()).map(([category, list]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h3>
            <div className="space-y-3">
              {list.map((skill) => (
                <div key={skill.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.proficiency}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${skill.proficiency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}