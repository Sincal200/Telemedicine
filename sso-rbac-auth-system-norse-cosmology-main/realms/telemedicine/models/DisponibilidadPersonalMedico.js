import Sequelize from 'sequelize';

const DisponibilidadPersonalMedico = (sequelize, DataTypes) => {
  return sequelize.define('DisponibilidadPersonalMedico', {
    idDisponibilidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    personal_medico_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PersonalMedico',
        key: 'idPersonalMedico'
      }
    },
    dia_semana_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DiasSemana',
        key: 'idDiaSemana'
      }
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    duracion_consulta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
      comment: "Duración en minutos"
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'DisponibilidadPersonalMedico',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idDisponibilidad" },
        ]
      },
      {
        name: "fk_disponibilidad_personal_idx",
        using: "BTREE",
        fields: [
          { name: "personal_medico_id" },
        ]
      },
      {
        name: "fk_disponibilidad_dia_idx",
        using: "BTREE",
        fields: [
          { name: "dia_semana_id" },
        ]
      },
      {
        name: "idx_disponibilidad_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default DisponibilidadPersonalMedico;
