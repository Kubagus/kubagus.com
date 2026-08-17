import { Router } from 'express';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { notFound } from '../../utils/httpError.js';

export const adminMessagesRouter = Router();

interface MessageRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: number;
  created_at: Date;
}

adminMessagesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === '1';
    const rows = await query<MessageRow>(
      `SELECT id, name, email, subject, message, is_read, created_at
       FROM contact_messages
       WHERE site_id = ? ${unreadOnly ? 'AND is_read = 0' : ''}
       ORDER BY created_at DESC`,
      [req.siteId],
    );
    res.json(rows);
  }),
);

adminMessagesRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const result = await execute(
      'UPDATE contact_messages SET is_read = 1 WHERE id = ? AND site_id = ?',
      [req.params.id, req.siteId],
    );
    if (result.affectedRows === 0) throw notFound('Pesan tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminMessagesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM contact_messages WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Pesan tidak ditemukan.');
    res.json({ success: true });
  }),
);
