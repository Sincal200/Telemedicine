import Sequelize from 'sequelize';

const ConfiguracionCentro = (sequelize, DataTypes) => {
  return sequelize.define('ConfiguracionCentro', {
    idConfiguracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nombre_centro: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    ruc: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email_contacto: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    director_medico_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Referencia al personal médico que es director",
      references: {
        model: 'PersonalMedico',
        key: 'idPersonalMedico'
      }
    },
    administrador_sistema_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario administrador principal",
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    horario_atencion: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Horarios por día de la semana"
    },
    especialidades_disponibles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Lista de especialidades que ofrece"
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    sitio_web: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    codigo_establecimiento: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Código MINSA\/DIRIS"
    },
    nivel_atencion: {
      type: DataTypes.ENUM('I-1','I-2','I-3','I-4','II-1','II-2','III-1','III-2'),
      allowNull: true,
      comment: "Nivel según MINSA"
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
    tableName: 'ConfiguracionCentro',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idConfiguracion" },
        ]
      },
      {
        name: "fk_centro_director",
        using: "BTREE",
        fields: [
          { name: "director_medico_id" },
        ]
      },
      {
        name: "fk_centro_administrador",
        using: "BTREE",
        fields: [
          { name: "administrador_sistema_id" },
        ]
      },
    ]
  });
};

export default ConfiguracionCentro;
