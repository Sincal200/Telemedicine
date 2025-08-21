import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const recordatorioCrud = crudController(db.Recordatorio);
const router = createCrudRoutes(recordatorioCrud);

export default router;