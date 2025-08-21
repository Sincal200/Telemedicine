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
      allowNull: true,
      references: {
        model: 'PrioridadesCita',
        key: 'idPrioridad'
      }
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creado: {
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
