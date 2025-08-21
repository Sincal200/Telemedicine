import Sequelize from 'sequelize';

const Paciente = (sequelize, DataTypes) => {
  return sequelize.define('Paciente', {
    idPaciente: {
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
      unique: "fk_paciente_persona"
    },
    numero_expediente: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tipo_sangre: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    alergias: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    enfermedades_cronicas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medicamentos_actuales: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contacto_emergencia_nombre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contacto_emergencia_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contacto_emergencia_parentesco: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    seguro_medico: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero_seguro: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_primera_consulta: {
      type: DataTypes.DATEONLY,
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
    tableName: 'Paciente',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idPaciente" },
        ]
      },
      {
        name: "uk_paciente_persona",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "persona_id" },
        ]
      },
      {
        name: "uk_paciente_expediente",
        using: "BTREE",
        fields: [
          { name: "numero_expediente" },
        ]
      },
      {
        name: "idx_paciente_activo",
        using: "BTREE",
        fields: [
          { name: "activo" },
        ]
      },
      {
        name: "idx_paciente_tipo_sangre",
        using: "BTREE",
        fields: [
          { name: "tipo_sangre" },
        ]
      },
    ]
  });
};

export default Paciente;
