import Sequelize from 'sequelize';

const SignosVitales = (sequelize, DataTypes) => {
  return sequelize.define('SignosVitales', {
    idSignosVitales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    consulta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Consulta',
        key: 'idConsulta'
      }
    },
    presion_sistolica: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    presion_diastolica: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    frecuencia_cardiaca: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    temperatura: {
      type: DataTypes.DECIMAL(4,2),
      allowNull: true
    },
    peso: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    altura: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    imc: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    oximetria: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    glucosa: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    frecuencia_respiratoria: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    circunferencia_abdominal: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tomado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'SignosVitales',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idSignosVitales" },
        ]
      },
      {
        name: "fk_signos_consulta_idx",
        using: "BTREE",
        fields: [
          { name: "consulta_id" },
        ]
      },
      {
        name: "fk_signos_tomado_por_idx",
        using: "BTREE",
        fields: [
          { name: "tomado_por" },
        ]
      },
    ]
  });
};

export default SignosVitales;
