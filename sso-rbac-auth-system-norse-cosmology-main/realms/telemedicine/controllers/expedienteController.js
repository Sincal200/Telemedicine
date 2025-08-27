
// Controlador para obtener el expediente clínico completo de un paciente
import models from '../models/index.js';
const { Paciente, Persona, Cita, Consulta, Archivo, SignosVitales, Mensaje, PersonalMedico } = models;

// GET /api/pacientes/:id/expediente
export async function getExpedienteCompleto(req, res) {
  try {
    const idPaciente = req.params.id;
    // Buscar paciente y persona asociada
    const paciente = await Paciente.findOne({
      where: { idPaciente },
      include: [
        {
          model: Persona,
          as: 'persona',
        },
      ],
    });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    // Consultas y citas
    const citas = await Cita.findAll({
      where: { paciente_id: idPaciente },
      include: [
        {
          model: Consulta,
          as: 'Consultum',
          include: [
            {
              model: SignosVitales,
              as: 'SignosVitales',
              attributes: { exclude: [] }, // Para asegurar que traiga todos los campos
            },
          ],
        },
        {
          model: PersonalMedico,
          as: 'personal_medico',
        },
      ],
      order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
    });

    // Archivos
    const archivos = await Archivo.findAll({
      where: { paciente_id: idPaciente },
      order: [['creado', 'DESC']],
    });

    // Mensajes
    const mensajes = await Mensaje.findAll({
      where: { paciente_id: idPaciente },
      order: [['creado', 'DESC']],
    });

    return res.json({
      paciente,
      citas,
      archivos,
      mensajes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener expediente' });
  }
}
