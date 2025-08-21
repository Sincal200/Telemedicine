import db from '../models/index.js'
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const estadosCitaCrud = crudController(db.EstadosCita);
const router = createCrudRoutes(estadosCitaCrud);

export default router;