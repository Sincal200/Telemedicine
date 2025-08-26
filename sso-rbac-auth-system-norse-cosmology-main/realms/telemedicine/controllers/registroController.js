import db from '../models/index.js';

/**
 * Controlador para el registro completo de usuarios
 * Maneja la creación de Usuario → Persona → SolicitudRol
 */
class RegistroController {

  /**
   * Completa el registro después de crear el usuario en Keycloak
   * POST /api/registro/completar
   */
  async completarRegistro(req, res) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { 
        keycloak_user_id, 
        firstName, 
        lastName, 
        email, 
        userType,
        // Datos adicionales para doctores
        numero_documento,
        tipo_documento_id = 1, // DPI por defecto
        fecha_nacimiento,
        telefono,
        sexo_id = 1, // Masculino por defecto
        // Datos específicos para médicos
        numero_licencia,
        numero_colegiado,
        especialidad_id,
        universidad,
        anos_experiencia,
        justificacion
      } = req.body;

      // Validar datos requeridos
      if (!keycloak_user_id || !firstName || !lastName || !email || !userType) {
        return res.status(400).json({
          error: 'Faltan campos requeridos: keycloak_user_id, firstName, lastName, email, userType'
        });
      }

      // 1. Verificar que no exista ya un usuario con este keycloak_user_id
      const usuarioExistente = await db.Usuario.findOne({
        where: { keycloak_user_id }
      });

      if (usuarioExistente) {
        return res.status(409).json({
          error: 'Ya existe un usuario registrado con este ID de Keycloak'
        });
      }

      // 2. Crear dirección por defecto (se puede mejorar después)
      const direccionDefault = await db.Direccion.findOne({
        where: { activo: true }
      });

      if (!direccionDefault) {
        throw new Error('No hay direcciones disponibles en el sistema');
      }

      // 3. Obtener siguiente ID para Persona
      const ultimaPersona = await db.Persona.findOne({
        order: [['idPersona', 'DESC']]
      });
      const nuevoIdPersona = (ultimaPersona?.idPersona || 0) + 1;

      // 4. Crear registro en tabla Persona
      const persona = await db.Persona.create({
        idPersona: nuevoIdPersona,
        tipo_documento_id: tipo_documento_id,
        numero_documento: numero_documento || `TEMP-${Date.now()}`, // Temporal si no se proporciona
        nombres: firstName,
        apellidos: lastName,
        email: email,
        telefono: telefono || null,
        fecha_nacimiento: fecha_nacimiento || '1990-01-01', // Temporal si no se proporciona
        sexo_id: sexo_id,
        direccion_id: direccionDefault.idDireccion,
        activo: true
      }, { transaction });

      // 5. Obtener siguiente ID para Usuario
      const ultimoUsuario = await db.Usuario.findOne({
        order: [['idUsuario', 'DESC']]
      });
      const nuevoIdUsuario = (ultimoUsuario?.idUsuario || 0) + 1;

      // 6. Crear registro en tabla Usuario
      const usuario = await db.Usuario.create({
        idUsuario: nuevoIdUsuario,
        keycloak_user_id: keycloak_user_id,
        persona_id: persona.idPersona,
        roles_asignados: JSON.stringify([userType]),
        estado_aprobacion: 'pendiente',
        activo: true
      }, { transaction });

      // 7. Obtener siguiente ID para SolicitudRol
      const ultimaSolicitud = await db.SolicitudRol.findOne({
        order: [['idSolicitud', 'DESC']]
      });
      const nuevoIdSolicitud = (ultimaSolicitud?.idSolicitud || 0) + 1;

      // 8. Crear SolicitudRol automática
      const tipoRolSolicitado = userType === 'doctor' ? 'personal_medico' : 'paciente';
      
      let datosAdicionales = {};
      if (userType === 'doctor') {
        datosAdicionales = {
          numero_licencia,
          numero_colegiado,
          especialidad_id,
          universidad,
          anos_experiencia
        };
      }

      const solicitudRol = await db.SolicitudRol.create({
        idSolicitud: nuevoIdSolicitud,
        usuario_id: usuario.idUsuario,
        tipo_rol_solicitado: tipoRolSolicitado,
        datos_adicionales: datosAdicionales,
        justificacion: justificacion || `Solicitud automática de registro como ${userType}`,
        estado: 'pendiente'
      }, { transaction });

      // 9. Si es paciente, crear registro directamente (auto-aprobado)
      if (userType === 'patient') {
        const ultimoPaciente = await db.Paciente.findOne({
          order: [['idPaciente', 'DESC']]
        });
        const nuevoIdPaciente = (ultimoPaciente?.idPaciente || 0) + 1;

        await db.Paciente.create({
          idPaciente: nuevoIdPaciente,
          persona_id: persona.idPersona,
          activo: true
        }, { transaction });

        // Auto-aprobar para pacientes
        await db.Usuario.update(
          { estado_aprobacion: 'aprobado' },
          { where: { idUsuario: usuario.idUsuario }, transaction }
        );

        await db.SolicitudRol.update(
          { estado: 'aprobado' },
          { where: { idSolicitud: solicitudRol.idSolicitud }, transaction }
        );
      }

      await transaction.commit();

      // 10. Respuesta exitosa
      res.status(201).json({
        success: true,
        message: userType === 'patient' ? 
          'Registro completado exitosamente. Ya puedes usar el sistema.' :
          'Registro completado. Tu solicitud está pendiente de aprobación por un administrador.',
        data: {
          usuario: {
            idUsuario: usuario.idUsuario,
            keycloak_user_id: usuario.keycloak_user_id,
            estado_aprobacion: usuario.estado_aprobacion
          },
          persona: {
            idPersona: persona.idPersona,
            nombres: persona.nombres,
            apellidos: persona.apellidos,
            email: persona.email
          },
          solicitud: {
            idSolicitud: solicitudRol.idSolicitud,
            tipo_rol_solicitado: solicitudRol.tipo_rol_solicitado,
            estado: solicitudRol.estado
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error en completarRegistro:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Obtiene el estado del registro de un usuario
   * GET /api/registro/estado/:keycloak_user_id
   */
  async obtenerEstadoRegistro(req, res) {
    try {
      const { keycloak_user_id } = req.params;

      const usuario = await db.Usuario.findOne({
        where: { keycloak_user_id },
        include: [
          {
            model: db.Persona,
            as: 'persona'
          }
        ]
      });

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      // Buscar solicitudes de rol
      const solicitudes = await db.SolicitudRol.findAll({
        where: { usuario_id: usuario.idUsuario },
        order: [['creado', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          usuario: {
            idUsuario: usuario.idUsuario,
            estado_aprobacion: usuario.estado_aprobacion,
            activo: usuario.activo
          },
          persona: usuario.persona,
          solicitudes: solicitudes
        }
      });

    } catch (error) {
      console.error('Error en obtenerEstadoRegistro:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtiene información del usuario para el frontend
   * GET /api/registro/perfil/:keycloak_user_id
   */
  async obtenerPerfilUsuario(req, res) {
    try {
      const { keycloak_user_id } = req.params;

      const usuario = await db.Usuario.findOne({
        where: { keycloak_user_id },
        include: [
          {
            model: db.Persona,
            as: 'persona',
            include: [
              {
                model: db.Paciente,
                as: 'Paciente',
                required: false
              },
              {
                model: db.PersonalMedico,
                as: 'PersonalMedico',
                required: false,
                include: [
                  {
                    model: db.Especialidades,
                    as: 'especialidad',
                    required: false
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      console.log('Usuario encontrado:', {
        id: usuario.idUsuario,
        estado: usuario.estado_aprobacion,
        persona: usuario.persona?.nombres,
        paciente: usuario.persona?.Paciente?.idPaciente,
        medico: usuario.persona?.PersonalMedico?.idPersonalMedico
      });

      res.json({
        success: true,
        data: {
          idUsuario: usuario.idUsuario,
          keycloak_user_id: usuario.keycloak_user_id,
          estado_aprobacion: usuario.estado_aprobacion,
          persona: usuario.persona,
          esPaciente: !!usuario.persona?.Paciente,
          esMedico: !!usuario.persona?.PersonalMedico,
          idPaciente: usuario.persona?.Paciente?.idPaciente,
          idPersonalMedico: usuario.persona?.PersonalMedico?.idPersonalMedico
        }
      });

    } catch (error) {
      console.error('Error en obtenerPerfilUsuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
}

export default new RegistroController();
