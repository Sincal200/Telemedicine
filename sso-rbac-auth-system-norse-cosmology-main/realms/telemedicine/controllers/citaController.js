import agendaService from '../services/agendaService.js';
import db from '../models/index.js';

const citaController = {
  /**
   * Buscar horarios disponibles
   * GET /api/citas/horarios-disponibles
   */
  async buscarHorariosDisponibles(req, res, next) {
    try {
      const { 
        especialidadId, 
        fechaInicio, 
        fechaFin, 
        tipoCitaId, 
        personalMedicoId 
      } = req.query;

      // Validaciones básicas
      if (!especialidadId || !fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Faltan parámetros requeridos: especialidadId, fechaInicio, fechaFin'
        });
      }

      // Validar que fechaInicio no sea anterior a hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaInicioDate = new Date(fechaInicio);
      
      if (fechaInicioDate < hoy) {
        return res.status(400).json({
          error: 'No se pueden buscar horarios en fechas pasadas'
        });
      }

      const filtros = {
        especialidadId: parseInt(especialidadId),
        fechaInicio,
        fechaFin,
        tipoCitaId: tipoCitaId ? parseInt(tipoCitaId) : undefined,
        personalMedicoId: personalMedicoId ? parseInt(personalMedicoId) : undefined
      };

      const horariosDisponibles = await agendaService.buscarHorariosDisponibles(filtros);

      res.json({
        success: true,
        data: horariosDisponibles,
        total: horariosDisponibles.length,
        filtros
      });

    } catch (error) {
      console.error('Error buscando horarios:', error);
      next(error);
    }
  },

  /**
   * Programar una nueva cita
   * POST /api/citas/programar
   */
  async programarCita(req, res, next) {
    try {
      const { 
        pacienteId, 
        personalMedicoId, 
        fecha,
        horaInicio,
        tipoCitaId, 
        motivoConsulta,
        prioridadId 
      } = req.body;

      // Validaciones
      if (!pacienteId || !personalMedicoId || !fecha || !horaInicio || !tipoCitaId) {
        return res.status(400).json({
          error: 'Faltan campos requeridos: pacienteId, personalMedicoId, fecha, horaInicio, tipoCitaId'
        });
      }

      // Validar que la fecha no sea en el pasado
      const fechaCita = new Date(`${fecha} ${horaInicio}`);
      const ahora = new Date();
      
      if (fechaCita <= ahora) {
        return res.status(400).json({
          error: 'No se puede programar una cita en el pasado'
        });
      }

      // Verificar que el paciente existe
      const paciente = await db.Paciente.findByPk(pacienteId);
      if (!paciente) {
        return res.status(404).json({
          error: 'Paciente no encontrado'
        });
      }

      // Verificar que el personal médico existe y está activo
      const personalMedico = await db.PersonalMedico.findByPk(personalMedicoId);
      if (!personalMedico || !personalMedico.activo) {
        return res.status(404).json({
          error: 'Personal médico no encontrado o inactivo'
        });
      }

      const datosCita = {
        pacienteId,
        personalMedicoId,
        fecha,
        horaInicio,
        tipoCitaId,
        motivoConsulta,
        prioridadId
      };

      const citaCreada = await agendaService.reservarHorario(datosCita);

      res.status(201).json({
        success: true,
        message: 'Cita programada exitosamente',
        data: citaCreada
      });

    } catch (error) {
      if (error.message === 'El horario ya no está disponible') {
        return res.status(409).json({
          error: error.message,
          code: 'HORARIO_NO_DISPONIBLE'
        });
      }
      
      console.error('Error programando cita:', error);
      next(error);
    }
  },

  /**
   * Obtener citas de un paciente
   * GET /api/citas/paciente/:pacienteId
   */
  async obtenerCitasPaciente(req, res, next) {
    try {
      const { pacienteId } = req.params;
      const { estado, desde, hasta } = req.query;

      const whereClause = {
        paciente_id: pacienteId
      };

      if (estado) {
        whereClause.estado_cita_id = estado;
      }

      if (desde && hasta) {
        whereClause.fecha = {
          [db.Sequelize.Op.between]: [desde, hasta]
        };
      }

      const citas = await db.Cita.findAll({
        where: whereClause,
        include: [
          {
            model: db.PersonalMedico,
            as: 'personal_medico',
            include: [
              {
                model: db.Persona,
                as: 'persona'
              },
              {
                model: db.Especialidades,
                as: 'especialidad'
              }
            ]
          },
          {
            model: db.TiposCita,
            as: 'tipo_citum'
          },
          {
            model: db.EstadosCita,
            as: 'estado_citum'
          }
        ],
        order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']]
      });

      res.json({
        success: true,
        data: citas,
        total: citas.length
      });

    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      next(error);
    }
  },

  /**
   * Obtener citas de un médico
   * GET /api/citas/medico/:medicoId
   */
  async obtenerCitasMedico(req, res, next) {
    try {
      const { medicoId } = req.params;
      const { fecha, estado } = req.query;

      const whereClause = {
        personal_medico_id: medicoId
      };

      if (estado) {
        whereClause.estado_cita_id = estado;
      }

      if (fecha) {
        whereClause.fecha = fecha;
      }

      const citas = await db.Cita.findAll({
        where: whereClause,
        include: [
          {
            model: db.Paciente,
            as: 'paciente',
            include: [{
              model: db.Persona,
              as: 'persona'
            }]
          },
          {
            model: db.TiposCita,
            as: 'tipo_citum'
          },
          {
            model: db.EstadosCita,
            as: 'estado_citum'
          }
        ],
        order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
      });

      res.json({
        success: true,
        data: citas,
        total: citas.length
      });

    } catch (error) {
      console.error('Error obteniendo citas del médico:', error);
      next(error);
    }
  },

  /**
   * Cancelar una cita
   * PUT /api/citas/:id/cancelar
   */
  async cancelarCita(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo_cancelacion } = req.body;

      const cita = await db.Cita.findByPk(id);
      
      if (!cita) {
        return res.status(404).json({
          error: 'Cita no encontrada'
        });
      }

      // Verificar que la cita no esté ya cancelada
      if (cita.estado_cita_id === 4) { // Asumiendo 4 = cancelada
        return res.status(400).json({
          error: 'La cita ya está cancelada'
        });
      }

      // Verificar que la cita no haya pasado
      const fechaCita = new Date(`${cita.fecha} ${cita.hora_inicio}`);
      const ahora = new Date();
      
      if (fechaCita <= ahora) {
        return res.status(400).json({
          error: 'No se puede cancelar una cita que ya ha pasado'
        });
      }

      await cita.update({
        estado_cita_id: 4, // Cancelada
        motivo_cancelacion: motivo_cancelacion || cita.motivo_cancelacion
      });

      const citaActualizada = await agendaService.obtenerCitaCompleta(id);

      res.json({
        success: true,
        message: 'Cita cancelada exitosamente',
        data: citaActualizada
      });

    } catch (error) {
      console.error('Error cancelando cita:', error);
      next(error);
    }
  },

  /**
   * Obtener detalles de una cita específica
   * GET /api/citas/:id
   */
  async obtenerCita(req, res, next) {
    try {
      const { id } = req.params;

      const cita = await agendaService.obtenerCitaCompleta(id);

      if (!cita) {
        return res.status(404).json({
          error: 'Cita no encontrada'
        });
      }

      res.json({
        success: true,
        data: cita
      });

    } catch (error) {
      console.error('Error obteniendo cita:', error);
      next(error);
    }
  }
};

export default citaController;
