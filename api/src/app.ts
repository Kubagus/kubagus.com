import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

function resolveCorsOrigin(): cors.CorsOptions['origin'] {
  const raw = env.corsOrigin;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  // Percaya X-Forwarded-For hanya dari proxy loopback (nginx di host yang sama).
  app.set('trust proxy', 'loopback');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  app.use(
    `/${env.uploadDir}`,
    express.static(path.resolve(env.uploadDir), {
      index: false,
      dotfiles: 'deny',
      maxAge: '30d',
      immutable: true,
    }),
  );

  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  });

  app.use(errorHandler);

  return app;
}
