import app from "./app.js";

const PORT = process.env.PORT || 4700;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log(
    `Variables de entorno cargadas: DB_USER=${process.env.DB_USER}, DB_NAME=${process.env.DB_NAME}`
  ); // Verificandooo
});
