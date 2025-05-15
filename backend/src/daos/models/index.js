import { Sequelize } from "sequelize";
import sequelize from "../../config/sequelize.js"; // Nuestra instancia de Sequelize
import Usuario from "./usuario.model.js";
import Paciente from "./paciente.model.js";
import Doctor from "./doctor.model.js";
import CertificadoProfesional from "./certificadoProfesional.model.js";
import DisponibilidadDoctor from "./disponibilidadDoctor.model.js";
import Cita from "./cita.model.js";
import HistorialClinicoGeneral from "./historialClinicoGeneral.model.js";
import RegistroConsulta from "./registroConsulta.model.js";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Inicializar modelos
db.Usuario = Usuario;
db.Paciente = Paciente;
db.Doctor = Doctor;
db.CertificadoProfesional = CertificadoProfesional;
db.DisponibilidadDoctor = DisponibilidadDoctor;
db.Cita = Cita;
db.HistorialClinicoGeneral = HistorialClinicoGeneral;
db.RegistroConsulta = RegistroConsulta;

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

// Doctor <-> CertificadoProfesional (Un Doctor tiene Muchos Certificados)
db.Doctor.hasMany(db.CertificadoProfesional, {
  foreignKey: "doctor_user_id", // Clave foránea en CertificadoProfesional
  as: "certificados",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.CertificadoProfesional.belongsTo(db.Doctor, {
  foreignKey: "doctor_user_id",
  as: "doctor",
});

// Doctor <-> DisponibilidadDoctor (Un Doctor tiene Muchas Disponibilidades, una por día)
db.Doctor.hasMany(db.DisponibilidadDoctor, {
  foreignKey: "doctor_user_id",
  as: "disponibilidades",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.DisponibilidadDoctor.belongsTo(db.Doctor, {
  foreignKey: "doctor_user_id",
  as: "doctor",
});

// Asociaciones para Cita
// Una Cita pertenece a un Paciente
db.Cita.belongsTo(db.Paciente, {
  foreignKey: "patient_user_id",
  as: "paciente",
});
db.Paciente.hasMany(db.Cita, { foreignKey: "patient_user_id", as: "citas" });

// Una Cita pertenece a un Doctor
db.Cita.belongsTo(db.Doctor, { foreignKey: "doctor_user_id", as: "doctor" });
db.Doctor.hasMany(db.Cita, { foreignKey: "doctor_user_id", as: "citas" });

// Asociaciones para HistorialClinicoGeneral
// Un HistorialClinicoGeneral pertenece a un Paciente (Relación 1 a 1)
db.HistorialClinicoGeneral.belongsTo(db.Paciente, {
  foreignKey: "patient_user_id",
  as: "paciente",
});
db.Paciente.hasOne(db.HistorialClinicoGeneral, {
  foreignKey: "patient_user_id",
  as: "historialGeneral",
});

// Asociaciones para RegistroConsulta
// Un RegistroConsulta pertenece a una Cita (Relación 1 a 1)
db.RegistroConsulta.belongsTo(db.Cita, {
  foreignKey: "appointment_id",
  as: "cita",
});
db.Cita.hasOne(db.RegistroConsulta, {
  foreignKey: "appointment_id",
  as: "registroConsulta",
});

// Un RegistroConsulta también pertenece a un Doctor y a un Paciente (para referencia directa si es útil)
db.RegistroConsulta.belongsTo(db.Doctor, {
  foreignKey: "doctor_user_id",
  as: "doctorQueAtendio",
});
db.RegistroConsulta.belongsTo(db.Paciente, {
  foreignKey: "patient_user_id",
  as: "pacienteAtendido",
});

export default db;
