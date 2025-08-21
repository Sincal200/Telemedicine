import Sequelize from 'sequelize';

const Mensaje = (sequelize, DataTypes) => {
  return sequelize.define('Mensaje', {
    idMensaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    remitente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    archivo_adjunto: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    fecha_leido: {
      type: DataTypes.DATE,
      allowNull: true
    },
    es_urgente: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Mensaje',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idMensaje" },
        ]
      },
      {
        name: "fk_mensaje_paciente_idx",
        using: "BTREE",
        fields: [
          { name: "paciente_id" },
        ]
      },
      {
        name: "fk_mensaje_personal_idx",
        using: "BTREE",
        fields: [
          { name: "personal_medico_id" },
        ]
      },
      {
        name: "fk_mensaje_remitente_idx",
        using: "BTREE",
        fields: [
          { name: "remitente_id" },
        ]
      },
      {
        name: "idx_mensaje_leido",
        using: "BTREE",
        fields: [
          { name: "leido" },
        ]
      },
      {
        name: "idx_mensaje_urgente",
        using: "BTREE",
        fields: [
          { name: "es_urgente" },
        ]
      },
      {
        name: "idx_mensaje_fecha",
        using: "BTREE",
        fields: [
          { name: "creado" },
        ]
      },
    ]
  });
};

export default Mensaje;
