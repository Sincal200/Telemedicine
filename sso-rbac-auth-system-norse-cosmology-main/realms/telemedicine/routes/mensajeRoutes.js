import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const mensajeCrud = crudController(db.Mensaje);
const router = createCrudRoutes(mensajeCrud);

export default router;