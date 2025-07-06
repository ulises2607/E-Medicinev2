import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Asegúrate que las variables de entorno estén cargadas

// Configuración para Supabase PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});

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
