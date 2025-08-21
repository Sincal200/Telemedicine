import express from 'express';
import sexoController from '../controllers/sexoController.js';
const router = express.Router();

router.get('/', sexoController.getAllSexos);
router.get('/:id', sexoController.getSexoById);
router.post('/', sexoController.createSexo);

export default router;