import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from './createCrudRoutes.js';

const citaCrud = crudController(db.Cita);
const router = createCrudRoutes(citaCrud);

export default router;