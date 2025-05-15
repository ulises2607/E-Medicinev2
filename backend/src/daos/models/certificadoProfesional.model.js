// src/daos/models/certificadoProfesional.model.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";

class CertificadoProfesional extends Model {}

CertificadoProfesional.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctor_user_id: {
      // Este es el nombre de la columna en la BD
      type: DataTypes.INTEGER,
      allowNull: false,
      // La referencia a 'doctores' se definirá en las asociaciones
    },
    certificate_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true, // Sequelize puede validar si es una URL
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issued_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // No necesitamos created_at/updated_at aquí si la tabla no los tiene.
    // Si los tuvieran, timestamps: true
  },
  {
    sequelize,
    modelName: "CertificadoProfesional",
    tableName: "certificados_profesionales",
    timestamps: false, // Asumiendo que la tabla SQL no tiene timestamps
    underscored: true,
  }
);

export default CertificadoProfesional;
