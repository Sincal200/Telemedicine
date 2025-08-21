import Sequelize from 'sequelize';

const Especialidades = (sequelize, DataTypes) => {
  return sequelize.define('Especialidades', {
    idEspecialidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_especialidad_codigo"
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requiere_licencia: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
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
    tableName: 'Especialidades',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idEspecialidad" },
        ]
      },
      {
        name: "uk_especialidad_codigo",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codigo" },
        ]
      },
      {
        name: "idx_especialidad_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
    ]
  });
};

export default Especialidades;
