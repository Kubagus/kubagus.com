import { useEffect } from "react";
import { apiGet } from "./api";
import type { Lang } from "./types";

interface SeoSettings {
  title?: string;
  description?: string;
}

let cachedSeo: Partial<Record<Lang, SeoSettings>> = {};

async function loadSeo(lang: Lang): Promise<SeoSettings> {
  if (cachedSeo[lang]) return cachedSeo[lang]!;
  try {
    const settings = await apiGet<Record<string, unknown>>(`/${lang}/settings`);
    const seo = (settings.seo ?? {}) as SeoSettings;
    cachedSeo = { ...cachedSeo, [lang]: seo };
    return seo;
  } catch {
    return {};
  }
}

export function useSeo(title?: string | null, description?: string | null, lang?: Lang) {
  useEffect(() => {
    let cancelled = false;

    async function apply() {
      const fallback = { title: "Kubagus — Software Engineer", description: "Portofolio dan blog pribadi Kubagus." };
      const seo = lang ? await loadSeo(lang) : fallback;

      if (cancelled) return;
      document.title = title ? `${title} — ${seo.title ?? "Kubagus"}` : (seo.title ?? fallback.title);

      const desc = description ?? seo.description ?? fallback.description;
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = desc;
    }

    apply();
    return () => {
      cancelled = true;
    };
  }, [title, description, lang]);
}