import db from '../models/index.js';

/**
 * Script para insertar datos básicos necesarios para el sistema de citas
 * Ejecutar este script después de crear la base de datos
 */

async function insertarDatosBasicos() {
  try {
    console.log('Iniciando inserción de datos básicos...');

    // 0. Datos esenciales: Tipos de Documento y Sexo
    const tiposDocumento = [
      { idTipoDocumento: 1, codigo: 'DPI', nombre: 'DPI', descripcion: 'Documento Personal de Identificación', activo: true },
      { idTipoDocumento: 2, codigo: 'PASAPORTE', nombre: 'Pasaporte', descripcion: 'Pasaporte', activo: true },
      { idTipoDocumento: 3, codigo: 'CEDULA', nombre: 'Cédula', descripcion: 'Cédula de Identidad', activo: true }
    ];

    for (const tipo of tiposDocumento) {
      try {
        await db.TiposDocumentoIdentidad.findOrCreate({
          where: { idTipoDocumento: tipo.idTipoDocumento },
          defaults: tipo
        });
      } catch (error) {
        console.log(`Tipo documento ${tipo.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Tipos de documento insertados');

    const sexos = [
      { idSexo: 1, descripcion: 'Masculino', activo: true },
      { idSexo: 2, descripcion: 'Femenino', activo: true },
      { idSexo: 3, descripcion: 'Otro', activo: true }
    ];

    for (const sexo of sexos) {
      try {
        await db.Sexo.findOrCreate({
          where: { idSexo: sexo.idSexo },
          defaults: sexo
        });
      } catch (error) {
        console.log(`Sexo ${sexo.descripcion} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Sexos insertados');

    // 1. Estados de Cita
    const estadosCita = [
      { idEstadoCita: 1, codigo: 'PROGRAMADA', nombre: 'Programada', descripcion: 'Cita programada', color: '#007bff', activo: true },
      { idEstadoCita: 2, codigo: 'CONFIRMADA', nombre: 'Confirmada', descripcion: 'Cita confirmada por el paciente', color: '#28a745', activo: true },
      { idEstadoCita: 3, codigo: 'EN_CURSO', nombre: 'En Curso', descripcion: 'Cita en curso de atención', color: '#ffc107', activo: true },
      { idEstadoCita: 4, codigo: 'CANCELADA', nombre: 'Cancelada', descripcion: 'Cita cancelada', color: '#dc3545', activo: true },
      { idEstadoCita: 5, codigo: 'NO_ASISTIO', nombre: 'No Asistió', descripcion: 'Paciente no asistió a la cita', color: '#6c757d', activo: true },
      { idEstadoCita: 6, codigo: 'COMPLETADA', nombre: 'Completada', descripcion: 'Cita completada exitosamente', color: '#20c997', activo: true }
    ];

    for (const estado of estadosCita) {
      try {
        await db.EstadosCita.findOrCreate({
          where: { idEstadoCita: estado.idEstadoCita },
          defaults: estado
        });
      } catch (error) {
        console.log(`Estado ${estado.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Estados de cita insertados');

    // 2. Tipos de Cita (sin campo 'creado')
    const tiposCita = [
      { 
        idTipoCita: 1, 
        codigo: 'CONSULTA_GENERAL', 
        nombre: 'Consulta General', 
        descripcion: 'Consulta médica general', 
        duracion_minutos: 30,
        requiere_preparacion: false,
        activo: true 
      },
      { 
        idTipoCita: 2, 
        codigo: 'TELEMEDICINA', 
        nombre: 'Telemedicina', 
        descripcion: 'Consulta médica virtual', 
        duracion_minutos: 20,
        requiere_preparacion: false,
        activo: true 
      },
      { 
        idTipoCita: 3, 
        codigo: 'SEGUIMIENTO', 
        nombre: 'Seguimiento', 
        descripcion: 'Cita de seguimiento de tratamiento', 
        duracion_minutos: 20,
        requiere_preparacion: false,
        activo: true 
      },
      { 
        idTipoCita: 4, 
        codigo: 'URGENCIA', 
        nombre: 'Urgencia', 
        descripcion: 'Cita de urgencia médica', 
        duracion_minutos: 45,
        requiere_preparacion: false,
        activo: true 
      }
    ];

    for (const tipo of tiposCita) {
      try {
        await db.TiposCita.findOrCreate({
          where: { idTipoCita: tipo.idTipoCita },
          defaults: tipo
        });
      } catch (error) {
        console.log(`Tipo de cita ${tipo.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Tipos de cita insertados');

    // 3. Prioridades de Cita (usar campos correctos del modelo)
    const prioridadesCita = [
      { idPrioridad: 1, codigo: 'NORMAL', nombre: 'Normal', descripcion: 'Prioridad normal', nivel: 3, color: '#007bff', activo: true },
      { idPrioridad: 2, codigo: 'ALTA', nombre: 'Alta', descripcion: 'Prioridad alta', nivel: 2, color: '#fd7e14', activo: true },
      { idPrioridad: 3, codigo: 'URGENTE', nombre: 'Urgente', descripcion: 'Prioridad urgente', nivel: 1, color: '#dc3545', activo: true }
    ];

    for (const prioridad of prioridadesCita) {
      try {
        await db.PrioridadesCita.findOrCreate({
          where: { idPrioridad: prioridad.idPrioridad },
          defaults: prioridad
        });
      } catch (error) {
        console.log(`Prioridad ${prioridad.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Prioridades de cita insertadas');

    // 4. Días de la Semana (usar campos correctos del modelo)
    const diasSemana = [
      { idDiaSemana: 1, nombre: 'Lunes', codigo: 'LUN', numero_dia: 1 },
      { idDiaSemana: 2, nombre: 'Martes', codigo: 'MAR', numero_dia: 2 },
      { idDiaSemana: 3, nombre: 'Miércoles', codigo: 'MIE', numero_dia: 3 },
      { idDiaSemana: 4, nombre: 'Jueves', codigo: 'JUE', numero_dia: 4 },
      { idDiaSemana: 5, nombre: 'Viernes', codigo: 'VIE', numero_dia: 5 },
      { idDiaSemana: 6, nombre: 'Sábado', codigo: 'SAB', numero_dia: 6 },
      { idDiaSemana: 7, nombre: 'Domingo', codigo: 'DOM', numero_dia: 7 }
    ];

    for (const dia of diasSemana) {
      try {
        await db.DiasSemana.findOrCreate({
          where: { idDiaSemana: dia.idDiaSemana },
          defaults: dia
        });
      } catch (error) {
        console.log(`Día ${dia.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Días de la semana insertados');

    // 5. Especialidades Básicas
    const especialidades = [
      { idEspecialidad: 1, codigo: 'MED_GENERAL', nombre: 'Medicina General', descripcion: 'Medicina general y familiar', requiere_licencia: true, activo: true },
      { idEspecialidad: 2, codigo: 'PEDIATRIA', nombre: 'Pediatría', descripcion: 'Atención médica infantil', requiere_licencia: true, activo: true },
      { idEspecialidad: 3, codigo: 'GINECOLOGIA', nombre: 'Ginecología', descripcion: 'Salud femenina', requiere_licencia: true, activo: true },
      { idEspecialidad: 4, codigo: 'CARDIOLOGIA', nombre: 'Cardiología', descripcion: 'Enfermedades del corazón', requiere_licencia: true, activo: true },
      { idEspecialidad: 5, codigo: 'ENFERMERIA', nombre: 'Enfermería', descripcion: 'Cuidados de enfermería', requiere_licencia: false, activo: true }
    ];

    for (const especialidad of especialidades) {
      try {
        await db.Especialidades.findOrCreate({
          where: { idEspecialidad: especialidad.idEspecialidad },
          defaults: especialidad
        });
      } catch (error) {
        console.log(`Especialidad ${especialidad.codigo} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Especialidades insertadas');

    // 6. Configuración Centro (básico)
    const centroBásico = {
      idConfiguracion: 1,
      nombre_centro: 'Centro de Salud Principal',
      codigo_establecimiento: 'CSP001',
      activo: true
    };

    try {
      await db.ConfiguracionCentro.findOrCreate({
        where: { idConfiguracion: centroBásico.idConfiguracion },
        defaults: centroBásico
      });
      console.log('✓ Configuración de centro insertada');
    } catch (error) {
      console.log('Centro básico ya existe o error:', error.message);
    }

    console.log('✅ Datos básicos insertados exitosamente');
    
  } catch (error) {
    console.error('❌ Error insertando datos básicos:', error);
    throw error;
  }
}

/**
 * Script para crear datos de ejemplo para pruebas
 */
async function insertarDatosEjemplo() {
  try {
    console.log('Insertando datos de ejemplo...');

    // Verificar si ya existen datos
    const existePersona = await db.Persona.findOne();
    if (existePersona) {
      console.log('Ya existen datos de ejemplo, saltando inserción...');
      return;
    }

    // 1. Crear datos geográficos básicos primero
    // Departamentos
    const departamentos = [
      { idDepartamento: 1, nombre: 'Guatemala', codigo: 'GT', activo: true },
      { idDepartamento: 2, nombre: 'Sacatepéquez', codigo: 'SA', activo: true }
    ];

    for (const dept of departamentos) {
      try {
        await db.Departamento.findOrCreate({
          where: { idDepartamento: dept.idDepartamento },
          defaults: dept
        });
      } catch (error) {
        console.log(`Departamento ${dept.nombre} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Departamentos de ejemplo insertados');

    // Municipios
    const municipios = [
      { idMunicipio: 1, nombre: 'Guatemala', codigo: 'GT01', departamento_id: 1, activo: true },
      { idMunicipio: 2, nombre: 'Mixco', codigo: 'GT02', departamento_id: 1, activo: true }
    ];

    for (const mun of municipios) {
      try {
        await db.Municipio.findOrCreate({
          where: { idMunicipio: mun.idMunicipio },
          defaults: mun
        });
      } catch (error) {
        console.log(`Municipio ${mun.nombre} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Municipios de ejemplo insertados');

    // Aldeas
    const aldeas = [
      { idAldea: 1, nombre: 'Centro', municipio_id: 1, activo: true },
      { idAldea: 2, nombre: 'Zona 1', municipio_id: 1, activo: true }
    ];

    for (const aldea of aldeas) {
      try {
        await db.Aldea.findOrCreate({
          where: { idAldea: aldea.idAldea },
          defaults: aldea
        });
      } catch (error) {
        console.log(`Aldea ${aldea.nombre} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Aldeas de ejemplo insertadas');

    // Direcciones
    const direcciones = [
      {
        idDireccion: 1,
        direccion_completa: '1a Calle 2-34 Zona 1',
        departamento_id: 1,
        municipio_id: 1,
        aldea_id: 1,
        zona: 'Zona 1',
        referencia: 'Frente al parque central',
        activo: true
      },
      {
        idDireccion: 2,
        direccion_completa: '5a Avenida 10-25 Zona 2',
        departamento_id: 1,
        municipio_id: 1,
        aldea_id: 1,
        zona: 'Zona 2',
        referencia: 'Cerca del hospital',
        activo: true
      },
      {
        idDireccion: 3,
        direccion_completa: '12 Calle 5-67 Zona 10',
        departamento_id: 1,
        municipio_id: 1,
        aldea_id: 1,
        zona: 'Zona 10',
        referencia: 'Edificio Torre Médica',
        activo: true
      }
    ];

    for (const dir of direcciones) {
      try {
        await db.Direccion.findOrCreate({
          where: { idDireccion: dir.idDireccion },
          defaults: dir
        });
      } catch (error) {
        console.log(`Dirección ${dir.idDireccion} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Direcciones de ejemplo insertadas');

    // Verificar que las direcciones se crearon correctamente
    const direccionesCreadas = await db.Direccion.count();
    console.log(`📍 Total de direcciones en BD: ${direccionesCreadas}`);

    // 2. Crear personas de ejemplo (usando campos correctos)
    const personas = [
      {
        idPersona: 1,
        tipo_documento_id: 1,
        numero_documento: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez García',
        fecha_nacimiento: '1980-01-15',
        sexo_id: 1,
        direccion_id: 1, // Dirección creada arriba
        telefono: '+502 1234-5678',
        email: 'juan.perez@example.com',
        activo: true
      },
      {
        idPersona: 2,
        tipo_documento_id: 1,
        numero_documento: '87654321',
        nombres: 'María Elena',
        apellidos: 'González López',
        fecha_nacimiento: '1975-03-22',
        sexo_id: 2,
        direccion_id: 2, // Dirección creada arriba
        telefono: '+502 8765-4321',
        email: 'maria.gonzalez@example.com',
        activo: true
      },
      {
        idPersona: 3,
        tipo_documento_id: 1,
        numero_documento: '11111111',
        nombres: 'Ana Sofía',
        apellidos: 'Martínez Rodríguez',
        fecha_nacimiento: '1990-07-10',
        sexo_id: 2,
        direccion_id: 3, // Dirección creada arriba
        telefono: '+502 1111-1111',
        email: 'ana.martinez@example.com',
        activo: true
      }
    ];

    for (const persona of personas) {
      try {
        const [personaCreated, created] = await db.Persona.findOrCreate({
          where: { idPersona: persona.idPersona },
          defaults: persona
        });
        if (created) {
          console.log(`✓ Persona ${persona.nombres} creada correctamente`);
        } else {
          console.log(`- Persona ${persona.nombres} ya existe`);
        }
      } catch (error) {
        console.log(`❌ Error creando persona ${persona.nombres}:`, error.message);
        // No fallar completamente, continuar con las siguientes
      }
    }
    console.log('✓ Personas de ejemplo insertadas');

    // Verificar que las personas se crearon correctamente
    const personasCreadas = await db.Persona.count();
    console.log(`👥 Total de personas en BD: ${personasCreadas}`);

    // Verificar direcciones específicas que necesitamos
    for (let i = 1; i <= 3; i++) {
      const direccion = await db.Direccion.findByPk(i);
      if (direccion) {
        console.log(`✓ Dirección ${i} existe: ${direccion.direccion_completa}`);
      } else {
        console.log(`❌ Dirección ${i} NO existe`);
      }
    }

    // 3. Crear personal médico de ejemplo
    // Verificar que existe el centro antes de crear personal médico
    const centroExiste = await db.ConfiguracionCentro.findByPk(1);
    if (!centroExiste) {
      console.log('❌ Centro de salud ID 1 no existe. Ejecutar primero insertarDatosBasicos()');
      return;
    }
    console.log('✓ Centro de salud verificado');

    const personalMedico = [
      {
        idPersonalMedico: 1,
        persona_id: 1,
        centro_id: 1,
        numero_licencia: 'LIC001',
        numero_colegiado: 'COL001',
        especialidad_id: 1, // Medicina General
        cargo: 'Doctor',
        universidad: 'Universidad de San Carlos',
        anos_experiencia: 15,
        biografia: 'Doctor especialista en medicina general con amplia experiencia.',
        activo: true,
        verificado: true
      },
      {
        idPersonalMedico: 2,
        persona_id: 2,
        centro_id: 1,
        numero_licencia: 'LIC002',
        numero_colegiado: 'COL002',
        especialidad_id: 2, // Pediatría
        cargo: 'Doctora',
        universidad: 'Universidad Rafael Landívar',
        anos_experiencia: 12,
        biografia: 'Doctora pediatra especializada en atención infantil.',
        activo: true,
        verificado: true
      }
    ];

    for (const medico of personalMedico) {
      try {
        const [medicoCreated, created] = await db.PersonalMedico.findOrCreate({
          where: { idPersonalMedico: medico.idPersonalMedico },
          defaults: medico
        });
        if (created) {
          console.log(`✓ Personal médico ${medico.numero_licencia} creado correctamente`);
        } else {
          console.log(`- Personal médico ${medico.numero_licencia} ya existe`);
        }
      } catch (error) {
        console.log(`❌ Error creando personal médico ${medico.numero_licencia}:`, error.message);
        // Verificar si la persona existe
        const personaExiste = await db.Persona.findByPk(medico.persona_id);
        if (!personaExiste) {
          console.log(`❌ La persona con ID ${medico.persona_id} no existe`);
        }
      }
    }
    console.log('✓ Personal médico de ejemplo insertado');

    // 3. Crear paciente de ejemplo
    const paciente = {
      idPaciente: 1,
      persona_id: 3,
      numero_expediente: 'EXP001',
      tipo_sangre: 'O+',
      alergias: 'Ninguna conocida',
      contacto_emergencia_nombre: 'Pedro Martínez',
      contacto_emergencia_telefono: '+502 2222-2222',
      contacto_emergencia_parentesco: 'Esposo',
      activo: true
    };

    try {
      await db.Paciente.findOrCreate({
        where: { idPaciente: paciente.idPaciente },
        defaults: paciente
      });
      console.log('✓ Paciente de ejemplo insertado');
    } catch (error) {
      console.log('Paciente ya existe o error:', error.message);
    }

    // 4. Crear disponibilidad de ejemplo
    const disponibilidades = [
      // Dr. Juan Pérez - Lunes a Viernes 8:00-12:00
      { idDisponibilidad: 1, personal_medico_id: 1, dia_semana_id: 1, hora_inicio: '08:00', hora_fin: '12:00', duracion_consulta: 30, activo: true },
      { idDisponibilidad: 2, personal_medico_id: 1, dia_semana_id: 2, hora_inicio: '08:00', hora_fin: '12:00', duracion_consulta: 30, activo: true },
      { idDisponibilidad: 3, personal_medico_id: 1, dia_semana_id: 3, hora_inicio: '08:00', hora_fin: '12:00', duracion_consulta: 30, activo: true },
      { idDisponibilidad: 4, personal_medico_id: 1, dia_semana_id: 4, hora_inicio: '08:00', hora_fin: '12:00', duracion_consulta: 30, activo: true },
      { idDisponibilidad: 5, personal_medico_id: 1, dia_semana_id: 5, hora_inicio: '08:00', hora_fin: '12:00', duracion_consulta: 30, activo: true },
      
      // Dra. María González - Martes y Jueves 14:00-18:00
      { idDisponibilidad: 6, personal_medico_id: 2, dia_semana_id: 2, hora_inicio: '14:00', hora_fin: '18:00', duracion_consulta: 25, activo: true },
      { idDisponibilidad: 7, personal_medico_id: 2, dia_semana_id: 4, hora_inicio: '14:00', hora_fin: '18:00', duracion_consulta: 25, activo: true }
    ];

    for (const disponibilidad of disponibilidades) {
      try {
        await db.DisponibilidadPersonalMedico.findOrCreate({
          where: { idDisponibilidad: disponibilidad.idDisponibilidad },
          defaults: disponibilidad
        });
      } catch (error) {
        console.log(`Disponibilidad ${disponibilidad.idDisponibilidad} ya existe o error:`, error.message);
      }
    }
    console.log('✓ Disponibilidades de ejemplo insertadas');

    console.log('✅ Datos de ejemplo insertados exitosamente');

  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
    throw error;
  }
}

export { insertarDatosBasicos, insertarDatosEjemplo };
