import app from "./app.js";
import { testDbConnection } from "./config/sequelize.js"; // Importa la función de prueba

const PORT = process.env.PORT || 4700;

const startServer = async () => {
  try {
    await testDbConnection(); // Prueba la conexión antes de iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
      console.log(
        `Variables de entorno: DB_USER=${process.env.DB_USER}, DB_NAME=${process.env.DB_NAME}`
      );
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
