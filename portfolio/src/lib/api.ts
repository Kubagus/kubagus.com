import type { ContactFormData, Lang } from "./types";

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
export const SITE_KEY = import.meta.env.VITE_SITE_KEY ?? "portfolio";

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? "Request gagal";
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { "X-Site-Key": SITE_KEY },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    headers: { "X-Site-Key": SITE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export function contactSubmit(data: ContactFormData) {
  return apiPost<{ success: boolean }>("/contact", data);
}

export const profilePath = (lang: Lang) => `/${lang}/profile`;
export const experiencesPath = (lang: Lang) => `/${lang}/experiences`;
export const educationsPath = (lang: Lang) => `/${lang}/educations`;
export const skillsPath = (lang: Lang) => `/${lang}/skills`;
export const projectsPath = (lang: Lang) => `/${lang}/projects`;
export const projectDetailPath = (lang: Lang, slug: string) => `/${lang}/projects/${slug}`;
export const blogsPath = (lang: Lang) => `/${lang}/blogs`;
export const blogDetailPath = (lang: Lang, slug: string) => `/${lang}/blogs/${slug}`;

export function blogViewPath(lang: Lang, slug: string) {
  return `/${lang}/blogs/${slug}/view`;
}

export function blogView(lang: Lang, slug: string) {
  return apiPost<{ views: number }>(blogViewPath(lang, slug));
}

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${API_URL}${path}`;
}