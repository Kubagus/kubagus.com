export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export interface Stats {
  projects: number;
  projects_published: number;
  blogs: number;
  blogs_published: number;
  skills: number;
  experiences: number;
  educations: number;
  messages: number;
  messages_unread: number;
  categories: number;
  tech_stacks: number;
}

export interface AdminProfile {
  id: number;
  site_id: number;
  name: string;
  title_id: string | null;
  title_en: string | null;
  headline_id: string | null;
  headline_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  profile_picture: string | null;
  location_id: string | null;
  location_en: string | null;
  cv_url_id: string | null;
  cv_url_en: string | null;
  email: string | null;
  phone: string | null;
  available_for_hire: number;
}

export interface AdminSocial {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
}

export interface AdminExperience {
  id: number;
  company: string;
  position_id: string | null;
  position_en: string | null;
  description_id: string | null;
  description_en: string | null;
  start_date: string;
  end_date: string | null;
  is_current: number;
  sort_order: number;
}

export interface AdminEducation {
  id: number;
  institution: string;
  degree_id: string | null;
  degree_en: string | null;
  description_id: string | null;
  description_en: string | null;
  start_date: string;
  end_date: string | null;
  is_current: number;
  sort_order: number;
}

export type SkillLevel = "basic" | "intermediate" | "advanced" | "expert";

export interface AdminSkill {
  id: number;
  name_id: string | null;
  name_en: string | null;
  category_id: string | null;
  category_en: string | null;
  icon: string | null;
  level: SkillLevel;
  sort_order: number;
  is_active: number;
}

export interface RelItem {
  id: number;
  name: string;
  slug: string;
}

export interface AdminCategory {
  id: number;
  type: "blog" | "project";
  name_id: string | null;
  name_en: string | null;
  slug: string;
  sort_order: number;
}

export interface AdminTechStack {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface AdminProject {
  id: number;
  slug: string;
  title_id: string | null;
  title_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_featured: number;
  is_published: number;
  published_at: string | null;
  sort_order: number;
  tech_stacks: RelItem[];
  tech_stack_ids: number[];
  categories: RelItem[];
  category_ids: number[];
}

export interface AdminBlog {
  id: number;
  slug: string;
  title_id: string | null;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  tags: string[];
  is_published: number;
  published_at: string | null;
  views: number;
  categories: RelItem[];
  category_ids: number[];
}

export interface AdminMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: number;
  created_at: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface ProjectPayload {
  slug: string;
  title_id: string | null;
  title_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  tech_stack_ids: number[];
  category_ids: number[];
}

export interface BlogPayload {
  slug: string;
  title_id: string | null;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  tags: string[];
  is_published: boolean;
  category_ids: number[];
}

export function toProjectPayload(p: AdminProject): ProjectPayload {
  return {
    slug: p.slug,
    title_id: p.title_id,
    title_en: p.title_en,
    summary_id: p.summary_id,
    summary_en: p.summary_en,
    content_id: p.content_id,
    content_en: p.content_en,
    cover_image: p.cover_image,
    github_url: p.github_url,
    demo_url: p.demo_url,
    is_featured: !!p.is_featured,
    is_published: !!p.is_published,
    sort_order: p.sort_order,
    tech_stack_ids: p.tech_stack_ids,
    category_ids: p.category_ids,
  };
}

export function toBlogPayload(b: AdminBlog): BlogPayload {
  return {
    slug: b.slug,
    title_id: b.title_id,
    title_en: b.title_en,
    excerpt_id: b.excerpt_id,
    excerpt_en: b.excerpt_en,
    content_id: b.content_id,
    content_en: b.content_en,
    cover_image: b.cover_image,
    tags: b.tags,
    is_published: !!b.is_published,
    category_ids: b.category_ids,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}