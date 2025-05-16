import { Op } from "sequelize";
import db from "../daos/models/index.js";
import {
  format,
  parse,
  getDay,
  addMinutes,
  isEqual,
  isBefore,
  isAfter,
} from "date-fns"; // Necesitaremos date-fns

// Helper para obtener el nombre del día en inglés a partir de una fecha
const getDayName = (date) => {
  // getDay() devuelve 0 para Domingo, 1 para Lunes, etc.
  const dayIndex = getDay(date);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex];
};

class CitaService {
  async agendarCita(pacienteId, citaData) {
    const {
      doctorId, // user_id del doctor
      appointmentDate, // YYYY-MM-DD
      startTime, // HH:MM (o HH:MM:SS)
      endTime, // HH:MM (o HH:MM:SS)
      reasonForConsultation,
      // paymentStatus y stripeSessionId se manejarían después o por defecto
    } = citaData;

    // 1. Validaciones básicas de entrada
    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      const error = new Error(
        "Faltan campos obligatorios: doctorId, appointmentDate, startTime, endTime."
      );
      error.statusCode = 400;
      throw error;
    }

    const appointmentDateObj = parse(appointmentDate, "yyyy-MM-dd", new Date());
    const requestedStartTimeObj = parse(
      `${appointmentDate} ${startTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );
    const requestedEndTimeObj = parse(
      `${appointmentDate} ${endTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );

    if (
      isBefore(requestedEndTimeObj, requestedStartTimeObj) ||
      isEqual(requestedEndTimeObj, requestedStartTimeObj)
    ) {
      const error = new Error(
        "La hora de fin debe ser posterior a la hora de inicio."
      );
      error.statusCode = 400;
      throw error;
    }

    // TODO: Considerar la duración de la cita (ej. 30 min, 1 hora) en lugar de endTime si es fijo.
    // Por ahora, asumimos que el frontend envía un endTime.

    // 2. Verificar que el doctor exista y esté activo (si tienes un campo 'activo' en Doctor/Usuario)
    const doctor = await db.Doctor.findByPk(doctorId, {
      include: [{ model: db.Usuario, as: "usuario" }],
    });
    if (!doctor || !doctor.usuario) {
      // Asumiendo que un doctor debe tener un usuario asociado
      const error = new Error("Doctor no encontrado.");
      error.statusCode = 404;
      throw error;
    }
    if (
      doctor.availability_status === "not_available" ||
      doctor.usuario.confirmed === false
    ) {
      // Ejemplo
      const error = new Error(
        "El doctor no está disponible actualmente o no ha confirmado su cuenta."
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Verificar la disponibilidad general del doctor para ese día de la semana y horario
    const dayOfWeek = getDayName(appointmentDateObj); // 'Monday', 'Tuesday', etc.
    const disponibilidadDoctor = await db.DisponibilidadDoctor.findOne({
      where: {
        doctor_user_id: doctorId,
        day_of_week: dayOfWeek,
      },
    });

    if (!disponibilidadDoctor) {
      const error = new Error(
        `El doctor no está disponible el día ${dayOfWeek}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Convertir horas de string (HH:MM:SS) a objetos Date para comparación (solo parte de hora)
    // Se usa una fecha base (hoy) solo para poder parsear la hora, no se usa la fecha en sí.
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const reqStartTimeComparable = parse(
      `${todayStr} ${startTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );
    const reqEndTimeComparable = parse(
      `${todayStr} ${endTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );

    let slotDisponible = false;
    if (
      disponibilidadDoctor.start_time_morning &&
      disponibilidadDoctor.end_time_morning
    ) {
      const dispoStartMorning = parse(
        `${todayStr} ${disponibilidadDoctor.start_time_morning}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );
      const dispoEndMorning = parse(
        `${todayStr} ${disponibilidadDoctor.end_time_morning}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );
      if (
        (isEqual(reqStartTimeComparable, dispoStartMorning) ||
          isAfter(reqStartTimeComparable, dispoStartMorning)) &&
        (isEqual(reqEndTimeComparable, dispoEndMorning) ||
          isBefore(reqEndTimeComparable, dispoEndMorning))
      ) {
        slotDisponible = true;
      }
    }

    if (
      !slotDisponible &&
      disponibilidadDoctor.start_time_afternoon &&
      disponibilidadDoctor.end_time_afternoon
    ) {
      const dispoStartAfternoon = parse(
        `${todayStr} ${disponibilidadDoctor.start_time_afternoon}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );
      const dispoEndAfternoon = parse(
        `${todayStr} ${disponibilidadDoctor.end_time_afternoon}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );
      if (
        (isEqual(reqStartTimeComparable, dispoStartAfternoon) ||
          isAfter(reqStartTimeComparable, dispoStartAfternoon)) &&
        (isEqual(reqEndTimeComparable, dispoEndAfternoon) ||
          isBefore(reqEndTimeComparable, dispoEndAfternoon))
      ) {
        slotDisponible = true;
      }
    }

    if (!slotDisponible) {
      const error = new Error(
        `El horario solicitado (${startTime} - ${endTime}) no está dentro de la disponibilidad del doctor para ${dayOfWeek}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Verificar si ya existe una cita para ese doctor en ese rango de tiempo (evitar solapamientos)
    const existingAppointment = await db.Cita.findOne({
      where: {
        doctor_user_id: doctorId,
        appointment_date: appointmentDate,
        status: { [Op.notIn]: ["canceled"] }, // No considerar citas canceladas
        [Op.or]: [
          // Nueva cita empieza durante una existente
          {
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime },
          },
          // Nueva cita termina durante una existente (ya cubierto arriba)
          // Nueva cita contiene completamente una existente
          // { start_time: { [Op.gte]: startTime }, end_time: { [Op.lte]: endTime } } // No, esto es al revés
        ],
      },
    });

    if (existingAppointment) {
      const error = new Error(
        "El doctor ya tiene una cita agendada en el horario seleccionado."
      );
      error.statusCode = 409; // Conflict
      throw error;
    }

    // 5. (Opcional) Verificar si el paciente ya tiene una cita en ese horario con otro doctor
    const patientExistingAppointment = await db.Cita.findOne({
      where: {
        patient_user_id: pacienteId,
        appointment_date: appointmentDate,
        status: { [Op.notIn]: ["canceled"] },
        [Op.or]: [
          {
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime },
          },
        ],
      },
    });
    if (patientExistingAppointment) {
      const error = new Error(
        "Ya tienes otra cita agendada en ese mismo horario."
      );
      error.statusCode = 409;
      throw error;
    }

    // 6. Crear la cita
    try {
      const nuevaCita = await db.Cita.create({
        patient_user_id: pacienteId,
        doctor_user_id: doctorId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        reason_for_consultation: reasonForConsultation,
        status: "pending", // O 'confirmed' si no hay un paso de confirmación por el doctor/pago
        payment_status: "pending", // Asumimos pendiente hasta que se procese el pago
      });
      return nuevaCita.toJSON();
    } catch (error) {
      console.error("Error al crear la cita en la base de datos:", error);
      if (error.name === "SequelizeValidationError") {
        const validationError = new Error(
          error.errors.map((e) => e.message).join(", ")
        );
        validationError.statusCode = 400;
        throw validationError;
      }
      throw new Error("No se pudo agendar la cita.");
    }
  }

  // Tu método getCitasPorDoctor se modificaría de forma similar para aceptar 'date' y múltiples 'status'
  async getCitasPorPaciente(pacienteId, queryParams) {
    const {
      status, // Puede ser "pending,confirmed"
      date, // Fecha específica "YYYY-MM-DD"
      date_from,
      date_to,
      limit,
      sort_by = "appointment_date", // Campo por defecto para ordenar
      order = "ASC", // Dirección por defecto
    } = queryParams;

    console.log("Lo que llega de la peticion de cita: ", queryParams);

    const whereClause = { patient_user_id: pacienteId };

    // Manejo del filtro de 'status' para múltiples valores
    if (status) {
      const statusArray = status
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "undefined" && s !== "null");
      if (statusArray.length > 0) {
        whereClause.status = { [Op.in]: statusArray };
      }
    }

    // Manejo del filtro de 'date' (fecha específica)
    // Si se proporciona 'date', tiene prioridad sobre 'date_from' y 'date_to'
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Validación simple de formato
        const error = new Error(
          'Formato de fecha inválido para el parámetro "date". Usar YYYY-MM-DD.'
        );
        error.statusCode = 400;
        throw error;
      }
      whereClause.appointment_date = date;
    } else {
      // Manejo del rango de fechas si no se proporciona una fecha específica
      if (date_from) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date_from)) {
          const error = new Error(
            'Formato de fecha inválido para "date_from". Usar YYYY-MM-DD.'
          );
          error.statusCode = 400;
          throw error;
        }
        whereClause.appointment_date = {
          ...(whereClause.appointment_date || {}),
          [Op.gte]: date_from,
        };
      }
      if (date_to) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date_to)) {
          const error = new Error(
            'Formato de fecha inválido para "date_to". Usar YYYY-MM-DD.'
          );
          error.statusCode = 400;
          throw error;
        }
        whereClause.appointment_date = {
          ...(whereClause.appointment_date || {}),
          [Op.lte]: date_to,
        };
      }
    }

    const findOptions = {
      where: whereClause,
      include: [
        {
          model: db.Doctor,
          as: "doctor", // Debe coincidir con el alias en models/index.js
          include: [
            {
              model: db.Usuario,
              as: "usuario", // Debe coincidir con el alias en models/index.js
              attributes: [
                "id",
                "first_name",
                "last_name",
                "photo_url",
                "email",
              ],
            },
          ],
        },
        {
          model: db.RegistroConsulta,
          as: "registroConsulta", // Debe coincidir con el alias
          required: false, // LEFT JOIN para no excluir citas sin registro aún
        },
      ],
      order: [[sort_by, order.toUpperCase() === "DESC" ? "DESC" : "ASC"]],
    };

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        findOptions.limit = parsedLimit;
      }
    }

    try {
      const citas = await db.Cita.findAll(findOptions);
      return citas.map((c) => c.toJSON());
    } catch (error) {
      console.error(
        `Error al obtener las citas del paciente ${pacienteId} con filtros ${JSON.stringify(
          queryParams
        )}:`,
        error
      );
      if (error.statusCode) throw error; // Si ya es un CustomError, relánzalo
      throw new Error("Error al obtener las citas del paciente.");
    }
  }

  // Deberías aplicar una lógica similar a getCitasPorDoctor si también necesitas estos filtros allí
  async getCitasPorDoctor(doctorId, queryParams) {
    const {
      status,
      date,
      date_from,
      date_to,
      limit,
      sort_by = "appointment_date",
      order = "ASC",
    } = queryParams;
    const whereClause = { doctor_user_id: doctorId };

    if (status) {
      const statusArray = status
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "undefined" && s !== "null");
      if (statusArray.length > 0) {
        whereClause.status = { [Op.in]: statusArray };
      }
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const error = new Error(
          'Formato de fecha inválido para "date". Usar YYYY-MM-DD.'
        );
        error.statusCode = 400;
        throw error;
      }
      whereClause.appointment_date = date;
    } else {
      if (date_from) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date_from)) {
          const error = new Error(
            'Formato de fecha inválido para "date_from". Usar YYYY-MM-DD.'
          );
          error.statusCode = 400;
          throw error;
        }
        whereClause.appointment_date = {
          ...(whereClause.appointment_date || {}),
          [Op.gte]: date_from,
        };
      }
      if (date_to) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date_to)) {
          const error = new Error(
            'Formato de fecha inválido para "date_to". Usar YYYY-MM-DD.'
          );
          error.statusCode = 400;
          throw error;
        }
        whereClause.appointment_date = {
          ...(whereClause.appointment_date || {}),
          [Op.lte]: date_to,
        };
      }
    }

    const findOptions = {
      where: whereClause,
      include: [
        {
          model: db.Paciente,
          as: "paciente", // Debe coincidir con el alias
          include: [
            {
              model: db.Usuario,
              as: "usuario", // Debe coincidir con el alias
              attributes: [
                "id",
                "first_name",
                "last_name",
                "photo_url",
                "email",
              ],
            },
          ],
        },
        {
          model: db.RegistroConsulta,
          as: "registroConsulta", // Debe coincidir con el alias
          required: false,
        },
      ],
      order: [[sort_by, order.toUpperCase() === "DESC" ? "DESC" : "ASC"]],
    };

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        findOptions.limit = parsedLimit;
      }
    }

    try {
      const citas = await db.Cita.findAll(findOptions);
      return citas.map((c) => c.toJSON());
    } catch (error) {
      console.error(
        `Error al obtener las citas del doctor ${doctorId} con filtros ${JSON.stringify(
          queryParams
        )}:`,
        error
      );
      if (error.statusCode) throw error;
      throw new Error("Error al obtener las citas del doctor.");
    }
  }

  async getCitaById(citaId, userId, userRole) {
    try {
      const cita = await db.Cita.findByPk(citaId, {
        include: [
          {
            model: db.Doctor,
            as: "doctor",
            include: [
              {
                model: db.Usuario,
                as: "usuario",
                attributes: [
                  "id",
                  "first_name",
                  "last_name",
                  "photo_url",
                  "email",
                ],
              },
            ],
          },
          {
            model: db.Paciente,
            as: "paciente",
            include: [
              {
                model: db.Usuario,
                as: "usuario",
                attributes: [
                  "id",
                  "first_name",
                  "last_name",
                  "photo_url",
                  "email",
                ],
              },
            ],
          },
          { model: db.RegistroConsulta, as: "registroConsulta" },
        ],
      });

      if (!cita) {
        const error = new Error("Cita no encontrada.");
        error.statusCode = 404;
        throw error;
      }

      // Verificar permisos: solo el paciente de la cita, el doctor de la cita o un admin pueden verla
      if (
        userRole !== "admin" &&
        cita.patient_user_id !== userId &&
        cita.doctor_user_id !== userId
      ) {
        const error = new Error("No tienes permiso para ver esta cita.");
        error.statusCode = 403; // Forbidden
        throw error;
      }

      return cita.toJSON();
    } catch (error) {
      console.error(`Error al obtener la cita ${citaId}:`, error);
      if (error.statusCode) throw error;
      throw new Error("Error al obtener la cita.");
    }
  }

  async updateStatusCita(citaId, newStatus, userId, userRole) {
    // userId y userRole son para verificar permisos
    // newStatus podría ser 'confirmed', 'canceled', 'completed'
    const allowedStatusUpdates = {
      patient: ["canceled"],
      doctor: ["confirmed", "canceled", "completed"],
      admin: ["pending", "confirmed", "canceled", "completed"], // Admin puede cambiar a cualquier estado
    };

    if (
      !allowedStatusUpdates[userRole] ||
      !allowedStatusUpdates[userRole].includes(newStatus)
    ) {
      const error = new Error(
        `El rol '${userRole}' no puede cambiar el estado de la cita a '${newStatus}'.`
      );
      error.statusCode = 403;
      throw error;
    }

    try {
      const cita = await db.Cita.findByPk(citaId);
      if (!cita) {
        const error = new Error("Cita no encontrada.");
        error.statusCode = 404;
        throw error;
      }

      // Lógica de permisos específica
      if (userRole === "patient" && cita.patient_user_id !== userId) {
        const error = new Error("No puedes modificar una cita que no es tuya.");
        error.statusCode = 403;
        throw error;
      }
      if (userRole === "doctor" && cita.doctor_user_id !== userId) {
        const error = new Error("No puedes modificar una cita que no es tuya.");
        error.statusCode = 403;
        throw error;
      }

      // Lógica de transición de estados (ej. no se puede cancelar una cita completada)
      if (cita.status === "completed" && newStatus === "canceled") {
        const error = new Error(
          "No se puede cancelar una cita que ya fue completada."
        );
        error.statusCode = 400;
        throw error;
      }
      // ... más reglas de negocio sobre transiciones de estado ...

      cita.status = newStatus;
      // Si se cancela, podrías querer añadir una nota o razón de cancelación
      // if (newStatus === 'canceled' && cancellationReason) {
      //     cita.doctor_notes = cita.doctor_notes ? `${cita.doctor_notes}\nCancelada: ${cancellationReason}` : `Cancelada: ${cancellationReason}`;
      // }
      await cita.save();
      return cita.toJSON();
    } catch (error) {
      console.error(
        `Error al actualizar el estado de la cita ${citaId}:`,
        error
      );
      if (error.statusCode) throw error;
      throw new Error("Error al actualizar el estado de la cita.");
    }
  }
}

export default new CitaService();
