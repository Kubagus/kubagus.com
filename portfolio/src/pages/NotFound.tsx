import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-6xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.desc")}</p>
      <Button asChild>
        <Link to="/">
          <ArrowLeft className="mr-1 size-4" /> {t("notFound.back")}
        </Link>
      </Button>
    </div>
  );
}