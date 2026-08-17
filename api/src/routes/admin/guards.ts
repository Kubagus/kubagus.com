import { NextFunction, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { forbidden } from '../../utils/httpError.js';

/** Memastikan admin yang login memiliki akses ke situs pada request ini. */
export function requireSiteMatch(req: Request, _res: Response, next: NextFunction) {
  if (req.admin && req.siteId && req.admin.siteId !== req.siteId) {
    return next(forbidden('Admin ini tidak memiliki akses ke situs tersebut.'));
  }
  next();
}

export { requireAuth };
