import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from './createCrudRoutes.js';

const configuracionCentroCrud = crudController(db.ConfiguracionCentro);
const router = createCrudRoutes(configuracionCentroCrud);

export default router;