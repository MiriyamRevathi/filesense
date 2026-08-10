import { Router } from 'express';
import { DuplicateController } from '../controllers/DuplicateController';

export function createDuplicateRouter(controller: DuplicateController = new DuplicateController()): Router {
  const router = Router();

  router.get('/scan', controller.scan);
  router.get('/groups', controller.getGroups);
  router.post('/resolve', controller.resolve);
  router.delete('/groups/:groupId', controller.deleteInGroup);

  return router;
}
