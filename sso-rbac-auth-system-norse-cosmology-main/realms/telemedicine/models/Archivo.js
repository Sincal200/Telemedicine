import Sequelize from 'sequelize';

const Archivo = (sequelize, DataTypes) => {
  return sequelize.define('Archivo', {
    idArchivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Paciente',
        key: 'idPaciente'
      }
    },
    consulta_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Consulta',
        key: 'idConsulta'
      }
    },
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    tipo_archivo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Receta, Examen, Imagen, etc."
    },
    'tama\u00f1o_bytes': {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'idUsuario'
      }
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'Archivo',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idArchivo" },
        ]
      },
      {
        name: "fk_archivo_paciente_idx",
        using: "BTREE",
        fields: [
          { name: "paciente_id" },
        ]
      },
      {
        name: "fk_archivo_consulta_idx",
        using: "BTREE",
        fields: [
          { name: "consulta_id" },
        ]
      },
      {
        name: "fk_archivo_creado_por_idx",
        using: "BTREE",
        fields: [
          { name: "creado_por" },
        ]
      },
      {
        name: "idx_archivo_tipo",
        using: "BTREE",
        fields: [
          { name: "tipo_archivo" },
        ]
      },
    ]
  });
};

export default Archivo;
