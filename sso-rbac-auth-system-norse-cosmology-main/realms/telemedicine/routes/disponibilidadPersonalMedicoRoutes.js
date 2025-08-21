import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from "./createCrudRoutes.js";

const disponibilidadPersonalMedicoCrud = crudController(db.DisponibilidadPersonalMedico);
const router = createCrudRoutes(disponibilidadPersonalMedicoCrud);

export default router;