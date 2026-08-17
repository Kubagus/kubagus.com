# Progress Pembangunan kubagus.com

## Fase 1 & 2 — Scaffold + Database (SELESAI)

### api/ (Express + TypeScript)
- [x] `package.json` (Express, mysql2, JWT, bcryptjs, multer 2.x, zod, sanitize-html, helmet, cors, morgan; dev: tsx, typescript)
- [x] `tsconfig.json` (NodeNext, strict), `.env` + `.env.example`, `.gitignore`
- [x] `src/config/env.ts`, `src/config/db.ts` (mysql2 pool + helper `query<T>`)
- [x] `src/utils/httpError.ts` (AppError + helpers)
- [x] `src/middleware/tenant.ts` (deteksi situs dari Host header / X-Site-Key, cache in-memory)
- [x] `src/middleware/auth.ts` (requireAuth JWT)
- [x] `src/middleware/errorHandler.ts`
- [x] `src/app.ts` (helmet, cors, json, morgan, static /uploads, /api router)
- [x] `src/index.ts` (bootstrap, port 3001)
- [x] `src/routes/health.ts` + `src/routes/index.ts` (kerangka router, siap diisi Fase 3)
- [x] `src/migrations/001_init.sql` — skema lengkap bilingual
- [x] `scripts/migrate.ts` — runner migrasi (tracking `schema_migrations`)
- [x] `scripts/seed.ts` — seed: site, admin, profil, social, experience, education, skill, project, blog, settings
- [x] Migrasi + seed TERJALAN ke MySQL `kubagus_com` (MySQL 8.0.30, root tanpa password)
- [x] Health check OK: `GET /api/health` → `{"status":"ok"}`
- [x] `npm run typecheck` bersih

### portfolio/ (React + Vite)
- [x] Scaffold `npm create vite` (React 19, Vite 8, TypeScript 6, oxlint)
- [x] Dep: react-router-dom, i18next + react-i18next + languagedetector, lucide-react, clsx/tailwind-merge/cva
- [x] TipTap: @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-code-block-lowlight, lowlight
- [x] Tailwind CSS v4 (`@tailwindcss/vite`) + `tw-animate-css`
- [x] shadcn/ui 16 komponen: button, card, badge, input, textarea, label, select, tabs, dialog, dropdown-menu, table, avatar, separator, sheet, skeleton, sonner
- [x] Alias `@/` → `src/` di vite.config.ts + tsconfig.app.json
- [x] `src/lib/utils.ts` (cn), `components.json`, `src/index.css` (tema shadcn neutral + dark)
- [x] `npm run build` OK

### Catatan kendala yang sudah diatasi
- Multer 1.x punya vuln → upgrade ke 2.x.
- `baseUrl` deprecated di TS 6 → pakai `ignoreDeprecations: "6.0"`.
- CLI shadcn di Windows membuat folder literal `@/` → dipindah manual ke `src/components/`.

## Fase 3 — Backend API (SELESAI)
- [x] `src/utils/asyncHandler.ts` — wrapper async error handler
- [x] `src/utils/lang.ts` — pickLang + langCols (pemilih kolom bilingual `_id`/`_en`)
- [x] `src/config/db.ts` — dua helper: `query<T>` (SELECT → T[]) & `execute` (ResultSetHeader)
- [x] Auth: `POST /api/auth/login` (JWT+bcrypt), `GET /api/auth/me`
- [x] Publik (tenant-scoped, `:lang = id|en`): profile+socials, experiences, educations, skills, projects (list+detail), blogs (list+detail + views++), `POST /api/contact`
- [x] Admin (JWT + requireSiteMatch): CRUD profile+socials, experiences, educations, skills, projects, blogs (validasi slug unik), messages (list/read/delete), settings (get/put/delete), upload (multer 2.x, filter gambar+pdf), `GET /api/admin/stats`
- [x] Tenant middleware: Host header (produksi) / `X-Site-Key` (dev) / query `?site=`
- [x] Typecheck bersih + uji end-to-end lengkap (publik, admin CRUD, upload, penolakan tenant & file exe) — semua OK
- [x] Kendala diatasi: mysql2 auto-parse kolom JSON → helper `parseJson` tahan string/array

## Fase 4 — Frontend Publik (SELESAI)
- [x] Fondasi: `lib/api.ts` (API_URL dari `VITE_API_URL`, header `X-Site-Key`, helper path per bahasa), `lib/types.ts`, `lib/hooks.ts` (useApi), env `.env`
- [x] i18n: i18next + react-i18next, locale `id.json`/`en.json`, persist localStorage
- [x] Context: LanguageProvider (`id`/`en`) + ThemeProvider (dark/light)
- [x] Layout: Navbar (sticky, menu mobile via Sheet), Footer (social icons), LanguageSwitcher, ThemeToggle
- [x] Home: Hero (profil, tombol Contact Me + CV, avatar, badge tersedia), FeaturedProjects, LatestPosts
- [x] About: profil singkat (multi-paragraf) + Contact Me + CV + info kontak, Timeline Experience & Education (gaya CV), Skills (per kategori + progress bar)
- [x] Projects: grid ProjectCard (cover, summary, tech stack, demo/github) + halaman detail (RichContent)
- [x] Blog: grid BlogCard + detail (tag, tanggal, views) + RichContent
- [x] RichContent: DOMPurify sanitasi + `@tailwindcss/typography` (prose) + style blok kode TipTap
- [x] Contact: form (nama/email/subjek/pesan) → POST /contact, status sukses/gagal
- [x] NotFound 404
- [x] Kendala diatasi: lucide-react v1 menghapus brand icon (Github/Linkedin/Twitter) → `SocialIcon` pakai simple-icons + path manual (linkedin/x)
- [x] Build OK, lint OK, semua rute 200, module transform tanpa error

## Fase 5 — Admin Panel (SELESAI, folder sendiri `admin/`)
- [x] Struktur baru: `kubagus.com/api` + `kubagus.com/portfolio` + `kubagus.com/admin` (frontend admin independen)
- [x] Scaffold Vite React TS + Tailwind v4 + shadcn/ui (18 komponen) + alias `@/`
- [x] Port dev admin: **5174** (strictPort, anti-bentrok dengan portfolio 5173)
- [x] `lib/api.ts`: token JWT di localStorage, auto-redirect 401, upload FormData
- [x] AuthContext: restore sesi via `/auth/me`, login, logout
- [x] AdminLayout: sidebar (desktop) + Sheet (mobile), badge unread pesan, link "Lihat situs"
- [x] Login page + RequireAuth (redirect ke /admin/login)
- [x] Dashboard: kartu statistik dari `/admin/stats` + tombol cepat
- [x] Profil: tab bahasa ID/EN (title, headline, summary, lokasi, **link CV ID & EN**), foto (ImageUpload), social links CRUD
- [x] Pengalaman & Pendidikan: tabel + dialog form bilingual, tanggal mulai/selesai, "masih berlangsung", urutan
- [x] Keahlian: CRUD bilingual + kategori + level 0-100 + aktif/nonaktif
- [x] Proyek: tabel (cover, status terbit/draf, unggulan) + form lengkap dengan **TipTapEditor bilingual** (toolbar: heading, bold/italic/strike, list, quote, inline code, **code block dengan syntax highlight**), ImageUpload, slug otomatis, tech stack
- [x] Blog: tabel (tag, views, status) + form bilingual (judul, excerpt, konten TipTap, tag)
- [x] Pesan: tab semua/belum dibaca, tandai dibaca, balas (mailto), hapus
- [x] Pengaturan: SEO (judul+deskripsi) & tema default
- [x] Code-split: TipTapEditor jadi chunk lazy (~585 KB hanya dimuat di halaman form)
- [x] Build OK, lint OK (hanya warning fast-refresh), 17 module transform OK, roundtrip konten TipTap + code block via API teruji

### Cara menjalankan (3 server)
- API: `cd api && npm run dev` (port 3001)
- Portfolio: `cd portfolio && npm run dev` (port 5173)
- Admin: `cd admin && npm run dev` (port 5174) — login `admin@kubagus.com` / `admin123`

## Fase 6-7 — Multi-situs + Finalisasi (SELESAI)
- [x] **Auth JWT via HTTP-only cookie** (bukan localStorage):
  - Backend: `cookie-parser`, login `Set-Cookie: kubagus_token; HttpOnly; SameSite=Lax`, `POST /auth/logout` menghapus cookie, `requireAuth` baca cookie (fallback Bearer untuk curl/Postman)
  - CORS: `credentials: true` + `CORS_ORIGIN` configurable via env
  - Admin: fetch `credentials: "include"`, hapus semua simpan token di localStorage, 401 → logout + redirect
  - Teruji: login→cookie→me/stats OK, logout→401, preflight OPTIONS 204 + header CORS benar
- [x] **SEO per bahasa**: endpoint publik `GET /:lang/settings`, hook `useSeo` di portfolio (title + meta description dari settings, dipakai di semua halaman)
- [x] Dokumentasi: `plan/MULTI-SITE.md` (tambah situs baru, nginx wildcard, env, catatan keamanan cookie)
- [x] `plan/PLAN.md` diperbarui (struktur 3 folder + deskripsi)
- [x] `.env.example` API + admin/portfolio diperbarui

## Tersisa (opsional / kapan-kapan)
- [ ] HTTPS (certbot) + `COOKIE_SECURE=true`, `CORS_ORIGIN` daftar origin di produksi
- [ ] Deploy nginx per konfigurasi di `plan/MULTI-SITE.md`
- [ ] Uji penuh di browser (login admin, editor TipTap, alur terbit)

### Kredensial dev
- API: `http://localhost:3001` · Admin seed: `admin@kubagus.com` / `admin123`
- DB: `kubagus_com` (root, tanpa password)