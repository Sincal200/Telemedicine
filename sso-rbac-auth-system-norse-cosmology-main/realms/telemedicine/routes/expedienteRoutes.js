import express from 'express';
import { getExpedienteCompleto } from '../controllers/expedienteController.js';

const router = express.Router();
// Endpoint: GET /pacientes/:id/expediente
router.get('/pacientes/:id/expediente', getExpedienteCompleto);

export default router;
