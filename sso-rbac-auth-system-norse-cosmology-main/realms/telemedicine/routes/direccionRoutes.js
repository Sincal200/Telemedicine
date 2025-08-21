import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const direccionCrud = crudController(db.Direccion);
const router = createCrudRoutes(direccionCrud);

export default router;