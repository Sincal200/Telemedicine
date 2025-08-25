import Sequelize from 'sequelize';

const Cita = (sequelize, DataTypes) => {
  return sequelize.define('Cita', {
    idCita: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    numero_cita: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_cita_numero"
    },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Paciente',
        key: 'idPaciente'
      }
    },
    personal_medico_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PersonalMedico',
        key: 'idPersonalMedico'
      }
    },
    centro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Centro de salud donde se atiende",
      references: {
        model: 'ConfiguracionCentro',
        key: 'idConfiguracion'
      }
    },
    tipo_cita_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TiposCita',
        key: 'idTipoCita'
      }
    },
    estado_cita_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EstadosCita',
        key: 'idEstadoCita'
      }
    },
    prioridad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PrioridadesCita',
        key: 'idPrioridad'
      }
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    motivo_consulta: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sintomas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notas_paciente: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notas_personal: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordatorio_enviado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    es_telemedicina: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    url_videollamada: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "URL completa de la videollamada"
    },
    room_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "ID único de la sala de videollamada"
    },
    token_acceso: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Token de seguridad para la videollamada"
    },
    cancelado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que canceló"
    },
    motivo_cancelacion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    actualizado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Cita',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idCita" },
        ]
      },
      {
        name: "uk_cita_numero",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "numero_cita" },
        ]
      },
      {
        name: "fk_cita_paciente_idx",
        using: "BTREE",
        fields: [
          { name: "paciente_id" },
        ]
      },
      {
        name: "fk_cita_personal_medico_idx",
        using: "BTREE",
        fields: [
          { name: "personal_medico_id" },
        ]
      },
      {
        name: "fk_cita_centro_idx",
        using: "BTREE",
        fields: [
          { name: "centro_id" },
        ]
      },
      {
        name: "fk_cita_tipo_idx",
        using: "BTREE",
        fields: [
          { name: "tipo_cita_id" },
        ]
      },
      {
        name: "fk_cita_estado_idx",
        using: "BTREE",
        fields: [
          { name: "estado_cita_id" },
        ]
      },
      {
        name: "fk_cita_prioridad_idx",
        using: "BTREE",
        fields: [
          { name: "prioridad_id" },
        ]
      },
      {
        name: "idx_cita_fecha",
        using: "BTREE",
        fields: [
          { name: "fecha" },
        ]
      },
      {
        name: "idx_cita_fecha_hora",
        using: "BTREE",
        fields: [
          { name: "fecha" },
          { name: "hora_inicio" },
        ]
      },
      {
        name: "idx_cita_telemedicina",
        using: "BTREE",
        fields: [
          { name: "es_telemedicina" },
        ]
      },
    ]
  });
};

export default Cita;
