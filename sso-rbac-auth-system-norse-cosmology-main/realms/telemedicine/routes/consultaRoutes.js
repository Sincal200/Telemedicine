import express from 'express';
import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import consultaController from '../controllers/consultaController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const router = express.Router();

// Rutas específicas primero
router.get('/cita/:citaId', consultaController.obtenerConsultaPorCita);
router.get('/paciente/:pacienteId', consultaController.obtenerConsultasPaciente);
router.get('/paciente/:pacienteId/completas', consultaController.obtenerConsultasCompletasPaciente);

// Rutas CRUD genéricas
const consultaCrud = crudController(db.Consulta);
const crudRoutes = createCrudRoutes(consultaCrud);
router.use('/', crudRoutes);

export default router;