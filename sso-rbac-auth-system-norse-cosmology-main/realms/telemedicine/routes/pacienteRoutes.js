import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const pacienteCrud = crudController(db.Paciente);
const router = createCrudRoutes(pacienteCrud);

export default router;