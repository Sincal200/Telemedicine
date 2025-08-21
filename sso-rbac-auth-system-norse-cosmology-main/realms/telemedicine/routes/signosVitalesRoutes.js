import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const signosVitalesCrud = crudController(db.SignosVitales);
const router = createCrudRoutes(signosVitalesCrud);

export default router;