import Sequelize from 'sequelize';

const EstadisticasDiarias = (sequelize, DataTypes) => {
  return sequelize.define('EstadisticasDiarias', {
    idEstadistica: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    centro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Centro al que pertenecen las estadísticas",
      references: {
        model: 'ConfiguracionCentro',
        key: 'idConfiguracion'
      }
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_citas_programadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    total_citas_completadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    total_citas_canceladas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    total_consultas_telemedicina: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    total_pacientes_nuevos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    tiempo_promedio_consulta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    especialidad_mas_solicitada: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    hora_pico_inicio: {
      type: DataTypes.TIME,
      allowNull: true
    },
    hora_pico_fin: {
      type: DataTypes.TIME,
      allowNull: true
    },
    creado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'EstadisticasDiarias',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idEstadistica" },
        ]
      },
      {
        name: "uk_estadistica_fecha_centro",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "fecha" },
          { name: "centro_id" },
        ]
      },
      {
        name: "fk_estadistica_centro_idx",
        using: "BTREE",
        fields: [
          { name: "centro_id" },
        ]
      },
      {
        name: "idx_estadistica_creado",
        using: "BTREE",
        fields: [
          { name: "creado" },
        ]
      },
    ]
  });
};

export default EstadisticasDiarias;
