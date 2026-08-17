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

  app.use(`/${env.uploadDir}`, express.static(path.resolve(env.uploadDir)));

  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  });

  app.use(errorHandler);

  return app;
}
