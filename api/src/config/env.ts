export const env = {
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
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  cookie: {
    name: process.env.COOKIE_NAME ?? 'kubagus_token',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'true',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};
