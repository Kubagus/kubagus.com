import { Separator } from "@/components/ui/separator";
import { AboutSection } from "@/components/about/AboutSection";
import { Timeline } from "@/components/about/Timeline";
import { SkillsSection } from "@/components/about/SkillsSection";
import { useSeo } from "@/lib/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  useSeo(t("about.title"), null, lang);
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">
      <AboutSection />
      <Separator />
      <Timeline />
      <Separator />
      <SkillsSection />
    </div>
  );
}