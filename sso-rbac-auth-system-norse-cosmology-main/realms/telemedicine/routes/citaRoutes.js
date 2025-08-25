import express from 'express';
import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import citaController from '../controllers/citaController.js';
import createCrudRoutes from './createCrudRoutes.js';

const router = express.Router();

// Rutas especializadas para citas (van primero para que no sean capturadas por CRUD)
router.get('/horarios-disponibles', citaController.buscarHorariosDisponibles);
router.post('/programar', citaController.programarCita);
router.get('/paciente/:pacienteId', citaController.obtenerCitasPaciente);
router.get('/medico/:medicoId', citaController.obtenerCitasMedico);
router.put('/:id/cancelar', citaController.cancelarCita);
router.get('/:id', citaController.obtenerCita);

// Rutas CRUD básicas (para administración)
const citaCrud = crudController(db.Cita);
const crudRoutes = createCrudRoutes(citaCrud);

// Montar las rutas CRUD bajo /admin para distinguirlas
router.use('/admin', crudRoutes);

export default router;