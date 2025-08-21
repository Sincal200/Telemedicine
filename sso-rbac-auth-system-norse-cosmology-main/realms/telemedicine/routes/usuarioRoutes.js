import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const usuarioCrud = crudController(db.Usuario);
const router = createCrudRoutes(usuarioCrud);

export default router;