import db from '../models/index.js';
import crudController from '../controllers/crudController.js';
import createCrudRoutes from './createCrudRoutes.js';

const aldeaCrud = crudController(db.Aldea);
const router = createCrudRoutes(aldeaCrud);

// Ejemplo de ruta personalizada:
// import aldeaController from '../controllers/aldeaController.js';
// router.get('/buscar', aldeaController.buscarPorNombre);

export default router;