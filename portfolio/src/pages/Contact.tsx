import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/hooks";
import { apiGet, assetUrl, contactSubmit, profilePath } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import type { ContactFormData, Profile } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function ContactPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useSeo(t("contact.title"), t("contact.subtitle"), lang);
  const { data: profile, loading } = useApi<Profile>(() => apiGet(profilePath(lang)), [lang]);
  const picture = assetUrl(profile?.profile_picture);

  const [form, setForm] = useState<ContactFormData>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  function update<K extends keyof ContactFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    setConfirmOpen(true);
  }

  async function confirmSend() {
    setConfirmOpen(false);
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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          {loading ? (
            <>
              <Skeleton className="size-28 rounded-full" />
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-6 w-48" />
            </>
          ) : (
            <>
              {picture && (
                <Avatar className="size-28 border-4 border-border shadow-lg">
                  <AvatarImage src={picture} alt={profile?.name ?? "Avatar"} />
                  <AvatarFallback className="text-4xl">
                    {profile?.name?.charAt(0) ?? "A"}
                  </AvatarFallback>
                </Avatar>
              )}
              <h1 className="pb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t("contact.title")}
              </h1>
              <p className="max-w-2xl text-muted-foreground">{t("contact.subtitle")}</p>
              {profile?.email && (
                <p className="text-sm text-muted-foreground">
                  {profile.email} {profile.phone ? `· ${profile.phone}` : ""}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <form onSubmit={onSubmit} className="mx-auto mt-12 max-w-3xl space-y-5">
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("contact.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("contact.confirmDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <p>
              <span className="font-medium">{t("contact.name")}: </span>
              {form.name}
            </p>
            <p>
              <span className="font-medium">{t("contact.email")}: </span>
              {form.email}
            </p>
            {form.subject && (
              <p>
                <span className="font-medium">{t("contact.subject")}: </span>
                {form.subject}
              </p>
            )}
            <p className="whitespace-pre-wrap">
              <span className="font-medium">{t("contact.message")}: </span>
              {form.message}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("contact.cancel")}
            </Button>
            <Button onClick={confirmSend}>
              <Send className="mr-1 size-4" /> {t("contact.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}