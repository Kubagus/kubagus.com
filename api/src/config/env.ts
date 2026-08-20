const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'dev-secret-change-me' || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET wajib diisi dengan nilai acak minimal 32 karakter saat NODE_ENV=production.',
    );
  }
  const corsOrigin = process.env.CORS_ORIGIN ?? 'true';
  if (corsOrigin === 'true' || corsOrigin === 'false') {
    throw new Error(
      'CORS_ORIGIN wajib berupa daftar origin eksplisit (dipisah koma) saat NODE_ENV=production.',
    );
  }
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 3001),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'kubagus_com',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    issuer: process.env.JWT_ISSUER ?? 'kubagus-api',
    audience: process.env.JWT_AUDIENCE ?? 'kubagus-admin',
  },
  cookie: {
    name: process.env.COOKIE_NAME ?? 'kubagus_token',
    refreshName: process.env.COOKIE_REFRESH_NAME ?? 'kubagus_refresh',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'true',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};