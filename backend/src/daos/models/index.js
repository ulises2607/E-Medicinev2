import { Sequelize } from "sequelize";
import sequelize from "../../config/sequelize.js"; // Nuestra instancia de Sequelize
import Usuario from "./usuario.model.js";
import Paciente from "./paciente.model.js";
import Doctor from "./doctor.model.js";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Inicializar modelos
db.Usuario = Usuario;
db.Paciente = Paciente;
db.Doctor = Doctor;

// --- Definición de Asociaciones ---
// Un Usuario TIENE UN Paciente (si su rol es 'patient')
// La clave foránea está en Paciente (user_id)
db.Usuario.hasOne(db.Paciente, {
  foreignKey: "user_id", // El nombre de la columna en la tabla 'pacientes'
  as: "pacienteInfo", // Un alias para acceder a la información del paciente desde un usuario
  // Ejemplo: const user = await Usuario.findByPk(1, { include: 'pacienteInfo' });
  //          console.log(user.pacienteInfo);
  onDelete: "CASCADE", // Coincide con tu DDL
  onUpdate: "CASCADE", // Buena práctica añadirlo también
});
db.Usuario.hasOne(db.Doctor, {
  foreignKey: "user_id",
  as: "doctorInfo",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Un Paciente PERTENECE A UN Usuario
db.Paciente.belongsTo(db.Usuario, {
  foreignKey: "user_id", // El nombre de la columna en la tabla 'pacientes'
  as: "usuario", // Un alias para acceder al usuario desde un paciente
  // Ejemplo: const paciente = await Paciente.findByPk(1, { include: 'usuario' });
  //          console.log(paciente.usuario.email);
});
db.Doctor.belongsTo(db.Usuario, {
  foreignKey: "user_id",
  as: "usuario",
});

export default db;
