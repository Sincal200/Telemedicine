import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const diasSemanaCrud = crudController(db.DiasSemana);
const router = createCrudRoutes(diasSemanaCrud);

export default router;