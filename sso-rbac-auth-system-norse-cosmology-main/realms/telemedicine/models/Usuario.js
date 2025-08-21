import Sequelize from 'sequelize';

const Usuario = (sequelize, DataTypes) => {
  return sequelize.define('Usuario', {
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    keycloak_user_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "ID del usuario en Keycloak",
      unique: "uk_usuario_keycloak"
    },
    persona_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Persona',
        key: 'idPersona'
      },
      unique: "fk_usuario_persona"
    },
    roles_asignados: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Roles actuales en Keycloak (JSON o CSV)"
    },
    estado_aprobacion: {
      type: DataTypes.ENUM('pendiente','aprobado','rechazado'),
      allowNull: true,
      defaultValue: "pendiente",
      comment: "Estado de aprobación del admin"
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
    },
    actualizado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Usuario',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idUsuario" },
        ]
      },
      {
        name: "uk_usuario_persona",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "persona_id" },
        ]
      },
      {
        name: "uk_usuario_keycloak",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "keycloak_user_id" },
        ]
      },
      {
        name: "idx_usuario_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
      {
        name: "idx_usuario_estado",
        using: "BTREE",
        fields: [
          { name: "estado_aprobacion" },
        ]
      },
    ]
  });
};

export default Usuario;
