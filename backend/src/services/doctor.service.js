import { Op } from "sequelize";
import db from "../daos/models/index.js";

class DoctorService {
  async findAllDoctors(queryParams) {
    const { speciality, country, city, name } = queryParams; // Ejemplos de filtros
    const whereClause = {};
    const includeOptions = [
      {
        model: db.Usuario,
        as: "usuario", // Alias definido en la asociación Doctor.belongsTo(Usuario)
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
          "phone_number",
          "photo_url",
          "gender",
          "country",
          "city",
        ], // Selecciona qué atributos del usuario incluir
      },
      // Podrías incluir disponibilidad o certificados si son necesarios para la vista de lista,
      // pero para una lista general, es mejor mantenerla ligera.
      //   { model: db.DisponibilidadDoctor, as: 'disponibilidades' },
      // { model: db.CertificadoProfesional, as: 'certificados' },
    ];

    // Construir la cláusula 'where' para el modelo Doctor (info específica del doctor)
    const doctorWhereClause = {};
    if (speciality) {
      // Usar Op.iLike para búsqueda insensible a mayúsculas/minúsculas y parcial
      doctorWhereClause.speciality = { [Op.iLike]: `%${speciality}%` };
    }
    // Aquí podrían ir más filtros para el modelo Doctor

    // Construir la cláusula 'where' para el modelo Usuario (info general del usuario)
    const userWhereClause = {};
    if (country) {
      userWhereClause.country = { [Op.iLike]: `%${country}%` };
    }
    if (city) {
      userWhereClause.city = { [Op.iLike]: `%${city}%` };
    }
    if (name) {
      // Buscar por nombre o apellido
      userWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${name}%` } },
        { last_name: { [Op.iLike]: `%${name}%` } },
      ];
    }

    if (Object.keys(userWhereClause).length > 0) {
      includeOptions[0].where = userWhereClause; // Aplica el where a la inclusión de Usuario
      // Es importante que si se aplica un where a una inclusión,
      // se ponga `required: true` si quieres que solo se devuelvan doctores
      // cuyo usuario coincida con el filtro. Si no, se devuelven todos los doctores
      // y el usuario es null si no coincide.
      // Si quieres un INNER JOIN implícito:
      // includeOptions[0].required = true;
    }

    try {
      const doctores = await db.Doctor.findAll({
        where: doctorWhereClause, // Filtros aplicados directamente al modelo Doctor
        include: includeOptions,
        attributes: [
          "user_id",
          "speciality",
          "consultation_value",
          "availability_status",
        ], // Atributos a incluiir
        // Para evitar el error de "column doctors.user_id does not exist" si 'underscored: true' no está en el modelo Doctor
        // y se espera 'userId', es mejor no seleccionar atributos específicos del Doctor
        // o asegurarse de que el modelo Doctor tenga 'underscored: true' y los campos correctos.
      });
      return doctores.map((doc) => doc.toJSON()); // Devolver objetos planos
    } catch (error) {
      console.error("Error al buscar doctores:", error);
      throw new Error("Error al obtener la lista de doctores.");
    }
  }

  async findDoctorProfileById(doctorId) {
    try {
      const doctor = await db.Doctor.findByPk(doctorId, {
        // doctorId es el user_id
        include: [
          {
            model: db.Usuario,
            as: "usuario",
            attributes: { exclude: ["password_hash", "confirmation_string"] }, // Excluir campos sensibles
          },
          {
            model: db.CertificadoProfesional,
            as: "certificados", // Alias definido en la asociación Doctor.hasMany(Certificado)
          },
          {
            model: db.DisponibilidadDoctor,
            as: "disponibilidades",
          },
          // Podrías incluir citas si fuera necesario para el perfil del doctor,
          // pero usualmente no para un perfil público.
        ],
      });

      if (!doctor) {
        const error = new Error("Doctor no encontrado.");
        error.statusCode = 404;
        throw error;
      }
      return doctor.toJSON();
    } catch (error) {
      console.error(
        `Error al buscar el perfil del doctor con ID ${doctorId}:`,
        error
      );
      if (error.statusCode) throw error;
      throw new Error("Error al obtener el perfil del doctor.");
    }
  }
}

export default new DoctorService();
