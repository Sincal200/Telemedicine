import Sequelize from 'sequelize';

const Municipio = (sequelize, DataTypes) => {
  return sequelize.define('Municipio', {
    idMunicipio: {
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
      allowNull: true
    },
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Departamento',
        key: 'idDepartamento'
      }
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
    tableName: 'Municipio',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idMunicipio" },
        ]
      },
      {
        name: "fk_municipio_departamento_idx",
        using: "BTREE",
        fields: [
          { name: "departamento_id" },
        ]
      },
      {
        name: "idx_municipio_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default Municipio;
