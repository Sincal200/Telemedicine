import { Op } from 'sequelize';
import db from '../models/index.js';

const agendaService = {
  /**
   * Busca horarios disponibles para una especialidad en un rango de fechas
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} filtros.especialidadId - ID de la especialidad
   * @param {string} filtros.fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} filtros.fechaFin - Fecha fin (YYYY-MM-DD)
   * @param {number} [filtros.tipoCitaId] - ID del tipo de cita (opcional)
   * @param {number} [filtros.personalMedicoId] - ID del médico específico (opcional)
   * @returns {Array} Array de horarios disponibles
   */
  async buscarHorariosDisponibles(filtros) {
    try {
      const { especialidadId, fechaInicio, fechaFin, tipoCitaId, personalMedicoId } = filtros;

      // 1. Obtener el tipo de cita para saber la duración
      let duracionCita = 30; // Default 30 minutos
      if (tipoCitaId) {
        const tipoCita = await db.TiposCita.findByPk(tipoCitaId);
        if (tipoCita) {
          duracionCita = tipoCita.duracion_minutos;
        }
      }

      // 2. Buscar personal médico de la especialidad
      const wherePersonal = {
        especialidad_id: especialidadId,
        activo: true,
        verificado: true
      };

      if (personalMedicoId) {
        wherePersonal.idPersonalMedico = personalMedicoId;
      }

      const personalMedico = await db.PersonalMedico.findAll({
        where: wherePersonal,
        include: [
          {
            model: db.DisponibilidadPersonalMedico,
            as: 'DisponibilidadPersonalMedicos',
            where: { activo: true }
          },
          {
            model: db.Persona,
            as: 'persona'
          },
          {
            model: db.Especialidades,
            as: 'especialidad'
          }
        ]
      });

      // 3. Generar slots de tiempo disponibles
      const horariosDisponibles = [];

      for (const medico of personalMedico) {
        const slots = await this.generarSlotsDisponibles(
          medico,
          fechaInicio,
          fechaFin,
          duracionCita
        );
        horariosDisponibles.push(...slots);
      }

      // 4. Filtrar horarios ya ocupados
      const horariosFiltrados = await this.filtrarHorariosOcupados(horariosDisponibles);

      return horariosFiltrados.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    } catch (error) {
      console.error('Error buscando horarios disponibles:', error);
      throw error;
    }
  },

  /**
   * Genera slots de tiempo disponibles para un médico en un rango de fechas
   */
  async generarSlotsDisponibles(medico, fechaInicio, fechaFin, duracionCita) {
    const slots = [];
    const fechaActual = new Date(fechaInicio);
    const fechaFinal = new Date(fechaFin);

    while (fechaActual <= fechaFinal) {
      const diaSemana = fechaActual.getDay();

      // Mapeo correcto: 0=domingo→7, 1=lunes→1, 2=martes→2, ..., 6=sábado→6
      const diaSemanaId = diaSemana === 0 ? 7 : diaSemana;

      // Buscar disponibilidad para este día de la semana
      const disponibilidad = medico.DisponibilidadPersonalMedicos?.find(
        d => d.dia_semana_id === diaSemanaId
      );

      if (disponibilidad) {
        const slotsDelDia = this.generarSlotsDelDia(
          fechaActual,
          disponibilidad,
          duracionCita,
          medico
        );
        slots.push(...slotsDelDia);
      }

      // Avanzar al siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return slots;
  },

  /**
   * Genera slots para un día específico
   */
  generarSlotsDelDia(fecha, disponibilidad, duracionCita, medico) {
    const slots = [];
    const fechaStr = fecha.toISOString().split('T')[0];

    // Convertir horas a minutos para facilitar cálculos
    const [horaInicioH, horaInicioM] = disponibilidad.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = disponibilidad.hora_fin.split(':').map(Number);

    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;

    // Usar duración específica del médico si está configurada
    const duracion = disponibilidad.duracion_consulta || duracionCita;

    const bufferMinutos = 5; // Buffer entre citas
    for (let minutos = minutosInicio; minutos + duracion <= minutosFin; minutos += (duracion + bufferMinutos)) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      const horaSlot = `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      slots.push({
        personalMedicoId: medico.idPersonalMedico,
        fechaHora: `${fechaStr} ${horaSlot}:00`,
        duracionMinutos: duracion,
        medico: {
          id: medico.idPersonalMedico,
          nombre: `${medico.persona?.nombres} ${medico.persona?.apellidos}`,
          especialidad: medico.especialidad?.nombre
        }
      });
    }

    return slots;
  },

  /**
   * Filtra horarios que ya están ocupados
   */
  async filtrarHorariosOcupados(horarios) {
    if (horarios.length === 0) return [];

    // Obtener fechas únicas y ordenarlas (YYYY-MM-DD se ordena lexicográficamente)
    const fechas = [...new Set(horarios.map(h => h.fechaHora.split(' ')[0]))].sort();

    const personalMedicoIds = [...new Set(horarios.map(h => h.personalMedicoId))];

    // Buscar citas existentes en el rango
    const citasExistentes = await db.Cita.findAll({
      where: {
        personal_medico_id: { [Op.in]: personalMedicoIds },
        fecha: {
          [Op.between]: [fechas[0], fechas[fechas.length - 1]]
        },
        estado_cita_id: {
          [Op.notIn]: [4, 5] // Canceladas y no asistidas
        }
      }
    });

    // Filtrar horarios disponibles considerando solapamientos
    return horarios.filter(horario => {
      const [fechaSlot, horaSlot] = horario.fechaHora.split(' ');
      const slotInicio = horaSlot.substring(0, 5); // HH:MM

      // Calcular fin del slot
      const [h, m] = slotInicio.split(':').map(Number);
      const minutosInicio = h * 60 + m;
      const minutosFin = minutosInicio + (horario.duracionMinutos || 30);
      const slotFinH = Math.floor(minutosFin / 60);
      const slotFinM = minutosFin % 60;
      const slotFin = `${slotFinH.toString().padStart(2, '0')}:${slotFinM.toString().padStart(2, '0')}`;

      // Verificar si hay alguna cita que se solape con el slot
      const ocupado = citasExistentes.some(cita => {
        if (cita.personal_medico_id !== horario.personalMedicoId || cita.fecha !== fechaSlot) return false;
        // Cita: [hora_inicio, hora_fin]
        // Slot: [slotInicio, slotFin]
        // Solapan si inicio de cita < fin de slot y fin de cita > inicio de slot
        return (cita.hora_inicio < slotFin && cita.hora_fin > slotInicio);
      });

      return !ocupado;
    });
  },

  /**
   * Reserva un horario específico
   * @param {Object} datosCita - Datos para crear la cita
   * @returns {Object} Cita creada
   */
  async reservarHorario(datosCita) {
    const transaction = await db.sequelize.transaction();

    try {
      const {
        pacienteId,
        personalMedicoId,
        fecha,
        horaInicio,
        tipoCitaId,
        motivoConsulta,
        prioridadId = 1 // Normal por defecto
      } = datosCita;

      // 1. Obtener tipo de cita para calcular hora_fin
      const tipoCita = await db.TiposCita.findByPk(tipoCitaId);
      if (!tipoCita) {
        throw new Error('Tipo de cita no encontrado');
      }

      // Calcular hora_fin basada en la duración
      const [horaH, horaM] = horaInicio.split(':').map(Number);
      const minutosInicio = horaH * 60 + horaM;
      const minutosFin = minutosInicio + tipoCita.duracion_minutos;
      const horaFinH = Math.floor(minutosFin / 60);
      const horaFinM = minutosFin % 60;
      const horaFin = `${horaFinH.toString().padStart(2, '0')}:${horaFinM.toString().padStart(2, '0')}`;

      // 2. Verificar que el horario sigue disponible
      const citaExistente = await db.Cita.findOne({
        where: {
          personal_medico_id: personalMedicoId,
          fecha: fecha,
          [Op.or]: [
            {
              hora_inicio: {
                [Op.between]: [horaInicio, horaFin]
              }
            },
            {
              hora_fin: {
                [Op.between]: [horaInicio, horaFin]
              }
            },
            {
              [Op.and]: [
                { hora_inicio: { [Op.lte]: horaInicio } },
                { hora_fin: { [Op.gte]: horaFin } }
              ]
            }
          ],
          estado_cita_id: {
            [Op.notIn]: [4, 5] // Canceladas y no asistidas
          }
        },
        transaction
      });

      if (citaExistente) {
        throw new Error('El horario ya no está disponible');
      }

      // 3. Generar número de cita único
      const numeroCita = await this.generarNumeroCita();

      // 4. Generar ID único para la cita
      const idCita = await this.generarIdCita(pacienteId, fecha, horaInicio);

      // Validar que el ID se generó correctamente
      if (!idCita || isNaN(idCita)) {
        throw new Error(`Error generando ID de cita: ${idCita}`);
      }

      // 5. Crear la cita
      const citaData = {
        idCita: idCita,
        numero_cita: numeroCita,
        paciente_id: pacienteId,
        personal_medico_id: personalMedicoId,
        tipo_cita_id: tipoCitaId,
        estado_cita_id: 1, // Programada
        prioridad_id: prioridadId,
        fecha: fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        motivo_consulta: motivoConsulta,
        // Campos de telemedicina si existen
        es_telemedicina:
          typeof datosCita.es_telemedicina !== 'undefined'
            ? datosCita.es_telemedicina
            : (typeof datosCita.esTelemedicina !== 'undefined' ? datosCita.esTelemedicina : 0),
        room_id: datosCita.room_id || null,
        url_videollamada: datosCita.url_videollamada || null
      };

      const nuevaCita = await db.Cita.create(citaData, { transaction });

      await transaction.commit();

      // Retornar cita con información adicional
      return await this.obtenerCitaCompleta(nuevaCita.idCita);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Genera un número único para la cita
   */
  async generarNumeroCita() {
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');

    // Buscar el último número del día
    const ultimaCita = await db.Cita.findOne({
      where: {
        numero_cita: {
          [Op.like]: `${year}${month}${day}%`
        }
      },
      order: [['numero_cita', 'DESC']],
      limit: 1
    });

    let secuencial = 1;
    if (ultimaCita) {
      const ultimoSecuencial = parseInt(ultimaCita.numero_cita.slice(-4));
      secuencial = ultimoSecuencial + 1;
    }

    return `${year}${month}${day}${secuencial.toString().padStart(4, '0')}`;
  },

  /**
   * Genera un ID único para la cita con fecha y hora
   * Formato: MMDDHHMMPP (10 dígitos máximo)
   * - MM: Mes (2 dígitos)
   * - DD: Día (2 dígitos)
   * - HHMM: Hora y minutos (4 dígitos)
   * - PP: Paciente ID (2 dígitos)
   * Ejemplo: 0826083002 = 26 de agosto, 08:30, paciente 2
   */
  async generarIdCita(pacienteId, fecha, horaInicio) {
    try {
      // Extraer componentes de la fecha
      const fechaObj = new Date(fecha);
      const month = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const day = fechaObj.getDate().toString().padStart(2, '0');

      // Formatear hora (HHMM)
      const horaFormatted = horaInicio.replace(':', '');

      // Formatear paciente ID (últimos 2 dígitos)
      const pacienteIdFormatted = pacienteId.toString().padStart(2, '0').slice(-2);

      // Crear ID base: MM + DD + HHMM + PP
      const idBase = parseInt(`${month}${day}${horaFormatted}${pacienteIdFormatted}`);

      // Verificar si ya existe este ID
      const existingCita = await db.Cita.findOne({
        where: { idCita: idBase }
      });

      let idFinal = idBase;

      if (existingCita) {
        // Si existe, agregar los últimos 2 dígitos del timestamp
        const timestamp = Date.now().toString();
        const timestampSufijo = timestamp.slice(-2);

        // Reemplazar los últimos 2 dígitos del paciente con timestamp
        const baseStr = idBase.toString();
        const baseConTimestamp = baseStr.slice(0, -2) + timestampSufijo;
        idFinal = parseInt(baseConTimestamp);
      }

      // Verificar que esté dentro del límite de INT
      if (idFinal > 2147483647) {
        // Fallback: usar formato más corto sin mes
        const idCorto = parseInt(`${day}${horaFormatted}${pacienteIdFormatted}`);
        idFinal = idCorto;
      }

      return idFinal;
    } catch (error) {
      console.error('Error en generarIdCita:', error);
      // ID de emergencia
      return Math.floor(Math.random() * 999999) + 100000;
    }
  },

  /**
   * Obtiene una cita con toda la información relacionada
   */
  async obtenerCitaCompleta(citaId) {
    return await db.Cita.findByPk(citaId, {
      include: [
        {
          model: db.Paciente,
          as: 'paciente',
          include: [
            {
              model: db.Persona,
              as: 'persona'
            }
          ]
        },
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
      ]
    });
  }
};

export default agendaService;
