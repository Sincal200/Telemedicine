import Sequelize from 'sequelize';

const SignosVitales = (sequelize, DataTypes) => {
  return sequelize.define('SignosVitales', {
    idSignoVital: {
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
    tomado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    tipo_signo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    valor: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    unidad: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fecha_toma: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
          { name: "idSignoVital" },
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
