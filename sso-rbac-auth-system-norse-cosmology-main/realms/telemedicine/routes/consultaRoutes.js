import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const consultaCrud = crudController(db.Consulta);
const router = createCrudRoutes(consultaCrud);

export default router;