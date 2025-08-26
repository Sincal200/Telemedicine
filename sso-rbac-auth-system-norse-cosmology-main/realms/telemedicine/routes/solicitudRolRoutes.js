import express from 'express';
import solicitudRolController from '../controllers/solicitudRolController.js';
import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const router = express.Router();

// Rutas específicas para gestión de solicitudes
router.get('/estadisticas', solicitudRolController.obtenerEstadisticas);
router.get('/', solicitudRolController.obtenerSolicitudes);
router.get('/:id', solicitudRolController.obtenerSolicitud);
router.put('/:id/en-revision', solicitudRolController.marcarEnRevision);
router.put('/:id/aprobar', solicitudRolController.aprobarSolicitud);
router.put('/:id/rechazar', solicitudRolController.rechazarSolicitud);

// Rutas CRUD básicas para administración (create, update, delete)
const solicitudRolCrud = crudController(db.SolicitudRol);
const crudRoutes = createCrudRoutes(solicitudRolCrud);
router.use('/admin', crudRoutes);

export default router;