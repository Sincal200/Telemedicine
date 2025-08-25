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
 * Endpoint para diagnosticar el estado de la base de datos
 * GET /api/setup/diagnostico
 */
router.get('/diagnostico', async (req, res, next) => {
  try {
    const { default: db } = await import('../models/index.js');
    
    const diagnostico = {
      departamentos: await db.Departamento.count(),
      municipios: await db.Municipio.count(),
      aldeas: await db.Aldea.count(),
      direcciones: await db.Direccion.count(),
      personas: await db.Persona.count(),
      personalMedico: await db.PersonalMedico.count(),
      especialidades: await db.Especialidades.count(),
      tiposCita: await db.TiposCita.count(),
      estadosCita: await db.EstadosCita.count(),
      disponibilidades: await db.DisponibilidadPersonalMedico.count(),
      centros: await db.ConfiguracionCentro.count(),
      diasSemana: await db.DiasSemana.count()
    };

    // Verificar datos específicos
    const personasDetalle = await db.Persona.findAll({
      attributes: ['idPersona', 'nombres', 'apellidos', 'direccion_id'],
      limit: 5
    });

    const personalMedicoDetalle = await db.PersonalMedico.findAll({
      attributes: ['idPersonalMedico', 'persona_id', 'numero_licencia'],
      limit: 5
    });

    const direccionesDetalle = await db.Direccion.findAll({
      attributes: ['idDireccion', 'direccion_completa'],
      limit: 5
    });

    res.json({
      success: true,
      diagnostico,
      detalles: {
        personas: personasDetalle,
        personalMedico: personalMedicoDetalle,
        direcciones: direccionesDetalle
      }
    });
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    next(error);
  }
});

/**
 * Endpoint para limpiar datos de ejemplo (CUIDADO: elimina datos)
 * DELETE /api/setup/limpiar
 */
router.delete('/limpiar', async (req, res, next) => {
  try {
    const { default: db } = await import('../models/index.js');
    
    console.log('🧹 Iniciando limpieza de datos de ejemplo...');
    
    // Limpiar en orden inverso para evitar errores de foreign key
    await db.DisponibilidadPersonalMedico.destroy({ where: {} });
    console.log('✓ Disponibilidades eliminadas');
    
    await db.PersonalMedico.destroy({ where: {} });
    console.log('✓ Personal médico eliminado');
    
    await db.Paciente.destroy({ where: {} });
    console.log('✓ Pacientes eliminados');
    
    await db.Persona.destroy({ where: {} });
    console.log('✓ Personas eliminadas');
    
    await db.Direccion.destroy({ where: {} });
    console.log('✓ Direcciones eliminadas');
    
    await db.Aldea.destroy({ where: {} });
    console.log('✓ Aldeas eliminadas');
    
    await db.Municipio.destroy({ where: {} });
    console.log('✓ Municipios eliminados');
    
    await db.Departamento.destroy({ where: {} });
    console.log('✓ Departamentos eliminados');

    res.json({
      success: true,
      message: 'Datos de ejemplo limpiados exitosamente'
    });
  } catch (error) {
    console.error('Error limpiando datos:', error);
    next(error);
  }
});

/**
 * Endpoint para probar creación de una persona
 * POST /api/setup/test-persona
 */
router.post('/test-persona', async (req, res, next) => {
  try {
    const { default: db } = await import('../models/index.js');
    
    console.log('🧪 Probando creación de persona...');
    
    // Verificar dependencias primero
    const tipoDoc = await db.TiposDocumentoIdentidad.findByPk(1);
    const sexo = await db.Sexo.findByPk(1);
    const direccion = await db.Direccion.findByPk(1);
    
    console.log('Dependencias:', {
      tipoDocumento: tipoDoc ? 'EXISTS' : 'NOT FOUND',
      sexo: sexo ? 'EXISTS' : 'NOT FOUND', 
      direccion: direccion ? 'EXISTS' : 'NOT FOUND'
    });
    
    if (!tipoDoc || !sexo || !direccion) {
      return res.status(400).json({
        error: 'Faltan dependencias requeridas',
        dependencias: {
          tipoDocumento: !!tipoDoc,
          sexo: !!sexo,
          direccion: !!direccion
        }
      });
    }
    
    // Intentar crear persona de prueba
    const personaPrueba = {
      idPersona: 999,
      tipo_documento_id: 1,
      numero_documento: 'TEST123',
      nombres: 'Test',
      apellidos: 'Usuario',
      fecha_nacimiento: '1990-01-01',
      sexo_id: 1,
      direccion_id: 1,
      telefono: '12345678',
      email: 'test@test.com',
      activo: true
    };
    
    console.log('Intentando crear persona:', personaPrueba);
    
    const [persona, created] = await db.Persona.findOrCreate({
      where: { idPersona: 999 },
      defaults: personaPrueba
    });
    
    res.json({
      success: true,
      created,
      persona,
      message: created ? 'Persona creada exitosamente' : 'Persona ya existía'
    });
    
  } catch (error) {
    console.error('Error en test-persona:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
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
