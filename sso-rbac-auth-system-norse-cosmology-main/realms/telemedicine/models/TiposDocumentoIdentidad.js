import Sequelize from 'sequelize';

const TiposDocumentoIdentidad = (sequelize, DataTypes) => {
  return sequelize.define('TiposDocumentoIdentidad', {
    idTipoDocumento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: "uk_tipo_doc_codigo"
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'TiposDocumentoIdentidad',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idTipoDocumento" },
        ]
      },
      {
        name: "uk_tipo_doc_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
    ]
  });
};

export default TiposDocumentoIdentidad;
