import express from 'express';
import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import personalMedicoController from "../controllers/personalMedicoController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const router = express.Router();

// Rutas específicas primero
router.get('/buscar-por-email/:email', personalMedicoController.buscarPorEmail);

// Rutas CRUD genéricas
const personalMedicoCrud = crudController(db.PersonalMedico);
const crudRoutes = createCrudRoutes(personalMedicoCrud);
router.use('/', crudRoutes);

export default router;