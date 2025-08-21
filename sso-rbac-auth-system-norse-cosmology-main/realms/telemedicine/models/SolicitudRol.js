import Sequelize from 'sequelize';

const SolicitudRol = (sequelize, DataTypes) => {
  return sequelize.define('SolicitudRol', {
    idSolicitud: {
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
    tipo_rol_solicitado: {
      type: DataTypes.ENUM('paciente','personal_medico','administrador','enfermero','recepcionista'),
      allowNull: false
    },
    datos_adicionales: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Especialidad, número de colegiatura, etc."
    },
    justificacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Por qué solicita este rol"
    },
    documentos_adjuntos: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "IDs de archivos adjuntos"
    },
    estado: {
      type: DataTypes.ENUM('pendiente','en_revision','aprobado','rechazado'),
      allowNull: true,
      defaultValue: "pendiente"
    },
    revisado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Admin que revisó",
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    comentarios_revision: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_revision: {
      type: DataTypes.DATE,
      allowNull: true
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'SolicitudRol',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idSolicitud" },
        ]
      },
      {
        name: "fk_solicitud_usuario_idx",
        using: "BTREE",
        fields: [
          { name: "usuario_id" },
        ]
      },
      {
        name: "fk_solicitud_revisado_por_idx",
        using: "BTREE",
        fields: [
          { name: "revisado_por" },
        ]
      },
      {
        name: "idx_solicitud_estado",
        using: "BTREE",
        fields: [
          { name: "estado" },
        ]
      },
      {
        name: "idx_solicitud_tipo",
        using: "BTREE",
        fields: [
          { name: "tipo_rol_solicitado" },
        ]
      },
    ]
  });
};

export default SolicitudRol;
