import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const tiposCitaCrud = crudController(db.TiposCita);
const router = createCrudRoutes(tiposCitaCrud);

export default router;