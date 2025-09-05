import db from '../models/index.js';

const personalMedicoController = {
  /**
   * Buscar personal médico por email
   * GET /api/personal-medico/buscar-por-email/:email
   */
  async buscarPorEmail(req, res, next) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email es requerido'
        });
      }

      const personalMedico = await db.PersonalMedico.findOne({
        include: [
          {
            model: db.Persona,
            as: 'persona',
            where: {
              email: email
            },
            required: true
          },
          {
            model: db.Especialidades,
            as: 'especialidad'
          }
        ]
      });

      if (!personalMedico) {
        return res.status(404).json({
          success: false,
          error: 'Personal médico no encontrado con ese email'
        });
      }

      res.json({
        success: true,
        data: personalMedico
      });
    } catch (error) {
      console.error('Error buscando personal médico por email:', error);
      next(error);
    }
  }
};

export default personalMedicoController;
