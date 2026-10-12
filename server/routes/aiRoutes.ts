import { Router } from 'express';
import { AiController } from '../controllers/AiController';

export function createAiRouter(controller: AiController = new AiController()): Router {
  const router = Router();

  router.post('/analyze/:id', controller.analyzeFile);
  router.get('/audit', controller.getCatalogAudit);
  router.post('/batch-tag', controller.batchAutoTag);

  return router;
}
