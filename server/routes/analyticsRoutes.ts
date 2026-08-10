import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

export function createAnalyticsRouter(controller: AnalyticsController = new AnalyticsController()): Router {
  const router = Router();

  router.get('/stats', controller.getStats);
  router.get('/categories', controller.getCategoryBreakdown);
  router.get('/sizes', controller.getSizeDistribution);

  return router;
}
