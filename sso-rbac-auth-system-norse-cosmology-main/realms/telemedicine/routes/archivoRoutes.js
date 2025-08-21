import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from './createCrudRoutes.js';

const archivoCrud = crudController(db.Archivo);
const router = createCrudRoutes(archivoCrud);

export default router;