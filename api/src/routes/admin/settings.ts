import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { notFound } from '../../utils/httpError.js';

export const adminSettingsRouter = Router();

interface SettingRow extends mysql.RowDataPacket {
  id: number;
  skey: string;
  svalue: string;
}

const settingSchema = z.object({
  skey: z.string().min(1).max(100),
  svalue: z.unknown(),
});

adminSettingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<SettingRow>(
      'SELECT skey, svalue FROM settings WHERE site_id = ?',
      [req.siteId],
    );
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.skey] = JSON.parse(row.svalue);
      } catch {
        settings[row.skey] = row.svalue;
      }
    }
    res.json(settings);
  }),
);

adminSettingsRouter.put(
  '/:skey',
  asyncHandler(async (req, res) => {
    const body = settingSchema.parse({ skey: req.params.skey, svalue: req.body.svalue });
    const value = JSON.stringify(body.svalue ?? null);

    const existing = await query<SettingRow>(
      'SELECT id FROM settings WHERE site_id = ? AND skey = ?',
      [req.siteId, body.skey],
    );
    if (existing[0]) {
      await execute('UPDATE settings SET svalue = ? WHERE id = ?', [value, existing[0].id]);
    } else {
      await execute('INSERT INTO settings (site_id, skey, svalue) VALUES (?, ?, ?)', [
        req.siteId,
        body.skey,
        value,
      ]);
    }
    res.json({ success: true });
  }),
);

adminSettingsRouter.delete(
  '/:skey',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM settings WHERE site_id = ? AND skey = ?', [
      req.siteId,
      req.params.skey,
    ]);
    if (result.affectedRows === 0) throw notFound('Setting tidak ditemukan.');
    res.json({ success: true });
  }),
);
