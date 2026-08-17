export type Lang = 'id' | 'en';

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
}

export interface Profile {
  name: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  profile_picture: string | null;
  location: string | null;
  cv_url: string | null;
  email: string | null;
  phone: string | null;
  available_for_hire: number;
  socials: SocialLink[];
}

export interface Experience {
  id: number;
  company: string | null;
  position: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: number;
}

export interface Education {
  id: number;
  institution: string | null;
  degree: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: number;
}

export interface Skill {
  id: number;
  name: string | null;
  category: string | null;
  icon: string | null;
  proficiency: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  cover_image: string | null;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  is_featured: number;
  published_at: string | null;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string[];
  views: number;
  published_at: string | null;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}