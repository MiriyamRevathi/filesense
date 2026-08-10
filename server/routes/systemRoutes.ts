import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';

export function createSystemRouter(controller: SystemController = new SystemController()): Router {
  const router = Router();

  router.get('/health', controller.getHealth);
  router.get('/info', controller.getInfo);

  return router;
}
