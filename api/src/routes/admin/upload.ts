import { Router } from 'express';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest } from '../../utils/httpError.js';

export const adminUploadRouter = Router();

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    mkdirSync(env.uploadDir, { recursive: true });
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(badRequest('Tipe file tidak diizinkan.'));
    }
    cb(null, true);
  },
});

adminUploadRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('File tidak ditemukan di field "file".');
    res.status(201).json({
      url: `/${env.uploadDir}/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    });
  }),
);