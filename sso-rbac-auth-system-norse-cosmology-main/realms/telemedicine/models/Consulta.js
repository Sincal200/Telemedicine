import Sequelize from 'sequelize';

const Consulta = (sequelize, DataTypes) => {
  return sequelize.define('Consulta', {
    idConsulta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cita_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cita',
        key: 'idCita'
      },
      unique: "fk_consulta_cita"
    },
    diagnostico_principal: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diagnosticos_secundarios: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tratamiento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receta_medica: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    examenes_solicitados: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    proxima_cita_recomendada: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    duracion_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    calificacion_paciente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "1-5 estrellas"
    },
    comentario_paciente: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requiere_seguimiento: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    fecha_seguimiento: {
      type: DataTypes.DATEONLY,
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
    tableName: 'Consulta',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idConsulta" },
        ]
      },
      {
        name: "uk_consulta_cita",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "cita_id" },
        ]
      },
      {
        name: "idx_consulta_calificacion",
        using: "BTREE",
        fields: [
          { name: "calificacion_paciente" },
        ]
      },
      {
        name: "idx_consulta_seguimiento",
        using: "BTREE",
        fields: [
          { name: "requiere_seguimiento" },
        ]
      },
    ]
  });
};

export default Consulta;
