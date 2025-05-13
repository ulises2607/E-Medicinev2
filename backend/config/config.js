// backend_nuevo/config/config.js
require("dotenv").config({ path: "../.env" }); // Ajusta la ruta a tu .env si es necesario

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      // Opciones adicionales de PostgreSQL si las necesitas, ej:
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false // Solo si usas SSL y tienes problemas con certificados autofirmados
      // }
    },
  },
  test: {
    // Configuración para entorno de pruebas
    username: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST_TEST,
    port: process.env.DB_PORT_TEST,
    dialect: "postgres",
  },
  production: {
    // Configuración para entorno de producción
    username: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT_PROD,
    dialect: "postgres",
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    },
  },
};
