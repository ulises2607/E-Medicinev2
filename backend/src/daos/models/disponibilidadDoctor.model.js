// src/daos/models/disponibilidadDoctor.model.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";

class DisponibilidadDoctor extends Model {}

DisponibilidadDoctor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctor_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day_of_week: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ),
      allowNull: false,
    },
    start_time_morning: {
      type: DataTypes.TIME, // HH:MM:SS
      allowNull: true,
    },
    end_time_morning: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    start_time_afternoon: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time_afternoon: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DisponibilidadDoctor",
    tableName: "disponibilidad_doctores",
    timestamps: false,
    underscored: true,
    // Para la constraint unique_doctor_day, Sequelize puede manejarla si defines
    // un índice único en las asociaciones o directamente aquí si fuera necesario,
    // pero la constraint de la BD ya lo asegura.
    // indexes: [
    //   {
    //     unique: true,
    //     fields: ['doctor_user_id', 'day_of_week']
    //   }
    // ]
  }
);

export default DisponibilidadDoctor;
