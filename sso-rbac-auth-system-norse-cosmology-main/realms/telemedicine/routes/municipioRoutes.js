import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const municipioCrud = crudController(db.Municipio);
const router = createCrudRoutes(municipioCrud);

export default router;