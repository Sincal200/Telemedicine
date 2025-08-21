import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const logSistemaCrud = crudController(db.LogSistema);
const router = createCrudRoutes(logSistemaCrud);

export default router;