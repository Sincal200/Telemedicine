import db from '../models/index.js';
import { Op } from 'sequelize';

// Funciones auxiliares para crear roles
async function crearPersonalMedico(solicitud, transaction) {
  const usuario = await db.Usuario.findByPk(solicitud.usuario_id, {
    include: [{
      model: db.Persona,
      as: 'persona'
    }],
    transaction
  });
  
  const datosAdicionales = solicitud.datos_adicionales || {};
  
  // Generar el siguiente ID para PersonalMedico (ya que no es auto-increment)
  const ultimoPersonalMedico = await db.PersonalMedico.findOne({
    order: [['idPersonalMedico', 'DESC']],
    transaction
  });
  const nuevoId = ultimoPersonalMedico ? ultimoPersonalMedico.idPersonalMedico + 1 : 1;
  
  // Si no se proporciona especialidad_id, usar Medicina General como default
  let especialidad_id = datosAdicionales.especialidad_id;
  if (!especialidad_id) {
    const especialidadGeneral = await db.Especialidades.findOne({
      where: { codigo: 'MED_GEN' },
      transaction
    });
    especialidad_id = especialidadGeneral ? especialidadGeneral.idEspecialidad : 1;
  }
  
  await db.PersonalMedico.create({
    idPersonalMedico: nuevoId,
    persona_id: usuario.persona_id,
    centro_id: datosAdicionales.centro_id || 1,
    numero_licencia: datosAdicionales.numero_licencia,
    numero_colegiado: datosAdicionales.numero_colegiado,
    especialidad_id: especialidad_id,
    cargo: datosAdicionales.cargo || 'Médico',
    universidad: datosAdicionales.universidad,
    anos_experiencia: datosAdicionales.anos_experiencia || 0,
    biografia: datosAdicionales.biografia,
    activo: true,
    verificado: true
  }, { transaction });
}

async function crearPaciente(solicitud, transaction) {
  const usuario = await db.Usuario.findByPk(solicitud.usuario_id, {
    include: [{
      model: db.Persona,
      as: 'persona'
    }],
    transaction
  });
  
  const datosAdicionales = solicitud.datos_adicionales || {};
  
  // Generar número de expediente si no existe
  let numeroExpediente = datosAdicionales.numero_expediente;
  if (!numeroExpediente) {
    const año = new Date().getFullYear();
    const ultimoPaciente = await db.Paciente.findOne({
      where: {
        numero_expediente: {
          [Op.like]: `${año}%`
        }
      },
      order: [['numero_expediente', 'DESC']],
      transaction
    });
    
    let siguienteNumero = 1;
    if (ultimoPaciente && ultimoPaciente.numero_expediente) {
      const ultimoNumero = parseInt(ultimoPaciente.numero_expediente.substring(4));
      siguienteNumero = ultimoNumero + 1;
    }
    
    numeroExpediente = `${año}${siguienteNumero.toString().padStart(6, '0')}`;
  }
  
  // Verificar si el modelo Paciente tiene auto-increment, si no, generar ID manualmente
  const createData = {
    persona_id: usuario.persona_id,
    numero_expediente: numeroExpediente,
    tipo_sangre: datosAdicionales.tipo_sangre,
    alergias: datosAdicionales.alergias,
    enfermedades_cronicas: datosAdicionales.enfermedades_cronicas,
    contacto_emergencia_nombre: datosAdicionales.contacto_emergencia_nombre,
    contacto_emergencia_telefono: datosAdicionales.contacto_emergencia_telefono,
    contacto_emergencia_parentesco: datosAdicionales.contacto_emergencia_parentesco,
    activo: true
  };
  
  // Intentar crear sin ID primero (para auto-increment)
  try {
    await db.Paciente.create(createData, { transaction });
  } catch (error) {
    // Si falla, intentar con ID manual
    if (error.name === 'SequelizeValidationError' || error.message.includes('cannot be null')) {
      const ultimoPaciente = await db.Paciente.findOne({
        order: [['idPaciente', 'DESC']],
        transaction
      });
      const nuevoId = ultimoPaciente ? ultimoPaciente.idPaciente + 1 : 1;
      
      createData.idPaciente = nuevoId;
      await db.Paciente.create(createData, { transaction });
    } else {
      throw error;
    }
  }
}

const solicitudRolController = {
  /**
   * Obtener todas las solicitudes de rol
   * GET /api/solicitudes-rol
   */
  async obtenerSolicitudes(req, res, next) {
    try {
      const { estado, tipo_rol, page = 1, limit = 10 } = req.query;
      
      const whereClause = {};
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (tipo_rol) {
        whereClause.tipo_rol_solicitado = tipo_rol;
      }
      
      const offset = (page - 1) * limit;
      
      const solicitudes = await db.SolicitudRol.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.Usuario,
            as: 'usuario',
            include: [{
              model: db.Persona,
              as: 'persona'
            }]
          },
          {
            model: db.Usuario,
            as: 'revisado_por_Usuario',
            include: [{
              model: db.Persona,
              as: 'persona'
            }],
            required: false
          }
        ],
        order: [
          ['estado', 'ASC'], // Pendientes primero
          ['creado', 'DESC']  // Más recientes primero
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: solicitudes.rows,
        pagination: {
          total: solicitudes.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(solicitudes.count / limit)
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      next(error);
    }
  },

  /**
   * Obtener solicitud específica
   * GET /api/solicitudes-rol/:id
   */
  async obtenerSolicitud(req, res, next) {
    try {
      const { id } = req.params;
      
      const solicitud = await db.SolicitudRol.findByPk(id, {
        include: [
          {
            model: db.Usuario,
            as: 'usuario',
            include: [{
              model: db.Persona,
              as: 'persona'
            }]
          },
          {
            model: db.Usuario,
            as: 'revisado_por_Usuario',
            include: [{
              model: db.Persona,
              as: 'persona'
            }],
            required: false
          }
        ]
      });
      
      if (!solicitud) {
        return res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: solicitud
      });
      
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      next(error);
    }
  },

  /**
   * Aprobar solicitud de rol
   * PUT /api/solicitudes-rol/:id/aprobar
   */
  async aprobarSolicitud(req, res, next) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { comentarios_revision } = req.body;
      
      // Obtener el ID del usuario autenticado
      const adminId = req.user?.id || req.user?.idUsuario;
      
      // Obtener la solicitud
      const solicitud = await db.SolicitudRol.findByPk(id, { transaction });
      
      if (!solicitud) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
      }
      
      if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'en_revision') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'La solicitud ya ha sido procesada'
        });
      }
      
      // Actualizar la solicitud
      await solicitud.update({
        estado: 'aprobado',
        revisado_por: adminId,
        comentarios_revision,
        fecha_revision: new Date()
      }, { transaction });
      
      // Crear el registro correspondiente según el tipo de rol
      if (solicitud.tipo_rol_solicitado === 'personal_medico') {
        await crearPersonalMedico(solicitud, transaction);
      } else if (solicitud.tipo_rol_solicitado === 'paciente') {
        await crearPaciente(solicitud, transaction);
      }
      
      // IMPORTANTE: Actualizar el estado de aprobación del usuario
      await db.Usuario.update({
        estado_aprobacion: 'aprobado'
      }, {
        where: { idUsuario: solicitud.usuario_id },
        transaction
      });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Solicitud aprobada exitosamente',
        data: solicitud
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error aprobando solicitud:', error);
      next(error);
    }
  },

  /**
   * Rechazar solicitud de rol
   * PUT /api/solicitudes-rol/:id/rechazar
   */
  async rechazarSolicitud(req, res, next) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { comentarios_revision } = req.body;
      
      // Obtener el ID del usuario autenticado
      const adminId = req.user?.id || req.user?.idUsuario;
      
      const solicitud = await db.SolicitudRol.findByPk(id, { transaction });
      
      if (!solicitud) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
      }
      
      if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'en_revision') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'La solicitud ya ha sido procesada'
        });
      }
      
      // Actualizar la solicitud
      await solicitud.update({
        estado: 'rechazado',
        revisado_por: adminId,
        comentarios_revision,
        fecha_revision: new Date()
      }, { transaction });
      
      // Actualizar el estado de aprobación del usuario
      await db.Usuario.update({
        estado_aprobacion: 'rechazado'
      }, {
        where: { idUsuario: solicitud.usuario_id },
        transaction
      });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Solicitud rechazada',
        data: solicitud
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error rechazando solicitud:', error);
      next(error);
    }
  },

  /**
   * Marcar solicitud como en revisión
   * PUT /api/solicitudes-rol/:id/en-revision
   */
  async marcarEnRevision(req, res, next) {
    try {
      const { id } = req.params;
      
      // Obtener el ID del usuario autenticado
      const adminId = req.user?.id || req.user?.idUsuario;
      
      const solicitud = await db.SolicitudRol.findByPk(id);
      
      if (!solicitud) {
        return res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
      }
      
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden marcar como en revisión las solicitudes pendientes'
        });
      }
      
      await solicitud.update({
        estado: 'en_revision',
        revisado_por: adminId
      });
      
      res.json({
        success: true,
        message: 'Solicitud marcada como en revisión',
        data: solicitud
      });
      
    } catch (error) {
      console.error('Error marcando solicitud en revisión:', error);
      next(error);
    }
  },

  /**
   * Obtener estadísticas de solicitudes
   * GET /api/solicitudes-rol/estadisticas
   */
  async obtenerEstadisticas(req, res, next) {
    try {
      const estadisticas = await db.SolicitudRol.findAll({
        attributes: [
          'estado',
          'tipo_rol_solicitado',
          [db.sequelize.fn('COUNT', db.sequelize.col('idSolicitud')), 'total']
        ],
        group: ['estado', 'tipo_rol_solicitado'],
        raw: true
      });
      
      res.json({
        success: true,
        data: estadisticas
      });
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }
};

export default solicitudRolController;
