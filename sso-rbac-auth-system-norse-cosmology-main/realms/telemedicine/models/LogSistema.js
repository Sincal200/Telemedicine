import Sequelize from 'sequelize';

const LogSistema = (sequelize, DataTypes) => {
  return sequelize.define('LogSistema', {
    idLog: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    accion: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'LogSistema',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idLog" },
        ]
      },
      {
        name: "fk_log_usuario_idx",
        using: "BTREE",
        fields: [
          { name: "usuario_id" },
        ]
      },
    ]
  });
};

export default LogSistema;
