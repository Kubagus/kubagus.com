import { Router } from 'express';
import { healthRouter } from './health.js';
import { tenantMiddleware } from '../middleware/tenant.js';
import { authRouter } from './auth.js';
import { publicRouter } from './public.js';
import { adminRouter } from './admin/index.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(tenantMiddleware);

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', publicRouter);