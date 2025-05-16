import db from "../daos/models/index.js";

class PacienteService {
  async getHistorialGeneral(pacienteUserId) {
    try {
      // Primero, asegurarnos de que el paciente exista y obtener su perfil de paciente si es necesario.
      // El pacienteUserId es el mismo que el user_id en la tabla usuarios.
      const paciente = await db.Paciente.findOne({
        where: { user_id: pacienteUserId },
      });

      if (!paciente) {
        const error = new Error("Perfil de paciente no encontrado.");
        error.statusCode = 404;
        throw error;
      }

      // Buscar el historial clínico general asociado a este paciente (user_id)
      // La asociación Paciente.hasOne(HistorialClinicoGeneral) usa patient_user_id
      // en la tabla historiales_clinicos_generales
      let historial = await db.HistorialClinicoGeneral.findOne({
        where: { patient_user_id: pacienteUserId },
      });

      // Si no existe, podríamos optar por crearlo vacío o devolver null/vacío.
      // Por ahora, si no existe, el frontend podría mostrar un mensaje para crearlo.
      // Opcionalmente, crearlo aquí si es la primera vez que se accede:
      if (!historial) {
        // Podríamos crearlo aquí o dejar que el PUT lo cree
        // historial = await db.HistorialClinicoGeneral.create({ patient_user_id: pacienteUserId });
        return null; // O un objeto vacío con la estructura esperada
      }

      return historial.toJSON();
    } catch (error) {
      console.error(
        `Error al obtener el historial general del paciente ${pacienteUserId}:`,
        error
      );
      if (error.statusCode) throw error;
      throw new Error("Error al obtener el historial clínico general.");
    }
  }

  async upsertHistorialGeneral(pacienteUserId, dataToUpdate) {
    const {
      occupation,
      height_cm,
      weight_kg,
      smoking_status,
      alcohol_consumption_status,
      psychoactive_substances_status,
      other_non_pathological_history,
    } = dataToUpdate;

    // Validar que al menos algún dato se envíe para actualizar/crear
    if (Object.keys(dataToUpdate).length === 0) {
      const error = new Error(
        "No se proporcionaron datos para actualizar o crear el historial."
      );
      error.statusCode = 400;
      throw error;
    }

    const paciente = await db.Paciente.findByPk(pacienteUserId);
    if (!paciente) {
      const error = new Error("Perfil de paciente no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    try {
      // Intentar encontrar el historial existente o crear uno nuevo si no existe.
      // `findOrCreate` es útil aquí. Busca por patient_user_id.
      // Si lo encuentra, lo actualiza. Si no, lo crea.
      // O podemos usar `upsert` que es más directo para esto.

      // Usaremos upsert: actualiza si existe, o inserta si no existe.
      // El 'returning: true' y 'plain: true' es para que devuelva la instancia actualizada/creada.
      const [historial, created] = await db.HistorialClinicoGeneral.upsert(
        {
          patient_user_id: pacienteUserId, // Clave para buscar o la base para crear
          occupation: occupation !== undefined ? occupation : null,
          height_cm: height_cm !== undefined ? height_cm : null,
          weight_kg: weight_kg !== undefined ? weight_kg : null,
          smoking_status: smoking_status !== undefined ? smoking_status : null,
          alcohol_consumption_status:
            alcohol_consumption_status !== undefined
              ? alcohol_consumption_status
              : null,
          psychoactive_substances_status:
            psychoactive_substances_status !== undefined
              ? psychoactive_substances_status
              : null,
          other_non_pathological_history:
            other_non_pathological_history !== undefined
              ? other_non_pathological_history
              : null,
        },
        {
          where: { patient_user_id: pacienteUserId }, // Condición para la actualización
          returning: true, // Para que devuelva el registro afectado
          // plain: true // Para obtener solo el objeto de datos, no la instancia de Sequelize
        }
      );

      // Upsert devuelve un array [instance, createdBoolean] o solo la instancia dependiendo del dialecto y opciones.
      // Para PostgreSQL con returning: true, 'historial' será la instancia.
      if (!historial) {
        // Doble chequeo por si upsert no devuelve la instancia como se espera
        const error = new Error(
          "No se pudo actualizar o crear el historial clínico general."
        );
        error.statusCode = 500;
        throw error;
      }

      return historial.toJSON(); // `created` indica si fue una inserción (true) o actualización (false)
    } catch (error) {
      console.error(
        `Error al actualizar/crear el historial general del paciente ${pacienteUserId}:`,
        error
      );
      if (error.name === "SequelizeValidationError") {
        const validationError = new Error(
          error.errors.map((e) => e.message).join(", ")
        );
        validationError.statusCode = 400;
        throw validationError;
      }
      if (error.statusCode) throw error;
      throw new Error(
        "Error al actualizar o crear el historial clínico general."
      );
    }
  }
}

export default new PacienteService();
