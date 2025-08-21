import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const solicitudRolCrud = crudController(db.SolicitudRol);
const router = createCrudRoutes(solicitudRolCrud);

export default router;