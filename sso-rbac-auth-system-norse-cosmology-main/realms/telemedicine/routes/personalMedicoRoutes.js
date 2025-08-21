import db from '../models/index.js';
import crudController from "../controllers/crudController.js";
import createCrudRoutes from "./createCrudRoutes.js";

const personalMedicoCrud = crudController(db.PersonalMedico);
const router = createCrudRoutes(personalMedicoCrud);

export default router;