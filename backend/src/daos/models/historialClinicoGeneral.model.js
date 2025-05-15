import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";

class HistorialClinicoGeneral extends Model {}

HistorialClinicoGeneral.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patient_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Un paciente solo tiene un historial general
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    height_cm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    smoking_status: {
      type: DataTypes.ENUM("Yes", "No", "Occasionally"),
      allowNull: true,
    },
    alcohol_consumption_status: {
      type: DataTypes.ENUM("Yes", "No", "Occasionally"),
      allowNull: true,
    },
    psychoactive_substances_status: {
      type: DataTypes.ENUM("Yes", "No"),
      allowNull: true,
    },
    other_non_pathological_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "HistorialClinicoGeneral",
    tableName: "historiales_clinicos_generales",
    timestamps: true,
    underscored: true,
  }
);

export default HistorialClinicoGeneral;
