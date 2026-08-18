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

## Fitur tambahan (level skill, kategori, tech stack)
- [x] **Skill pakai level** (bukan persentase): kolom `proficiency` → `level ENUM(basic, intermediate, advanced, expert)` (migrasi 002 otomatis konversi ≥90=expert, ≥70=advanced, ≥40=intermediate, sisanya basic)
- [x] **Kategori**: tabel `categories` (type blog|project, bilingual, slug unik per tipe) + pivot `blog_categories`, `project_categories` (multi-kategori per item)
- [x] **Tech stack**: tabel `tech_stacks` + pivot `project_tech_stacks`; data lama dari kolom JSON `projects.tech_stack` otomatis dipindah (JSON_TABLE)
- [x] API: `GET/POST/PUT/DELETE /api/admin/categories?type=`, `/api/admin/tech-stacks`; projects/blogs menerima `tech_stack_ids` & `category_ids`; publik mengembalikan `tech_stack`/`categories` (nama sesuai bahasa)
- [x] Admin: halaman Kategori (tab Blog/Proyek) & Teknologi baru di sidebar; SkillsPage pakai dropdown level; ProjectForm/BlogForm pakai CheckboxGroup multi-pilih; Dashboard + stats baru
- [x] Portfolio: SkillsSection badge level (label i18n), kartu & detail menampilkan kategori + tech stack
- [x] Seed diperbarui (level, kategori, tech stack, pivot) — idempotent
- [x] Build semua OK, uji end-to-end OK (CRUD kategori/tech-stack, pivot, publik)

## Perubahan tampilan & fitur landing page
- [x] Nama profil di DB + seed → **Ahmad Kubagus Subkhi** (hero & footer memakai `profile.name`)
- [x] Link `/admin` di footer **dihapus**
- [x] **Hero**: teks di tengah, nama besar (gradient primary→teal, hingga text-6xl), avatar di atas, tombol Contact Me + CV + badge — meniru kubagus.pages.dev
- [x] **What I Do**: section 3 kartu (Software & System Engineering, Data & IT Architecture, Optimization & Tech Strategy) bilingual i18n, tepat sebelum footer
- [x] **Skills badge**: lebar seragam `w-28 justify-center` (tidak beda ukuran antar level)
- [x] **Filter landing**: Proyek → filter kategori + tech stack (pill), urut unggulan dulu; Blog → filter kategori; data dari API `limit=100` difilter client-side, `FilterPills` reusable
- [x] Build OK, lint OK, module transform OK, data filter teruji

## Perbaikan hero, filter, views & paginasi
- [x] **Hero**: nama tanpa gradien — warna solid `text-foreground` (hitam di light mode)
- [x] **Filter dipindah ke halaman daftar**: Projects (kategori + tech stack) & Blog (kategori); landing page kembali sederhana (featured + latest)
- [x] **Bug views fix**: `GET detail` tidak lagi menambah views; endpoint terpisah `POST /:lang/blogs/:slug/view` + guard `useRef` di BlogDetailPage (StrictMode double-effect hanya menghitung 1×; refresh = 1 view)
- [x] **Pagination prev/next**: detail blog & project menampilkan nav Sebelumnya/Berikutnya (komponen `AdjacentNav`, dari API `prev`/`next` sesuai urutan daftar publik)
- [x] Build OK, lint OK, teruji: GET 2× views tetap, POST view +1, prev/next benar di kedua tipe

## Filter dropdown, fix social, badge custom
- [x] **Filter dropdown**: halaman Projects (dropdown Kategori + dropdown Teknologi) & Blog (dropdown Kategori) pakai shadcn Select; komponen FilterPills dihapus
- [x] **Bug admin social links**: "Expected boolean, received number" — `is_active` dari API berupa 0/1 (TINYINT) dikirim ulang ke PUT tanpa konversi. Fix: normalisasi `is_active: !!current.is_active` saat update + Switch mengirim boolean
- [x] **Badge kustom**: migration 003 → `profile.badge_show` + `badge_text_id/en`; API publik mengembalikan `badge_show` + `badge_text` (per bahasa); admin bisa atur tampil/sembunyi (independen dari status available_for_hire) + teks custom per bahasa; hero menampilkan teks kustom atau fallback i18n, hanya jika `badge_show=1`
- [x] Build semua OK, teruji: social create/update boolean OK, badge show=0/text custom → publik OK

## Perbaikan bug: tombol CV hilang & input social me-refresh
- [x] **Tombol CV hilang saat badge ditampilkan**: penyebab — `cv_url` di DB menjadi string kosong `""`/salah karena saat admin menyimpan profil, field kosong ditulis apa adanya (bukan NULL) → `cv_url` falsy → tombol CV tidak dirender. Fix: API `PUT /admin/profile` kini **menormalkan string kosong → NULL** (`norm()` untuk semua field teks); data CV di DB dipulihkan ke placeholder (`https://drive.google.com/cv-id.pdf` / `cv-en.pdf`) — ganti dengan link asli di panel admin
- [x] **Input link media sosial me-refresh**: penyebab — PUT dikirim **setiap ketikan** + `refetch()` yang me-reset state → seolah halaman refresh. Fix: input social kini **edit lokal** (state) & **simpan saat blur** (`onBlur`) / toggle aktif langsung simpan; tidak ada PUT per karakter
- [x] Teruji: PUT empty → `cv_url` null (tombol CV benar-benar tersembunyi), PUT full → CV muncul di id & en, `badge_show` tetap 1

## Konfirmasi contact & rate limit login
- [x] **Konfirmasi kirim pesan**: tombol Kirim → dialog ringkasan (nama, email, subjek, pesan) → "Ya, Kirim"/"Batal" (i18n id/en)
- [x] **Rate limit login**: `src/services/loginAttempts.ts` (in-memory per email+IP) — 5× gagal → terkunci 3 menit (429), pesan sisa percobaan (401) di tiap kegagalan, password benar pun tetap diblokir saat terkunci; berhasil login → counter direset; `trust proxy loopback` agar IP benar saat di belakang nginx
- [x] Teruji: 1-4 gagal 401 sisa percobaan, ke-5 & ke-6 → 429 "Coba lagi dalam 3 menit", email lain tidak terpengaruh

## Dialog admin tidak menutup saat klik di luar
- [x] **Form dialog anti-close**: `admin/src/components/ui/dialog.tsx` — `DialogContent` kini mem-block `onPointerDownOutside` + `onInteractOutside` secara default, jadi klik area luar tidak menutup form (mencegah data hilang saat sedang edit). Tombol Escape, X, dan Batal tetap berfungsi. Prop opsional `closeOnOutsideClick` untuk mengembalikan perilaku lama
- [x] Berlaku untuk semua dialog admin: Pengalaman/Pendidikan, Skills, Kategori, Tech Stack, dan dialog gambar TipTap (di form project/blog)
- [x] Build OK, lint OK

## Nama perusahaan (pengalaman) bilingual
- [x] **Migration `004_experience_company_en.sql`**: kolom `company_en VARCHAR(150) NULL` di tabel `experiences` (sudah diterapkan ke DB)
- [x] **API admin** (`routes/admin/timeline.ts`): schema + POST/PUT menerima `company_en` untuk experiences (educations tidak terpengaruh); GET mengembalikan `company_en`
- [x] **API publik** (`routes/public.ts`): `GET /:lang/experiences` — bahasa `en` mengembalikan `COALESCE(company_en, company) AS company`, bahasa `id` tetap `company`
- [x] **Admin** (`TimelinePage.tsx`, `lib/types.ts`): input "Company (EN)" di samping "Perusahaan" (hanya Pengalaman)
- [x] Seed diperbarui dengan `company_en`
- [x] Teruji end-to-end: PUT `company_en` → `GET /api/en/experiences` menampilkan versi Inggris, `/api/id/experiences` tetap Indonesia; server API di-restart dengan build baru

## Isi konten pengalaman & pendidikan dari kubagus.pages.dev
- [x] Data diambil dari Supabase situs kubagus.pages.dev (tabel `experience` & `education`) dan diisi ke kubagus.com via admin API (data seed lama dihapus):
  - **Pengalaman** (urutan terbaru di atas): Magang Maganghub — Kementerian Imigrasi dan Pemasyarakatan, Pemalang (Nov 2025–Mei 2026) · Magang MBKM Mandiri — Yayasan Tuberkulosis Terbesar Yogyakarta (Mar–Jun 2024) · Freelance Web Developer — Dsarea (Okt 2023–Apr 2024)
  - **Pendidikan**: Sarjana Komputer (S1 Informatika) — Universitas Muhammadiyah Semarang (2021–2025) · Matematika dan IPA — SMA Negeri 2 Pemalang (2018–2021)
- [x] Semua konten bilingual (ID/EN) termasuk `company_en`; tampilan web tidak diubah
- [x] Terverifikasi via API publik id & en (urutan, konten, bahasa)

## Deskripsi pengalaman bullet point & card klik penuh
- [x] **BulletListInput** (`admin/src/components/admin/BulletListInput.tsx`): editor deskripsi per poin — tiap baris jadi input sendiri, tombol "Tambah poin", hapus per poin, Enter untuk poin baru; dipakai di form Pengalaman & Pendidikan (tab ID/EN); input posisi tetap tersedia ("Posisi (ID)" / "Position (EN)")
- [x] **Render bullet di publik** (`portfolio/.../Timeline.tsx`): deskripsi pengalaman ditampilkan sebagai bullet list (satu baris = satu poin, prefix `|-` otomatis dibersihkan); deskripsi pendidikan tetap paragraf
- [x] **Card klik penuh**: `ProjectCard.tsx` & `BlogCard.tsx` — stretched link overlay (`absolute inset-0 z-10`) menutupi seluruh card → klik di mana pun (gambar/judul/ringkasan) menuju halaman detail; tombol demo/github/"Lihat Proyek"/"Baca Selengkapnya" diberi `z-20` agar tetap berfungsi
- [x] Build OK, lint OK (hanya warning lama)

## Logo "|<_", layout About & hero Kontak
- [x] **Logo diubah ke `|<_`** (menggantikan `|<`): `portfolio/.../layout/Logo.tsx`, favicon `portfolio/public/favicon.svg` (ukuran font disesuaikan agar muat), logo halaman login admin, dan logo sidebar dashboard admin (`AdminLayout.tsx` — desktop & mobile)
- [x] **Layout About**: `Timeline.tsx` — grid 2 kolom diganti stacked (`space-y-10`); section **Experience selebar halaman penuh**, **Education di bawahnya** (urutan: About → Experience → Education → Skills)
- [x] **Hero Kontak**: halaman Contact kini punya hero section di tengah — avatar profil (skeleton saat loading), judul besar, subtitle, email/telepon; form di bawahnya tetap `max-w-3xl`
- [x] **Placeholder login admin dihapus** (`LoginPage.tsx`): field email & kata sandi tanpa placeholder
- [x] Build OK, lint OK

## Ikon keahlian tampil di landing page
- [x] **SkillIcon** (`portfolio/src/components/content/SkillIcon.tsx`): render ikon skill di samping nama pada `SkillsSection` — dukungan URL/path/data-URI sebagai `<img>`, nama polos (mis. "react") otomatis dibangun URL icon, dan **fallback `onError` → ikon lucide Code** (tidak ada gambar rusak)
- [x] **Migration `005_skill_icon_url.sql`**: kolom `skills.icon` diperbesar `VARCHAR(50)` → `VARCHAR(255)` agar muat URL; API admin (`routes/admin/skills.ts`) ikut dinaikkan `z.string().max(50)` → `max(255)`
- [x] **Sumber ikon**: awalnya badge img.shields.io (`--000` = background hitam) → **tidak cocok light mode** dan `logo=Node.js` tidak dikenali (slug simple-icons = `nodedotjs`) → diganti ke **cdn.simpleicons.org** (glyph murni warna brand, tanpa background, cocok light & dark). 8 skill diisi URL warna brand (React #61DAFB, TypeScript #3178C6, Node.js #339933, MySQL #4479A1, TailwindCSS #06B6D4, Git #F05032, Docker #2496ED, PHP #777BB4); "Server Management" kosong → fallback ikon Code
- [x] Nama polos di admin diberi warna abu adaptif tema (gelap `e5e7eb` / terang `1f2937`)
- [x] Build OK, lint OK; semua URL cdn.simpleicons.org terverifikasi 200

## Tersisa (opsional / kapan-kapan)
- [ ] HTTPS (certbot) + `COOKIE_SECURE=true`, `CORS_ORIGIN` daftar origin di produksi
- [ ] Deploy nginx per konfigurasi di `plan/MULTI-SITE.md`
- [ ] Uji penuh di browser (login admin, editor TipTap, alur terbit)

### Kredensial dev
- API: `http://localhost:3001` · Admin seed: `admin@kubagus.com` / `admin123`
- DB: `kubagus_com` (root, tanpa password)