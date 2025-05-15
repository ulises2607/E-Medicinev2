import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";

class RegistroConsulta extends Model {}

RegistroConsulta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Un registro de consulta por cita
    },
    doctor_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patient_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subjective_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    objective_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assessment_notes: {
      // Diagnóstico
      type: DataTypes.TEXT,
      allowNull: true,
    },
    plan_notes: {
      // Tratamiento, indicaciones
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vital_signs: {
      type: DataTypes.JSONB, // Para almacenar un objeto JSON
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "RegistroConsulta",
    tableName: "registros_consulta",
    timestamps: true,
    underscored: true,
  }
);

export default RegistroConsulta;
