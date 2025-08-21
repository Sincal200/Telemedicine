import Sequelize from 'sequelize';

const DiasSemana = (sequelize, DataTypes) => {
  return sequelize.define('DiasSemana', {
    idDiaSemana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: "uk_dia_codigo"
    },
    nombre: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    numero_dia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "uk_dia_numero"
    }
  }, {
    sequelize,
    tableName: 'DiasSemana',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idDiaSemana" },
        ]
      },
      {
        name: "uk_dia_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
      {
        name: "uk_dia_numero",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "numero_dia" },
        ]
      },
    ]
  });
};

export default DiasSemana;
