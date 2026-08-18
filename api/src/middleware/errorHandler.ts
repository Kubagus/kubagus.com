import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/httpError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validasi gagal',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Error dari multer (upload).
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'MulterError') {
    const code = (err as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File terlalu besar. Maksimal 5 MB.' });
    }
    return res.status(400).json({ error: 'Upload file gagal. Periksa kembali file Anda.' });
  }

  // Kesalahan tak terduga: log detail di server, jangan bocorkan ke klien.
  console.error('[ERROR]', err);
  return res.status(500).json({ error: 'Terjadi kesalahan internal.' });
}