# Multi-Site & Deployment (kubagus.com)

Satu backend (API) melayani banyak website. Setiap website punya:
- **Frontend sendiri** — folder terpisah (mis. `portfolio/`, `situs-lain/`), build statis Vite.
- **Baris `sites`** di database — identitas tenant (key, domain, aktif/tidak).

API mengenali tenant dari **Host header** (produksi) atau **header `X-Site-Key`** (development).

## Cara Menambah Website Baru

1. **Buat frontend** — salin struktur `portfolio/` atau scaffold baru:
   ```
   kubagus.com/
   ├── api/        (tidak perlu diubah)
   ├── portfolio/  (situs 1)
   └── situs-baru/ (situs 2)
   ```
   Di `.env` frontend baru: `VITE_API_URL`, `VITE_SITE_KEY=<key-unik>`.

2. **Daftarkan tenant di database**:
   ```sql
   INSERT INTO sites (key_name, name, domain) VALUES ('situs-baru', 'Situs Baru', 'situs-baru.kubagus.com');
   ```
   > Contoh: domain `kubagus.com` (key `portfolio`), `pm.kubagus.com` (key `pm`), dst.
   > Resolusi Host: cocokkan `domain` persis, atau subdomain pertama (`xxx.kubagus.com` → key `xxx`).

3. **Isi konten** — endpoint admin memakai `X-Site-Key` yang sama; setiap tabel konten difilter `site_id`.
   Untuk membuat admin situs baru:
   ```sql
   INSERT INTO admins (site_id, name, email, password_hash, role) VALUES (<id>, 'Nama', 'email@kubagus.com', '<bcrypt-hash>', 'admin');
   ```

4. **Deploy** — build frontend, letakkan di nginx, daftarkan di konfigurasi di bawah.

## Identifikasi Tenant di API

| Situasi | Cara kerja |
|---|---|
| Produksi (`kubagus.com`, `xxx.kubagus.com`) | middleware `tenant.ts` membaca `Host` → lookup `sites` |
| Development (`localhost`) | fallback header `X-Site-Key` atau query `?site=` |
| Tidak ditemukan | `404 Situs tidak ditemukan` |

## Konfigurasi nginx (wildcard subdomain)

```nginx
# /etc/nginx/conf.d/kubagus.conf

# Situs utama — portofolio (kubagus.com)
server {
    listen 80;
    server_name kubagus.com www.kubagus.com;

    root /var/www/kubagus.com/portfolio/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Situs lain (mis. situs-baru.kubagus.com) — pola sama, root & server_name diganti
# server {
#     listen 80;
#     server_name situs-baru.kubagus.com;
#     root /var/www/kubagus.com/situs-baru/dist;
#     ...
#     location /api/ { proxy_pass http://127.0.0.1:3001/api/; ... }
#     location /uploads/ { proxy_pass http://127.0.0.1:3001/uploads/; }
#     location / { try_files $uri $uri/ /index.html; }
# }

# Admin panel (folder admin/) — akses via subdomain admin
server {
    listen 80;
    server_name admin.kubagus.com;
    root /var/www/kubagus.com/admin/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Catatan penting:**
- Tambahkan konfigurasi **HTTPS** (certbot/Let's Encrypt) untuk semua subdomain.
- Saat HTTPS aktif: atur `COOKIE_SECURE=true` di `.env` API agar cookie hanya dikirim via HTTPS.
- `CORS_ORIGIN` di produksi: isi daftar origin yang diizinkan, mis. `CORS_ORIGIN=https://admin.kubagus.com,https://kubagus.com` (jangan `true`).
- DNS: wildcard `*.kubagus.com` → IP server.

## Variabel Environment API

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port API |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | — | Koneksi MySQL (`kubagus_com`) |
| `JWT_SECRET` | dev | Wajib diganti di produksi |
| `JWT_EXPIRES_IN` | `7d` | Umur token |
| `COOKIE_NAME` | `kubagus_token` | Nama cookie JWT |
| `COOKIE_SECURE` | `false` | `true` jika HTTPS |
| `COOKIE_SAMESITE` | `lax` | `lax` (disarankan) / `strict` / `none` |
| `CORS_ORIGIN` | `true` | `true` (semua origin) atau daftar origin dipisah koma |
| `UPLOAD_DIR` | `uploads` | Folder file unggahan |

## Autentikasi Admin (HTTP-Only Cookie)

- Login → `Set-Cookie: kubagus_token=<JWT>; HttpOnly; SameSite=Lax; Secure=<env>`.
- Token **tidak pernah** disimpan di localStorage/JS; dikirim otomatis oleh browser (`credentials: "include"`).
- Logout → `POST /api/auth/logout` menghapus cookie.
- Proteksi CSRF: cookie `SameSite=Lax` + API hanya menerima `Content-Type: application/json` + header `X-Site-Key` (tidak bisa dikirim form lintas-situs tanpa izin CORS).
- Untuk pengujian manual (curl/Postman), fallback `Authorization: Bearer <token>` tetap didukung.
