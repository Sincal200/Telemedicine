import { DataTypes } from "sequelize";
import Aldea from "./Aldea.js";
import Archivo from "./Archivo.js";
import Cita from "./Cita.js";
import ConfiguracionCentro from "./ConfiguracionCentro.js";
import Consulta from "./Consulta.js";
import Departamento from "./Departamento.js";
import DiasSemana from "./DiasSemana.js";
import Direccion from "./Direccion.js";
import DisponibilidadPersonalMedico from "./DisponibilidadPersonalMedico.js";
import Especialidades from "./Especialidades.js";
import EstadisticasDiarias from "./EstadisticasDiarias.js";
import EstadosCita from "./EstadosCita.js";
import LogSistema from "./LogSistema.js";
import Mensaje from "./Mensaje.js";
import Municipio from "./Municipio.js";
import Paciente from "./Paciente.js";
import Persona from "./Persona.js";
import PersonalMedico from "./PersonalMedico.js";
import PrioridadesCita from "./PrioridadesCita.js";
import Recordatorio from "./Recordatorio.js";
import Sexo from "./Sexo.js";
import SignosVitales from "./SignosVitales.js";
import SolicitudRol from "./SolicitudRol.js";
import TiposCita from "./TiposCita.js";
import TiposDocumentoIdentidad from "./TiposDocumentoIdentidad.js";
import Usuario from "./Usuario.js";

function initModels(sequelize) {
  const AldeaModel = Aldea(sequelize, DataTypes);
  const ArchivoModel = Archivo(sequelize, DataTypes);
  const CitaModel = Cita(sequelize, DataTypes);
  const ConfiguracionCentroModel = ConfiguracionCentro(sequelize, DataTypes);
  const ConsultaModel = Consulta(sequelize, DataTypes);
  const DepartamentoModel = Departamento(sequelize, DataTypes);
  const DiasSemanaModel = DiasSemana(sequelize, DataTypes);
  const DireccionModel = Direccion(sequelize, DataTypes);
  const DisponibilidadPersonalMedicoModel = DisponibilidadPersonalMedico(sequelize, DataTypes);
  const EspecialidadesModel = Especialidades(sequelize, DataTypes);
  const EstadisticasDiariasModel = EstadisticasDiarias(sequelize, DataTypes);
  const EstadosCitaModel = EstadosCita(sequelize, DataTypes);
  const LogSistemaModel = LogSistema(sequelize, DataTypes);
  const MensajeModel = Mensaje(sequelize, DataTypes);
  const MunicipioModel = Municipio(sequelize, DataTypes);
  const PacienteModel = Paciente(sequelize, DataTypes);
  const PersonaModel = Persona(sequelize, DataTypes);
  const PersonalMedicoModel = PersonalMedico(sequelize, DataTypes);
  const PrioridadesCitaModel = PrioridadesCita(sequelize, DataTypes);
  const RecordatorioModel = Recordatorio(sequelize, DataTypes);
  const SexoModel = Sexo(sequelize, DataTypes);
  const SignosVitalesModel = SignosVitales(sequelize, DataTypes);
  const SolicitudRolModel = SolicitudRol(sequelize, DataTypes);
  const TiposCitaModel = TiposCita(sequelize, DataTypes);
  const TiposDocumentoIdentidadModel = TiposDocumentoIdentidad(sequelize, DataTypes);
  const UsuarioModel = Usuario(sequelize, DataTypes);

  DireccionModel.belongsTo(AldeaModel, { as: "aldea", foreignKey: "aldea_id"});
  AldeaModel.hasMany(DireccionModel, { as: "Direccions", foreignKey: "aldea_id"});
  ConsultaModel.belongsTo(CitaModel, { as: "citum", foreignKey: "cita_id"});
  CitaModel.hasOne(ConsultaModel, { as: "Consultum", foreignKey: "cita_id"});
  CitaModel.belongsTo(ConfiguracionCentroModel, { as: "centro", foreignKey: "centro_id"});
  ConfiguracionCentroModel.hasMany(CitaModel, { as: "Cita", foreignKey: "centro_id"});
  EstadisticasDiariasModel.belongsTo(ConfiguracionCentroModel, { as: "centro", foreignKey: "centro_id"});
  ConfiguracionCentroModel.hasMany(EstadisticasDiariasModel, { as: "EstadisticasDiaria", foreignKey: "centro_id"});
  PersonalMedicoModel.belongsTo(ConfiguracionCentroModel, { as: "centro", foreignKey: "centro_id"});
  ConfiguracionCentroModel.hasMany(PersonalMedicoModel, { as: "PersonalMedicos", foreignKey: "centro_id"});
  ArchivoModel.belongsTo(ConsultaModel, { as: "consultum", foreignKey: "consulta_id"});
  ConsultaModel.hasMany(ArchivoModel, { as: "Archivos", foreignKey: "consulta_id"});
  SignosVitalesModel.belongsTo(ConsultaModel, { as: "consultum", foreignKey: "consulta_id"});
  ConsultaModel.hasMany(SignosVitalesModel, { as: "SignosVitales", foreignKey: "consulta_id"});
  DireccionModel.belongsTo(DepartamentoModel, { as: "departamento", foreignKey: "departamento_id"});
  DepartamentoModel.hasMany(DireccionModel, { as: "Direccions", foreignKey: "departamento_id"});
  MunicipioModel.belongsTo(DepartamentoModel, { as: "departamento", foreignKey: "departamento_id"});
  DepartamentoModel.hasMany(MunicipioModel, { as: "Municipios", foreignKey: "departamento_id"});
  DisponibilidadPersonalMedicoModel.belongsTo(DiasSemanaModel, { as: "dia_semana", foreignKey: "dia_semana_id"});
  DiasSemanaModel.hasMany(DisponibilidadPersonalMedicoModel, { as: "DisponibilidadPersonalMedicos", foreignKey: "dia_semana_id"});
  PersonaModel.belongsTo(DireccionModel, { as: "direccion", foreignKey: "direccion_id"});
  DireccionModel.hasMany(PersonaModel, { as: "Personas", foreignKey: "direccion_id"});
  PersonalMedicoModel.belongsTo(EspecialidadesModel, { as: "especialidad", foreignKey: "especialidad_id"});
  EspecialidadesModel.hasMany(PersonalMedicoModel, { as: "PersonalMedicos", foreignKey: "especialidad_id"});
  CitaModel.belongsTo(EstadosCitaModel, { as: "estado_citum", foreignKey: "estado_cita_id"});
  EstadosCitaModel.hasMany(CitaModel, { as: "Cita", foreignKey: "estado_cita_id"});
  AldeaModel.belongsTo(MunicipioModel, { as: "municipio", foreignKey: "municipio_id"});
  MunicipioModel.hasMany(AldeaModel, { as: "Aldeas", foreignKey: "municipio_id"});
  DireccionModel.belongsTo(MunicipioModel, { as: "municipio", foreignKey: "municipio_id"});
  MunicipioModel.hasMany(DireccionModel, { as: "Direccions", foreignKey: "municipio_id"});
  ArchivoModel.belongsTo(PacienteModel, { as: "paciente", foreignKey: "paciente_id"});
  PacienteModel.hasMany(ArchivoModel, { as: "Archivos", foreignKey: "paciente_id"});
  CitaModel.belongsTo(PacienteModel, { as: "paciente", foreignKey: "paciente_id"});
  PacienteModel.hasMany(CitaModel, { as: "Cita", foreignKey: "paciente_id"});
  MensajeModel.belongsTo(PacienteModel, { as: "paciente", foreignKey: "paciente_id"});
  PacienteModel.hasMany(MensajeModel, { as: "Mensajes", foreignKey: "paciente_id"});
  PacienteModel.belongsTo(PersonaModel, { as: "persona", foreignKey: "persona_id"});
  PersonaModel.hasOne(PacienteModel, { as: "Paciente", foreignKey: "persona_id"});
  PersonalMedicoModel.belongsTo(PersonaModel, { as: "persona", foreignKey: "persona_id"});
  PersonaModel.hasOne(PersonalMedicoModel, { as: "PersonalMedico", foreignKey: "persona_id"});
  UsuarioModel.belongsTo(PersonaModel, { as: "persona", foreignKey: "persona_id"});
  PersonaModel.hasOne(UsuarioModel, { as: "Usuario", foreignKey: "persona_id"});
  CitaModel.belongsTo(PersonalMedicoModel, { as: "personal_medico", foreignKey: "personal_medico_id"});
  PersonalMedicoModel.hasMany(CitaModel, { as: "Cita", foreignKey: "personal_medico_id"});
  ConfiguracionCentroModel.belongsTo(PersonalMedicoModel, { as: "director_medico", foreignKey: "director_medico_id"});
  PersonalMedicoModel.hasMany(ConfiguracionCentroModel, { as: "ConfiguracionCentros", foreignKey: "director_medico_id"});
  DisponibilidadPersonalMedicoModel.belongsTo(PersonalMedicoModel, { as: "personal_medico", foreignKey: "personal_medico_id"});
  PersonalMedicoModel.hasMany(DisponibilidadPersonalMedicoModel, { as: "DisponibilidadPersonalMedicos", foreignKey: "personal_medico_id"});
  MensajeModel.belongsTo(PersonalMedicoModel, { as: "personal_medico", foreignKey: "personal_medico_id"});
  PersonalMedicoModel.hasMany(MensajeModel, { as: "Mensajes", foreignKey: "personal_medico_id"});
  CitaModel.belongsTo(PrioridadesCitaModel, { as: "prioridad", foreignKey: "prioridad_id"});
  PrioridadesCitaModel.hasMany(CitaModel, { as: "Cita", foreignKey: "prioridad_id"});
  PersonaModel.belongsTo(SexoModel, { as: "sexo", foreignKey: "sexo_id"});
  SexoModel.hasMany(PersonaModel, { as: "Personas", foreignKey: "sexo_id"});
  CitaModel.belongsTo(TiposCitaModel, { as: "tipo_citum", foreignKey: "tipo_cita_id"});
  TiposCitaModel.hasMany(CitaModel, { as: "Cita", foreignKey: "tipo_cita_id"});
  PersonaModel.belongsTo(TiposDocumentoIdentidadModel, { as: "tipo_documento", foreignKey: "tipo_documento_id"});
  TiposDocumentoIdentidadModel.hasMany(PersonaModel, { as: "Personas", foreignKey: "tipo_documento_id"});
  ArchivoModel.belongsTo(UsuarioModel, { as: "creado_por_Usuario", foreignKey: "creado_por"});
  UsuarioModel.hasMany(ArchivoModel, { as: "Archivos", foreignKey: "creado_por"});
  ConfiguracionCentroModel.belongsTo(UsuarioModel, { as: "administrador_sistema", foreignKey: "administrador_sistema_id"});
  UsuarioModel.hasMany(ConfiguracionCentroModel, { as: "ConfiguracionCentros", foreignKey: "administrador_sistema_id"});
  MensajeModel.belongsTo(UsuarioModel, { as: "remitente", foreignKey: "remitente_id"});
  UsuarioModel.hasMany(MensajeModel, { as: "Mensajes", foreignKey: "remitente_id"});
  RecordatorioModel.belongsTo(UsuarioModel, { as: "usuario", foreignKey: "usuario_id"});
  UsuarioModel.hasMany(RecordatorioModel, { as: "Recordatorios", foreignKey: "usuario_id"});
  SignosVitalesModel.belongsTo(UsuarioModel, { as: "tomado_por_Usuario", foreignKey: "tomado_por"});
  UsuarioModel.hasMany(SignosVitalesModel, { as: "SignosVitales", foreignKey: "tomado_por"});
  SolicitudRolModel.belongsTo(UsuarioModel, { as: "revisado_por_Usuario", foreignKey: "revisado_por"});
  UsuarioModel.hasMany(SolicitudRolModel, { as: "SolicitudRols", foreignKey: "revisado_por"});
  SolicitudRolModel.belongsTo(UsuarioModel, { as: "usuario", foreignKey: "usuario_id"});
  UsuarioModel.hasMany(SolicitudRolModel, { as: "usuario_SolicitudRols", foreignKey: "usuario_id"});

  return {
    Aldea: AldeaModel,
    Archivo: ArchivoModel,
    Cita: CitaModel,
    ConfiguracionCentro: ConfiguracionCentroModel,
    Consulta: ConsultaModel,
    Departamento: DepartamentoModel,
    DiasSemana: DiasSemanaModel,
    Direccion: DireccionModel,
    DisponibilidadPersonalMedico: DisponibilidadPersonalMedicoModel,
    Especialidades: EspecialidadesModel,
    EstadisticasDiarias: EstadisticasDiariasModel,
    EstadosCita: EstadosCitaModel,
    LogSistema: LogSistemaModel,
    Mensaje: MensajeModel,
    Municipio: MunicipioModel,
    Paciente: PacienteModel,
    Persona: PersonaModel,
    PersonalMedico: PersonalMedicoModel,
    PrioridadesCita: PrioridadesCitaModel,
    Recordatorio: RecordatorioModel,
    Sexo: SexoModel,
    SignosVitales: SignosVitalesModel,
    SolicitudRol: SolicitudRolModel,
    TiposCita: TiposCitaModel,
    TiposDocumentoIdentidad: TiposDocumentoIdentidadModel,
    Usuario: UsuarioModel
  };
}

export default initModels;
