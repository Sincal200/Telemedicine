import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const personaCrud = crudController(db.Persona);
const router = createCrudRoutes(personaCrud);

export default router;