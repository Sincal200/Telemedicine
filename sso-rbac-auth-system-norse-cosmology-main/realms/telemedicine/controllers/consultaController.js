import db from '../models/index.js';

const consultaController = {
  /**
   * Obtener consulta por ID de cita
   * GET /api/consulta/cita/:citaId
   */
  async obtenerConsultaPorCita(req, res, next) {
    try {
      const { citaId } = req.params;

      const consulta = await db.Consulta.findOne({
        where: {
          cita_id: citaId
        },
        include: [
          {
            model: db.Cita,
            as: 'citum',
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
                model: db.Paciente,
                as: 'paciente',
                include: [
                  {
                    model: db.Persona,
                    as: 'persona'
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!consulta) {
        return res.status(404).json({
          success: false,
          error: 'Consulta no encontrada para esta cita'
        });
      }

      res.json({
        success: true,
        data: consulta
      });
    } catch (error) {
      console.error('Error obteniendo consulta por cita:', error);
      next(error);
    }
  },

  /**
   * Obtener todas las consultas de un paciente
   * GET /api/consulta/paciente/:pacienteId
   */
  async obtenerConsultasPaciente(req, res, next) {
    try {
      const { pacienteId } = req.params;

      const consultas = await db.Consulta.findAll({
        include: [
          {
            model: db.Cita,
            as: 'citum',
            where: {
              paciente_id: pacienteId,
              estado_cita_id: 6 // Solo citas completadas
            },
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
              }
            ]
          }
        ],
        order: [['creado', 'DESC']]
      });

      res.json({
        success: true,
        data: consultas
      });
    } catch (error) {
      console.error('Error obteniendo consultas del paciente:', error);
      next(error);
    }
  },

  /**
   * Obtener todas las consultas de un paciente con citas completadas y recetas
   * GET /api/consulta/paciente/:pacienteId/completas
   */
  async obtenerConsultasCompletasPaciente(req, res, next) {
    try {
      const { pacienteId } = req.params;

      // Obtener citas completadas del paciente
      const citas = await db.Cita.findAll({
        where: {
          paciente_id: pacienteId,
          estado_cita_id: 6 // Citas completadas
        },
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
          },
          {
            model: db.Consulta,
            as: 'Consultum',
            include: [
              {
                model: db.Archivo,
                as: 'Archivos',
                where: {
                  tipo_archivo: 'Receta'
                },
                required: false // LEFT JOIN para incluir consultas sin recetas
              }
            ]
          }
        ],
        order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']]
      });

      // Formatear la respuesta
      const historialCompleto = citas.map(cita => ({
        ...cita.toJSON(),
        consulta: cita.Consultum,
        recetas: cita.Consultum?.Archivos || []
      }));

      res.json({
        success: true,
        data: historialCompleto
      });
    } catch (error) {
      console.error('Error obteniendo consultas completas del paciente:', error);
      next(error);
    }
  }
};

export default consultaController;