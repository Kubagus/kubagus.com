# Rencana Pembangunan Website Portofolio kubagus.com

## 1. Gambaran Umum

Website portofolio pribadi dua bahasa (Indonesia & Inggris) dengan:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + lucide-react
- **Backend**: Express + TypeScript + mysql2 (query manual)
- **Database**: MySQL 8.0.30 (database `kubagus_com`, sudah ada & kosong)
- **Editor teks**: TipTap (untuk blog & project yang memuat source code)
- **Admin panel**: `/admin` untuk mengelola seluruh konten
- **Multi-tenant**: backend terpusat yang melayani banyak website subdomain

## 2. Struktur Folder

```
kubagus.com/
├── api/                      Express + TypeScript (backend terpusat, dilayani semua situs)
│   ├── src/
│   │   ├── index.ts / app.ts          Express setup, cors (credentials), json, cookie-parser,
│   │   │                              static /uploads
│   │   ├── config/db.ts               mysql2/promise pool (env DB_*)
│   │   ├── middleware/
│   │   │   ├── auth.ts                Verifikasi JWT dari cookie HTTP-only (fallback Bearer)
│   │   │   ├── tenant.ts              Deteksi tenant dari Host header / X-Site-Key
│   │   │   └── errorHandler.ts
│   │   ├── routes/                    auth, profile, experiences, educations, skills,
│   │   │                              projects, blogs, contact, settings, upload
│   │   ├── controllers/               CRUD per resource
│   │   ├── services/                  Logika bisnis
│   │   ├── migrations/*.sql           + scripts/migrate.ts, scripts/seed.ts
│   │   └── uploads/                   Multer: gambar sampul, foto profil, file CV
│   ├── package.json                   (independen, node_modules sendiri)
│   └── .env                           DB_*, JWT_SECRET, COOKIE_*, CORS_ORIGIN, UPLOAD_DIR, PORT
├── portfolio/                React + Vite (frontend portofolio kubagus.com)
│   ├── src/
│   │   ├── main.tsx / App.tsx
│   │   ├── lib/api.ts / lib/utils.ts / lib/seo.ts (meta per bahasa)
│   │   ├── i18n/                      i18next (id/en) untuk UI labels
│   │   ├── contexts/                  LanguageContext, ThemeContext
│   │   ├── components/
│   │   │   ├── ui/                    shadcn/ui (button, card, badge, dialog, dll.)
│   │   │   ├── layout/                Navbar, Footer, LanguageSwitcher, ThemeToggle
│   │   │   ├── home/                  Hero, FeaturedProjects, LatestPosts
│   │   │   ├── about/                 AboutSection, TimelineItem, SkillsGrid
│   │   │   ├── content/               RichContent (sanitasi + prose), ProjectCard, BlogCard
│   │   │   └── admin/                 (tidak dipakai — admin terpisah di folder admin/)
│   │   └── pages/
│   │       ├── Home, About, Projects, ProjectDetail,
│   │       ├── Blog, BlogDetail, Contact, NotFound
│   │       └── admin/                 (tidak dipakai)
│   ├── package.json                   (independen, node_modules sendiri)
│   └── .env                           VITE_API_URL, VITE_SITE_KEY
├── admin/                    React + Vite (panel admin, port dev 5174)
│   ├── src/
│   │   ├── lib/api.ts                 fetch + credentials include (cookie JWT), 401 → redirect
│   │   ├── contexts/AuthContext.tsx   restore sesi via /auth/me, login, logout
│   │   ├── components/admin/          AdminLayout (sidebar), TipTapEditor, ImageUpload
│   │   └── pages/                     Login, Dashboard, Profile, Experiences, Educations,
│   │                                  Skills, Projects(+form), Blogs(+form), Messages, Settings
│   └── .env                           VITE_API_URL, VITE_SITE_KEY
└── [situs-lain]/             (nanti: folder frontend baru, independen)

Rencana pembangunan: plan/PLAN.md
Multi-situs & deploy:    plan/MULTI-SITE.md
Progress pengerjaan:     progress/
```

Catatan:
- Tanpa npm workspaces — tiap folder independen, menambah situs baru tidak menyentuh folder lain.
- Shared types: duplikasi ringan di tiap frontend (opsional: folder `shared/` dengan path alias).

## 3. Skema Database (bilingual via kolom `_id` / `_en`)

| Tabel | Kolom penting (bilingual ditandai) |
|---|---|
| `sites` | id, domain, subdomain, name, is_active — fondasi multi-tenant |
| `admins` | id, name, email, password_hash, role, site_id |
| `profile` | name, title_id/_en, headline_id/_en, summary_id/_en, profile_picture, location_id/_en, cv_url_id, cv_url_en, site_id |
| `social_links` | platform, url, icon, sort_order, site_id |
| `experiences` | company, position_id/_en, description_id/_en, start_date, end_date, is_current, sort_order (timeline CV) |
| `educations` | institution, degree_id/_en, description_id/_en, start_date, end_date, is_current, sort_order (timeline CV) |
| `skills` | name_id/_en, category, icon, proficiency, sort_order |
| `projects` | slug, title_id/_en, summary_id/_en, content_id/_en (TipTap), cover_image, tech_stack (JSON), github_url, demo_url, is_featured, published, published_at |
| `blogs` | slug, title_id/_en, excerpt_id/_en, content_id/_en (TipTap), cover_image, tags (JSON), published, published_at, views |
| `contact_messages` | name, email, subject, message, is_read |
| `settings` | key, value (per site: logo, SEO meta, hero image) |

- Migrasi: folder `src/migrations/*.sql` + script runner sederhana (tracking `schema_migrations`).
- Semua tabel konten punya `site_id` → setiap request publik difilter per tenant.
- Konten TipTap disimpan sebagai HTML (mudah dirender + DOMPurify untuk sanitasi).

## 4. Backend (Express, multi-tenant)

- **Endpoint publik** (tenant-scoped):
  - `GET /api/:lang/profile`, `/experiences`, `/educations`, `/skills`, `/projects`, `/projects/:slug`, `/blogs`, `/blogs/:slug`
  - `POST /api/contact`
  - Bahasa dipilih lewat kolom: `:lang = id|en` → query kolom `*_id` atau `*_en`.
- **Endpoint admin** (JWT): CRUD semua resource, upload file, login/logout.
- **Identifikasi tenant**:
  - Production: middleware `tenant.ts` membaca Host header → lookup `sites` table.
  - Development: fallback header `X-Site-Key` (mis. `portfolio`).
  - Request tanpa tenant di-reject (kecuali admin login).
- **Auth**: JWT + bcrypt. Login admin → token disimpan client (localStorage) untuk akses `/admin`.

## 5. Frontend Publik

- **Halaman**:
  - **Home**: hero + featured projects + latest posts
  - **About**: profil singkat, tombol Contact Me, tombol CV (link ID/EN sesuai bahasa aktif), timeline Experience & Education ala CV, Skills
  - **Projects**: grid + detail dengan konten rich + source code
  - **Blog**: list + detail
  - **Contact**: form → `contact_messages`
- **i18n**: konten dari DB (kolom bahasa), label UI dari i18next (id/en). Bahasa via switcher + localStorage.
- **Tema**: dark/light via ThemeContext + toggle.
- **TipTap**: di admin pakai `@tiptap/react` + StarterKit + CodeBlockLowlight (syntax highlighting). Publik dirender lewat komponen renderer + DOMPurify.

## 6. Admin Panel (`/admin`)

Login (JWT) → Dashboard → CRUD: Profil (termasuk CV link ID + EN), Experience, Education, Skills, Projects, Blog (dengan TipTap editor, tab ID/EN per field), Pesan kontak (read/unread), Pengaturan. Semua form punya dua tab bahasa.

## 7. Rute Implementasi (fase)

1. **Scaffold** — folder `api/` (Express+TS+env) dan `portfolio/` (Vite+Tailwind+shadcn/ui).
2. **Database** — tulis semua migration SQL + runner + seed data contoh.
3. **Backend API** — auth, tenant middleware, CRUD lengkap, upload, validasi.
4. **Frontend publik** — layout, navbar/footer, switcher bahasa & tema, halaman Home/About/Projects/Blog/Contact.
5. **Admin** — login, dashboard, CRUD semua resource, TipTap editor, upload gambar.
6. **Multi-situs** — dokumentasi penambahan situs baru + konfigurasi nginx.
7. **Finalisasi** — sanitasi, SEO meta per bahasa, deploy, uji end-to-end.

## 8. Deployment

- Build Vite → disajikan nginx per situs; API di port 3001; `/api` & `/uploads` di-proxy ke API.
- Wildcard DNS `*.kubagus.com` → server yang sama; wildcard nginx → reverse proxy ke API (deteksi tenant dari Host header).
- Env: `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`, `JWT_SECRET`, `UPLOAD_DIR`, `PORT`.
