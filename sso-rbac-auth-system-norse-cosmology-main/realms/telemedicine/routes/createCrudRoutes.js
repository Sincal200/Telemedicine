import express from 'express';

export default function createCrudRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);
  return router;
}

