import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";

class Cita extends Model {}

Cita.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patient_user_id: {
      // Nombre de la columna en la BD
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_user_id: {
      // Nombre de la columna en la BD
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointment_date: {
      type: DataTypes.DATEONLY, // Solo la fecha
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME, // Solo la hora HH:MM:SS
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "completed", "canceled"),
      allowNull: false,
      defaultValue: "pending",
    },
    video_call_room_id: {
      type: DataTypes.STRING(255),
      allowNull: true, // Puede que se genere después o no aplique
    },
    reason_for_consultation: {
      type: DataTypes.TEXT,
      allowNull: true, // Puede ser opcional o llenarse después
    },
    patient_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    doctor_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      defaultValue: "pending",
      allowNull: false,
    },
    stripe_session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // created_at y updated_at son manejados por Sequelize
  },
  {
    sequelize,
    modelName: "Cita",
    tableName: "citas",
    timestamps: true, // Habilita created_at y updated_at
    underscored: true, // Mapea createdAt a created_at, etc.
  }
);

export default Cita;
