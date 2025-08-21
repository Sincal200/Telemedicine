import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const especialidadesCrud = crudController(db.Especialidades);
const router = createCrudRoutes(especialidadesCrud);

export default router;