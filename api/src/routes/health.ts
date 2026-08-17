import { Router } from 'express';
import { query } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'db-error' });
  }
});
