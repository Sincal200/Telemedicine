import Sequelize from 'sequelize';

const PersonalMedico = (sequelize, DataTypes) => {
  return sequelize.define('PersonalMedico', {
    idPersonalMedico: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    persona_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Persona',
        key: 'idPersona'
      },
      unique: "fk_personal_medico_persona"
    },
    centro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Centro de salud donde trabaja",
      references: {
        model: 'ConfiguracionCentro',
        key: 'idConfiguracion'
      }
    },
    numero_licencia: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    numero_colegiado: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    especialidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Especialidades',
        key: 'idEspecialidad'
      }
    },
    cargo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Doctor, Enfermero, Auxiliar, etc."
    },
    universidad: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    anos_experiencia: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    biografia: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    calificacion_promedio: {
      type: DataTypes.DECIMAL(3,2),
      allowNull: true,
      defaultValue: 0.00
    },
    total_consultas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    },
    verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
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
    tableName: 'PersonalMedico',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idPersonalMedico" },
        ]
      },
      {
        name: "uk_personal_medico_persona",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "persona_id" },
        ]
      },
      {
        name: "uk_personal_medico_licencia",
        using: "BTREE",
        fields: [
          { name: "numero_licencia" },
        ]
      },
      {
        name: "uk_personal_medico_colegiado",
        using: "BTREE",
        fields: [
          { name: "numero_colegiado" },
        ]
      },
      {
        name: "fk_personal_medico_centro_idx",
        using: "BTREE",
        fields: [
          { name: "centro_id" },
        ]
      },
      {
        name: "fk_personal_medico_especialidad_idx",
        using: "BTREE",
        fields: [
          { name: "especialidad_id" },
        ]
      },
      {
        name: "idx_personal_medico_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
      {
        name: "idx_personal_medico_cargo",
        using: "BTREE",
        fields: [
          { name: "cargo" },
        ]
      },
      {
        name: "idx_personal_medico_verificado",
        using: "BTREE",
        fields: [
          { name: "verificado" },
        ]
      },
      {
        name: "idx_personal_medico_calificacion",
        using: "BTREE",
        fields: [
          { name: "calificacion_promedio" },
        ]
      },
    ]
  });
};

export default PersonalMedico;
