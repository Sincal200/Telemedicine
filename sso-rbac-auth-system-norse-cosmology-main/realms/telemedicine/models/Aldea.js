import Sequelize from 'sequelize';

const Aldea = (sequelize, DataTypes) => {
  return sequelize.define('Aldea', {
    idAldea: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    municipio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Municipio',
        key: 'idMunicipio'
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
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Aldea',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idAldea" },
        ]
      },
      {
        name: "fk_aldea_municipio_idx",
        using: "BTREE",
        fields: [
          { name: "municipio_id" },
        ]
      },
      {
        name: "idx_aldea_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default Aldea;
