import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Asegúrate que las variables de entorno estén cargadas

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres", // Muy importante decirle a Sequelize que usamos PostgreSQL
    logging: console.log, // Muestra las queries SQL en la consola (útil para desarrollo)
    // Puedes ponerlo a false o una función de logger personalizada en producción.
    dialectOptions: {
      // Opciones específicas de PostgreSQL si son necesarias
      // ejemplo para SSL:
      // ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    },
    define: {
      // Opciones globales para los modelos
      timestamps: true, // Sequelize manejará created_at y updated_at por defecto
      underscored: true, // Usa snake_case para los nombres de columnas generados automáticamente (ej. user_id)
      // y para las tablas si el nombre del modelo es camelCase.
      // Coincide con nuestra convención de base de datos.
      createdAt: "created_at", // Mapea a nuestras columnas
      updatedAt: "updated_at",
    },
  }
);

// Función para probar la conexión
export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Conexión a PostgreSQL establecida exitosamente con Sequelize."
    );
  } catch (error) {
    console.error(
      "No se pudo conectar a la base de datos con Sequelize:",
      error
    );
    process.exit(1); // Termina la aplicación si no se puede conectar
  }
};

export default sequelize; // Exporta la instancia para usarla en los modelos y DAOs
