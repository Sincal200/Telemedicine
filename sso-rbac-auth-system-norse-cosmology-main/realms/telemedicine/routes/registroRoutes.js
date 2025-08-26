import express from 'express';
import registroController from '../controllers/registroController.js';

const router = express.Router();

/**
 * Rutas para el proceso de registro completo
 */

// POST /api/registro/completar - Completa el registro después de crear en Keycloak
router.post('/completar', registroController.completarRegistro);

// GET /api/registro/estado/:keycloak_user_id - Obtiene el estado del registro
router.get('/estado/:keycloak_user_id', registroController.obtenerEstadoRegistro);

// GET /api/registro/perfil/:keycloak_user_id - Obtiene información completa del usuario
router.get('/perfil/:keycloak_user_id', registroController.obtenerPerfilUsuario);

export default router;
