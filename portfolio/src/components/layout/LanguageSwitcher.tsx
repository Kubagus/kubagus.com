import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => setLang(lang === "id" ? "en" : "id")}
      aria-label="Ganti bahasa"
    >
      <Languages className="size-4" />
      {lang === "id" ? "ID" : "EN"}
    </Button>
  );
}