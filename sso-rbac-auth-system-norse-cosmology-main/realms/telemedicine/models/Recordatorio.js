import Sequelize from 'sequelize';

const Recordatorio = (sequelize, DataTypes) => {
  return sequelize.define('Recordatorio', {
    idRecordatorio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fecha_recordatorio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Recordatorio',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idRecordatorio" },
        ]
      },
      {
        name: "fk_recordatorio_usuario_idx",
        using: "BTREE",
        fields: [
          { name: "usuario_id" },
        ]
      },
      {
        name: "idx_recordatorio_fecha",
        using: "BTREE",
        fields: [
          { name: "fecha_recordatorio" },
        ]
      },
      {
        name: "idx_recordatorio_completado",
        using: "BTREE",
        fields: [
          { name: "completado" },
        ]
      },
    ]
  });
};

export default Recordatorio;
