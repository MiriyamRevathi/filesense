import { Router } from 'express';
import { FileController } from '../controllers/FileController';

export function createFileRouter(controller: FileController = new FileController()): Router {
  const router = Router();

  router.get('/', controller.getAllFiles);
  router.post('/', controller.createFileRecord);
  router.post('/seed', controller.seedDemo);
  router.delete('/batch', controller.deleteBatch);
  router.delete('/clear', controller.clearAll);

  router.get('/:id', controller.getFileById);
  router.patch('/:id/category', controller.updateCategory);
  router.patch('/:id/tags', controller.updateTags);
  router.delete('/:id', controller.deleteFile);

  return router;
}
