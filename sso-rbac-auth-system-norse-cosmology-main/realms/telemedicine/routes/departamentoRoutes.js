import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const departamentoCrud = crudController(db.Departamento);
const router = createCrudRoutes(departamentoCrud);

export default router;