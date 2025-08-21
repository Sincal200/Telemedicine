import Sequelize from 'sequelize';

const Persona = (sequelize, DataTypes) => {
  return sequelize.define('Persona', {
    idPersona: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    tipo_documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TiposDocumentoIdentidad',
        key: 'idTipoDocumento'
      }
    },
    numero_documento: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    telefono_emergencia: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    sexo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sexo',
        key: 'idSexo'
      }
    },
    direccion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Direccion',
        key: 'idDireccion'
      }
    },
    foto_perfil: {
      type: DataTypes.STRING(255),
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
    },
    actualizado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Persona',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idPersona" },
        ]
      },
      {
        name: "uk_persona_documento",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "tipo_documento_id" },
          { name: "numero_documento" },
        ]
      },
      {
        name: "uk_persona_email",
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "fk_persona_sexo_idx",
        using: "BTREE",
        fields: [
          { name: "sexo_id" },
        ]
      },
      {
        name: "fk_persona_direccion_idx",
        using: "BTREE",
        fields: [
          { name: "direccion_id" },
        ]
      },
      {
        name: "idx_persona_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
      {
        name: "idx_persona_nombres",
        using: "BTREE",
        fields: [
          { name: "nombres" },
        ]
      },
      {
        name: "idx_persona_apellidos",
        using: "BTREE",
        fields: [
          { name: "apellidos" },
        ]
      },
    ]
  });
};

export default Persona;
