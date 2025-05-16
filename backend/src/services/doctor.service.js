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

  async getDoctorDisponibilidad(doctorId) {
    try {
      const disponibilidades = await db.DisponibilidadDoctor.findAll({
        where: { doctor_user_id: doctorId },
        order: [
          // Ordenar por un orden lógico de días si es necesario
          // Esto es un poco más complejo con ENUMs, podríamos ordenarlo en el frontend
          // o crear una columna numérica para el orden del día en la tabla
          ["day_of_week", "ASC"], // Orden alfabético por ahora
        ],
      });
      return disponibilidades.map((d) => d.toJSON());
    } catch (error) {
      console.error(
        `Error al obtener la disponibilidad del doctor ${doctorId}:`,
        error
      );
      throw new Error("Error al obtener la disponibilidad del doctor.");
    }
  }

  async updateDoctorDisponibilidad(doctorId, disponibilidadesData) {
    // disponibilidadesData se espera que sea un array de objetos, cada uno representando
    // la disponibilidad para un día específico.
    // Ejemplo de disponibilidadesData:
    // [
    //   { day_of_week: 'Monday', start_time_morning: '09:00', end_time_morning: '12:00', start_time_afternoon: '14:00', end_time_afternoon: '18:00' },
    //   { day_of_week: 'Tuesday', start_time_morning: '10:00', end_time_morning: '13:00', start_time_afternoon: null, end_time_afternoon: null },
    //   // ... y así para los días que el doctor quiere configurar.
    //   // Si un día no está en el array, se podría interpretar como que no está disponible ese día.
    // ]

    if (!Array.isArray(disponibilidadesData)) {
      const error = new Error(
        "Los datos de disponibilidad deben ser un array."
      );
      error.statusCode = 400;
      throw error;
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    try {
      // Usar una transacción para asegurar la atomicidad
      const result = await db.sequelize.transaction(async (t) => {
        // 1. Opcional: Eliminar todas las disponibilidades existentes para este doctor.
        // Esto simplifica la lógica: siempre reemplazamos la disponibilidad completa.
        // Si quieres permitir actualizaciones parciales, la lógica sería más compleja.
        await db.DisponibilidadDoctor.destroy({
          where: { doctor_user_id: doctorId },
          transaction: t,
        });

        // 2. Crear las nuevas entradas de disponibilidad
        const nuevasDisponibilidades = [];
        for (const dispo of disponibilidadesData) {
          if (!dispo.day_of_week || !validDays.includes(dispo.day_of_week)) {
            const error = new Error(
              `Día de la semana inválido: ${dispo.day_of_week}`
            );
            error.statusCode = 400;
            throw error; // Esto hará rollback de la transacción
          }

          // Validaciones simples para los tiempos (puedes hacerlas más robustas)
          const times = [
            dispo.start_time_morning,
            dispo.end_time_morning,
            dispo.start_time_afternoon,
            dispo.end_time_afternoon,
          ];
          for (const time of times) {
            if (
              time !== null &&
              time !== undefined &&
              !/^\d{2}:\d{2}(:\d{2})?$/.test(time)
            ) {
              const error = new Error(
                `Formato de hora inválido: ${time}. Usar HH:MM o HH:MM:SS.`
              );
              error.statusCode = 400;
              throw error;
            }
          }
          // Validar que end_time > start_time si ambos están presentes
          if (
            dispo.start_time_morning &&
            dispo.end_time_morning &&
            dispo.start_time_morning >= dispo.end_time_morning
          ) {
            const error = new Error(
              `En ${dispo.day_of_week}, la hora de fin de la mañana debe ser posterior a la de inicio.`
            );
            error.statusCode = 400;
            throw error;
          }
          if (
            dispo.start_time_afternoon &&
            dispo.end_time_afternoon &&
            dispo.start_time_afternoon >= dispo.end_time_afternoon
          ) {
            const error = new Error(
              `En ${dispo.day_of_week}, la hora de fin de la tarde debe ser posterior a la de inicio.`
            );
            error.statusCode = 400;
            throw error;
          }
          // Validar que al menos un slot esté definido si se envía el día
          if (!dispo.start_time_morning && !dispo.start_time_afternoon) {
            // Esto podría ser opcional si el frontend solo envía días con disponibilidad
            // O podrías permitirlo para marcar un día como "no disponible" explícitamente si no se eliminan todas primero.
            // Por ahora, si se envía el día, se espera al menos un turno.
          }

          const nuevaDispo = await db.DisponibilidadDoctor.create(
            {
              doctor_user_id: doctorId,
              day_of_week: dispo.day_of_week,
              start_time_morning: dispo.start_time_morning || null,
              end_time_morning: dispo.end_time_morning || null,
              start_time_afternoon: dispo.start_time_afternoon || null,
              end_time_afternoon: dispo.end_time_afternoon || null,
            },
            { transaction: t }
          );
          nuevasDisponibilidades.push(nuevaDispo);
        }
        return nuevasDisponibilidades;
      });
      return result.map((d) => d.toJSON());
    } catch (error) {
      console.error(
        `Error al actualizar la disponibilidad del doctor ${doctorId}:`,
        error
      );
      if (error.statusCode) throw error;
      throw new Error("Error al actualizar la disponibilidad.");
    }
  }
}

export default new DoctorService();
