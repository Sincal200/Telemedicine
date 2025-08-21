import Sequelize from 'sequelize';

const Direccion = (sequelize, DataTypes) => {
  return sequelize.define('Direccion', {
    idDireccion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    direccion_completa: {
      type: DataTypes.TEXT,
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
    municipio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Municipio',
        key: 'idMunicipio'
      }
    },
    aldea_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Aldea',
        key: 'idAldea'
      }
    },
    zona: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    referencia: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coordenadas_lat: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    coordenadas_lng: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true
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
    tableName: 'Direccion',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idDireccion" },
        ]
      },
      {
        name: "fk_direccion_departamento_idx",
        using: "BTREE",
        fields: [
          { name: "departamento_id" },
        ]
      },
      {
        name: "fk_direccion_municipio_idx",
        using: "BTREE",
        fields: [
          { name: "municipio_id" },
        ]
      },
      {
        name: "fk_direccion_aldea_idx",
        using: "BTREE",
        fields: [
          { name: "aldea_id" },
        ]
      },
      {
        name: "idx_direccion_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default Direccion;
