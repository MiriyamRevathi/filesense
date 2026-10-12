import { Router } from 'express';
import { createFileRouter } from './fileRoutes';
import { createDuplicateRouter } from './duplicateRoutes';
import { createAnalyticsRouter } from './analyticsRoutes';
import { createAiRouter } from './aiRoutes';
import { createSystemRouter } from './systemRoutes';

export function createApiRouter(): Router {
  const router = Router();

  router.use('/files', createFileRouter());
  router.use('/duplicates', createDuplicateRouter());
  router.use('/analytics', createAnalyticsRouter());
  router.use('/ai', createAiRouter());
  router.use('/system', createSystemRouter());

  // Backward compatibility convenience health endpoint directly under /api
  const systemRouter = createSystemRouter();
  router.get('/health', (req, res, next) => systemRouter(req, res, next));

  return router;
}
