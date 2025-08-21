import db from '../models/index.js'
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const estadisticasDiariasCrud = crudController(db.EstadisticasDiarias);
const router = createCrudRoutes(estadisticasDiariasCrud);

export default router;