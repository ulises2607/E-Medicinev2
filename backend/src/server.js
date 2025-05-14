// src/server.js
import app from "./app.js";
import sequelize, { testDbConnection } from "./config/sequelize.js"; // Importa la instancia de sequelize
import db from "./daos/models/index.js"; // Importa nuestros modelos inicializados

const PORT = process.env.PORT || 4700;

const startServer = async () => {
  try {
    await testDbConnection(); // Prueba la conexión

    // Sincronizar modelos con la base de datos (opcional, ya creamos tablas manualmente)
    // En desarrollo, puedes usar { alter: true } para que Sequelize intente ajustar las tablas.
    // En producción, es mejor usar migraciones.
    await sequelize.sync(); // No usar force: true en producción, borra las tablas.
    // O puedes sincronizar un modelo específico:
    // await db.Usuario.sync();
    await db.sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
      console.log(
        `Variables de entorno: DB_USER=${process.env.DB_USER}, DB_NAME=${process.env.DB_NAME}`
      );
    });
  } catch (error) {
    console.error("Error al iniciar el servidor o sincronizar modelos:", error);
    process.exit(1);
  }
};

startServer();
