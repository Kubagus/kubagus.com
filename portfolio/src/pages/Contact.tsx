import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/hooks";
import { apiGet, contactSubmit, profilePath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { ContactFormData, Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function ContactPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("contact.title"), t("contact.subtitle"), lang);
  const { data: profile } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);

  const [form, setForm] = useState<ContactFormData>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function update<K extends keyof ContactFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await contactSubmit(form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("contact.title")}</h1>
        <p className="text-muted-foreground">{t("contact.subtitle")}</p>
        {profile?.email && (
          <p className="text-sm text-muted-foreground">
            {profile.email} {profile.phone ? `· ${profile.phone}` : ""}
          </p>
        )}
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("contact.name")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("contact.namePlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("contact.email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t("contact.emailPlaceholder")}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">{t("contact.subject")}</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder={t("contact.subjectPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">{t("contact.message")}</Label>
          <Textarea
            id="message"
            rows={6}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder={t("contact.messagePlaceholder")}
            required
          />
        </div>

        {status === "success" && (
          <p className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" /> {t("contact.success")}
          </p>
        )}
        {status === "error" && <p className="text-sm font-medium text-destructive">{t("contact.error")}</p>}

        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="mr-1 size-4 animate-spin" /> {t("contact.sending")}
            </>
          ) : (
            <>
              <Send className="mr-1 size-4" /> {t("contact.send")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}