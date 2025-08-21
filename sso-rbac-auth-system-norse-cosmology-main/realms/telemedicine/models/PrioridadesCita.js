import Sequelize from 'sequelize';

const PrioridadesCita = (sequelize, DataTypes) => {
  return sequelize.define('PrioridadesCita', {
    idPrioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_prioridad_codigo"
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1=Alta, 2=Media, 3=Baja"
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'PrioridadesCita',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idPrioridad" },
        ]
      },
      {
        name: "uk_prioridad_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
      {
        name: "idx_prioridad_nivel",
        using: "BTREE",
        fields: [
          { name: "nivel" },
        ]
      },
    ]
  });
};

export default PrioridadesCita;
