// src/daos/models/paciente.model.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js";
// No necesitamos importar Usuario aquí directamente para la definición del modelo,
// las asociaciones se configuran en el archivo index.js de los modelos.

class Paciente extends Model {}

Paciente.init(
  {
    // La clave primaria de Paciente es también una clave foránea que referencia a Usuario
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    credit_card_token: {
      type: DataTypes.STRING(255),
      allowNull: true, // Un paciente puede no tener un token de tarjeta al inicio
    },
  },
  {
    sequelize,
    modelName: "Paciente", // Nombre singular del modelo
    tableName: "pacientes", // Nombre de la tabla en la base de datos
    timestamps: false, // La tabla 'pacientes' en tu DDL no tiene created_at/updated_at
    // Si los tuviera, pondríamos true y Sequelize los buscaría.
    // Los timestamps principales están en la tabla 'usuarios'.
    underscored: true,
  }
);

export default Paciente;
