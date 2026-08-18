import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillIcon } from "@/components/content/SkillIcon";
import { useApi } from "@/lib/hooks";
import { apiGet, skillsPath } from "@/lib/api";
import type { Skill, SkillLevel } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

const levelVariant: Record<SkillLevel, "secondary" | "outline" | "default"> = {
  basic: "secondary",
  intermediate: "outline",
  advanced: "default",
  expert: "default",
};

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
            <div className="space-y-2">
              {list.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <SkillIcon icon={skill.icon} className="size-4" />
                    <span className="font-medium">{skill.name}</span>
                  </span>
                  <Badge variant={levelVariant[skill.level]} className="w-28 justify-center">
                    {t(`levels.${skill.level}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}