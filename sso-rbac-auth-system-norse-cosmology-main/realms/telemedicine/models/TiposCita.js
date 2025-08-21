import Sequelize from 'sequelize';

const TiposCita = (sequelize, DataTypes) => {
  return sequelize.define('TiposCita', {
    idTipoCita: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_tipo_cita_codigo"
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duracion_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },
    requiere_preparacion: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    instrucciones_preparacion: {
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
    tableName: 'TiposCita',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idTipoCita" },
        ]
      },
      {
        name: "uk_tipo_cita_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
      {
        name: "idx_tipo_cita_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default TiposCita;
