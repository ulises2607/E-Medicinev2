import sequelize from "../../config/sequelize.js"; // Nuestra instancia de Sequelize
import Usuario from "./usuario.model.js";

const db = {};

db.sequelize = sequelize;

// Inicializar modelos
db.Usuario = Usuario;

export default db;
