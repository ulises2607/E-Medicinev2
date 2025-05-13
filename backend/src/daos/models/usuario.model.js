import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/sequelize.js"; // Importamos nuestra instancia de Sequelize

class Usuario extends Model {
  // Aquí podríamos definir métodos de instancia o de clase si los necesitamos
}

Usuario.init(
  {
    // Los atributos del modelo se definen aquí
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        // Sequelize permite validaciones a nivel de modelo
        isEmail: {
          msg: "Debe ser una dirección de correo electrónico válida.",
        },
        notNull: {
          msg: "El correo electrónico no puede estar vacío.",
        },
      },
    },
    password_hash: {
      // Almacenaremos el hash de la contraseña
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: {
          msg: "El nombre no puede estar vacío.",
        },
        len: {
          args: [2, 100],
          msg: "El nombre debe tener entre 2 y 100 caracteres.",
        },
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: {
          msg: "El apellido no puede estar vacío.",
        },
        len: {
          args: [2, 100],
          msg: "El apellido debe tener entre 2 y 100 caracteres.",
        },
      },
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: true, // Puede ser nulo
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"), // Usamos el tipo ENUM de Sequelize
      allowNull: true, // O false si es obligatorio al crear
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY, // Solo fecha, sin hora
      allowNull: true,
    },
    confirmation_string: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("patient", "doctor", "admin"),
      allowNull: false,
    },
    // created_at y updated_at son manejados automáticamente por Sequelize
    // si definimos timestamps: true en la configuración de Sequelize
    // y nombramos las columnas como created_at y updated_at en la BD.
    // Si usaste otros nombres en la BD (ej. createdAt), debes mapearlos aquí con:
    // createdAt: 'created_at_column_name_in_db',
    // updatedAt: 'updated_at_column_name_in_db',
    // Pero como los llamamos 'created_at' y 'updated_at', y tenemos 'underscored: true',
    // Sequelize debería manejarlos bien.
  },
  {
    // Otras opciones del modelo
    sequelize, // Pasamos la instancia de conexión
    modelName: "Usuario", // Nombre del modelo (singular)
    tableName: "usuarios", // Nombre de la tabla en la base de datos (plural, snake_case)
    timestamps: true, // Habilita created_at y updated_at
    underscored: true, // Para que los nombres de columna generados automáticamente sean snake_case
    // Si no quieres que Sequelize maneje las mayúsculas y minúsculas del nombre de la tabla:
    // freezeTableName: true,
  }
);

export default Usuario;
