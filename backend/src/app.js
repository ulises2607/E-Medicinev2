// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Inicializar la aplicación Express
const app = express();

// Middlewares
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(morgan("dev")); // Logging de peticiones HTTP en la consola (modo desarrollo)
app.use(express.json()); // Para parsear cuerpos de petición JSON
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de petición URL-encoded

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "¡Bienvenido a la API de E-medicine v2!" });
});

// Importar y usar las rutas de los módulos.....

// Middleware para manejar errores (simple por ahora)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "¡Algo salió mal!", details: err.message });
});

export default app;
