import { Router } from 'express';
import { closeSync, mkdirSync, openSync, readSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest } from '../../utils/httpError.js';

export const adminUploadRouter = Router();

// SVG tidak diizinkan: berpotensi menyimpan script (stored XSS) saat dibuka langsung.
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);

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

/** Magic bytes untuk verifikasi isi file, bukan sekadar ekstensi. */
function checkMagicBytes(filePath: string, ext: string): boolean {
  const buf = Buffer.alloc(12);
  let fd: number | null = null;
  try {
    fd = openSync(filePath, 'r');
    const bytesRead = readSync(fd, buf, 0, 12, 0);
    const b = buf.subarray(0, bytesRead);
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
      case '.png':
        return b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case '.gif':
        return b.length >= 4 && b.subarray(0, 4).toString('ascii') === 'GIF8';
      case '.webp':
        return (
          b.length >= 12 &&
          b.subarray(0, 4).toString('ascii') === 'RIFF' &&
          b.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      case '.pdf':
        return b.length >= 4 && b.subarray(0, 4).toString('ascii') === '%PDF';
      default:
        return false;
    }
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        /* abaikan */
      }
    }
  }
}

adminUploadRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('File tidak ditemukan di field "file".');

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!checkMagicBytes(req.file.path, ext)) {
      unlinkSync(req.file.path);
      throw badRequest('Isi file tidak sesuai dengan ekstensinya. File ditolak.');
    }

    res.status(201).json({
      url: `/${env.uploadDir}/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    });
  }),
);