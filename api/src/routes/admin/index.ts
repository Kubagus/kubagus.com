import { Router } from 'express';
import type mysql from 'mysql2';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, requireSiteMatch } from './guards.js';
import { adminProfileRouter } from './profile.js';
import { adminExperiencesRouter, adminEducationsRouter } from './timeline.js';
import { adminSkillsRouter } from './skills.js';
import { adminProjectsRouter } from './projects.js';
import { adminBlogsRouter } from './blogs.js';
import { adminMessagesRouter } from './messages.js';
import { adminSettingsRouter } from './settings.js';
import { adminUploadRouter } from './upload.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireSiteMatch);

interface StatsRow extends mysql.RowDataPacket {
  projects: number;
  projects_published: number;
  blogs: number;
  blogs_published: number;
  skills: number;
  experiences: number;
  educations: number;
  messages: number;
  messages_unread: number;
}

adminRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const rows = await query<StatsRow>(
      `SELECT
        (SELECT COUNT(*) FROM projects WHERE site_id = ?) AS projects,
        (SELECT COUNT(*) FROM projects WHERE site_id = ? AND is_published = 1) AS projects_published,
        (SELECT COUNT(*) FROM blogs WHERE site_id = ?) AS blogs,
        (SELECT COUNT(*) FROM blogs WHERE site_id = ? AND is_published = 1) AS blogs_published,
        (SELECT COUNT(*) FROM skills WHERE site_id = ? AND is_active = 1) AS skills,
        (SELECT COUNT(*) FROM experiences WHERE site_id = ?) AS experiences,
        (SELECT COUNT(*) FROM educations WHERE site_id = ?) AS educations,
        (SELECT COUNT(*) FROM contact_messages WHERE site_id = ?) AS messages,
        (SELECT COUNT(*) FROM contact_messages WHERE site_id = ? AND is_read = 0) AS messages_unread`,
      Array(9).fill(req.siteId),
    );
    res.json(rows[0] ?? {});
  }),
);

adminRouter.use('/profile', adminProfileRouter);
adminRouter.use('/experiences', adminExperiencesRouter);
adminRouter.use('/educations', adminEducationsRouter);
adminRouter.use('/skills', adminSkillsRouter);
adminRouter.use('/projects', adminProjectsRouter);
adminRouter.use('/blogs', adminBlogsRouter);
adminRouter.use('/messages', adminMessagesRouter);
adminRouter.use('/settings', adminSettingsRouter);
adminRouter.use('/upload', adminUploadRouter);
