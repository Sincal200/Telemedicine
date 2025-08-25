import express from 'express';
import { insertarDatosBasicos, insertarDatosEjemplo } from '../utils/datosIniciales.js';

const router = express.Router();

/**
 * Endpoint para configurar datos básicos del sistema
 * POST /api/setup/datos-basicos
 */
router.post('/datos-basicos', async (req, res, next) => {
  try {
    await insertarDatosBasicos();
    
    res.json({
      success: true,
      message: 'Datos básicos configurados exitosamente'
    });
  } catch (error) {
    console.error('Error configurando datos básicos:', error);
    next(error);
  }
});

/**
 * Endpoint para insertar datos de ejemplo
 * POST /api/setup/datos-ejemplo
 */
router.post('/datos-ejemplo', async (req, res, next) => {
  try {
    await insertarDatosEjemplo();
    
    res.json({
      success: true,
      message: 'Datos de ejemplo insertados exitosamente'
    });
  } catch (error) {
    console.error('Error insertando datos de ejemplo:', error);
    next(error);
  }
});

/**
 * Endpoint para configurar todo (datos básicos + ejemplos)
 * POST /api/setup/completo
 */
router.post('/completo', async (req, res, next) => {
  try {
    await insertarDatosBasicos();
    await insertarDatosEjemplo();
    
    res.json({
      success: true,
      message: 'Sistema configurado completamente con datos básicos y de ejemplo'
    });
  } catch (error) {
    console.error('Error en configuración completa:', error);
    next(error);
  }
});

export default router;
