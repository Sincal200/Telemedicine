import Sequelize from 'sequelize';

const Departamento = (sequelize, DataTypes) => {
  return sequelize.define('Departamento', {
    idDepartamento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: "uk_departamento_codigo"
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
    tableName: 'Departamento',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idDepartamento" },
        ]
      },
      {
        name: "uk_departamento_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
      {
        name: "idx_departamento_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default Departamento;
