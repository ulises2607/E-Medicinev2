// src/daos/models/doctor.model.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js"; // Importamos nuestra instancia de Sequelize

class Doctor extends Model {
  // Aquí podríamos definir métodos de instancia o de clase específicos para Doctor si los necesitamos
}

Doctor.init(
  {
    // La clave del doctor es una clave foránea que hace referencia a Usuario
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      // La referencia a la tabla 'usuarios' se establecerá en las asociaciones
    },
    speciality: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          // Asegura que no sea una cadena vacía
          msg: "La especialidad no puede estar vacía.",
        },
      },
      // Considerar normalizar a una tabla 'especialidades' si la lista es extensa
      // y referenciarla aquí con una clave foránea.
    },
    consultation_value: {
      type: DataTypes.DECIMAL(10, 2), // 10 dígitos en total, 2 para decimales
      allowNull: true, // Puede ser nulo si el doctor no ha definido un valor
      validate: {
        isDecimal: {
          msg: "El valor de la consulta debe ser un número decimal.",
        },
        min: {
          args: [0],
          msg: "El valor de la consulta no puede ser negativo.",
        },
      },
    },
    availability_status: {
      type: DataTypes.ENUM("available", "not_available"), // Coincide con el ENUM de PostgreSQL
      allowNull: false, // Es importante tener un estado definido
      defaultValue: "available", // Valor por defecto al crear un doctor
    },
    id_document_type: {
      // Tipo de documento de identidad
      type: DataTypes.STRING(50),
      allowNull: true, // Puede ser opcional al inicio
    },
    id_document_number: {
      // Número del documento de identidad
      type: DataTypes.STRING(100),
      allowNull: true, // Puede ser opcional al inicio
    },
  },
  {
    // Otras opciones del modelo
    sequelize, // Pasamos la instancia de conexión
    modelName: "Doctor", // Nombre singular del modelo
    tableName: "doctores", // Nombre de la tabla en la base de datos
    timestamps: false, // Cambia a true si la tabla 'doctores' tiene created_at y updated_at
    underscored: true,
  }
);

export default Doctor;
