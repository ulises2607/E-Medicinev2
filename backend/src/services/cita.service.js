import { Op } from "sequelize";
import db from "../daos/models/index.js";
import { fail, positiveId } from "../utils/errors.js";
import {
  validDate,
  minutes,
  timeString,
  dayOfWeek,
  intervals,
  isFuture,
  nowLocal,
  overlaps,
  SLOT_MINUTES,
  TIME_ZONE,
} from "../utils/schedule.js";

const userAttributes = ["id", "first_name", "last_name"];
const includes = [
  {
    model: db.Doctor,
    as: "doctor",
    attributes: ["user_id", "speciality"],
    include: [{ model: db.Usuario, as: "usuario", attributes: userAttributes }],
  },
  {
    model: db.Paciente,
    as: "paciente",
    attributes: ["user_id"],
    include: [{ model: db.Usuario, as: "usuario", attributes: userAttributes }],
  },
];
const active = { [Op.in]: ["pending", "confirmed"] };
const canManage = (cita, userId, role) => {
  if (
    !(
      (role === "patient" && cita.patient_user_id === userId) ||
      (role === "doctor" && cita.doctor_user_id === userId)
    )
  )
    fail(403, "No tenés acceso a este turno.");
};

// Every booking, reschedule and availability edit takes these same row locks.
// This serializes competing reservations across API instances, including a patient's other doctors.
export async function lockUsers(ids, transaction) {
  await db.Usuario.findAll({
    where: { id: { [Op.in]: [...new Set(ids)].sort((a, b) => a - b) } },
    attributes: ["id"],
    order: [["id", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}
async function busyAppointments(
  doctorId,
  patientId,
  date,
  transaction,
  excludeId,
) {
  return db.Cita.findAll({
    where: {
      appointment_date: date,
      status: { [Op.ne]: "canceled" },
      [Op.or]: [
        { doctor_user_id: doctorId },
        ...(patientId ? [{ patient_user_id: patientId }] : []),
      ],
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    transaction,
  });
}
async function scheduleFor(doctorId, date, transaction) {
  const doctor = await db.Doctor.findByPk(doctorId, { transaction });
  if (!doctor) fail(404, "Profesional no encontrado.");
  if (doctor.availability_status !== "available")
    fail(409, "Este profesional no acepta nuevos turnos.");
  return db.DisponibilidadDoctor.findOne({
    where: { doctor_user_id: doctorId, day_of_week: dayOfWeek(date) },
    transaction,
  });
}
async function validateSlot(doctorId, patientId, data, transaction, excludeId) {
  const date = validDate(data.appointmentDate);
  const start = minutes(data.startTime),
    end = data.endTime ? minutes(data.endTime) : start + SLOT_MINUTES;
  if (end - start !== SLOT_MINUTES || end >= 1440)
    fail(400, "Los turnos duran 30 minutos y deben finalizar en el mismo día.");
  if (!isFuture(date, timeString(start))) fail(400, "Elegí un horario futuro.");
  const schedule = await scheduleFor(doctorId, date, transaction);
  if (
    !intervals(schedule).some(
      ([from, to]) =>
        start >= from && end <= to && (start - from) % SLOT_MINUTES === 0,
    )
  )
    fail(409, "El horario no está disponible en la agenda del profesional.");
  const busy = await busyAppointments(
    doctorId,
    patientId,
    date,
    transaction,
    excludeId,
  );
  if (busy.some((c) => overlaps(start, end, c.start_time, c.end_time)))
    fail(
      409,
      "El horario ya está ocupado por un turno tuyo o del profesional. Elegí otro.",
    );
  return {
    appointment_date: date,
    start_time: timeString(start),
    end_time: timeString(end),
  };
}

class CitaService {
  async getSlots(doctorId, date, user, excludeId) {
    doctorId = positiveId(doctorId);
    date = validDate(date);
    let patientId = user.role === "patient" ? user.id : null;
    if (excludeId) {
      const appointment = await this.getCitaById(excludeId, user.id, user.role);
      if (appointment.doctor_user_id !== doctorId)
        fail(400, "El profesional no coincide con el turno.");
      patientId = appointment.patient_user_id;
      excludeId = appointment.id;
    }
    const schedule = await scheduleFor(doctorId, date);
    const busy = await busyAppointments(
      doctorId,
      patientId,
      date,
      undefined,
      excludeId,
    );
    const slots = [];
    for (const [from, to] of intervals(schedule)) {
      for (
        let start = from;
        start + SLOT_MINUTES <= to;
        start += SLOT_MINUTES
      ) {
        const end = start + SLOT_MINUTES;
        if (
          isFuture(date, timeString(start)) &&
          !busy.some((c) => overlaps(start, end, c.start_time, c.end_time))
        ) {
          slots.push({
            startTime: timeString(start),
            endTime: timeString(end),
          });
        }
      }
    }
    return { date, timeZone: TIME_ZONE, slotMinutes: SLOT_MINUTES, slots };
  }

  async agendarCita(patientId, data) {
    const doctorId = positiveId(data.doctorId);
    const reason = data.reasonForConsultation;
    if (
      typeof reason !== "string" ||
      reason.trim().length < 3 ||
      reason.trim().length > 1000
    )
      fail(400, "El motivo debe tener entre 3 y 1000 caracteres.");
    const id = await db.sequelize.transaction(async (transaction) => {
      await lockUsers([doctorId, patientId], transaction);
      const slot = await validateSlot(doctorId, patientId, data, transaction);
      const cita = await db.Cita.create(
        {
          ...slot,
          patient_user_id: patientId,
          doctor_user_id: doctorId,
          reason_for_consultation: reason.trim(),
          status: "pending",
          payment_status: "pending",
        },
        { transaction },
      );
      return cita.id;
    });
    return this.getCitaById(id, patientId, "patient");
  }

  async listFor(userId, role, query = {}) {
    const where = {
      [role === "patient" ? "patient_user_id" : "doctor_user_id"]: userId,
    };
    if (query.status) {
      if (typeof query.status !== "string")
        fail(400, "Filtro de estado inválido.");
      const status = query.status.split(",");
      if (
        status.some(
          (s) => !["pending", "confirmed", "completed", "canceled"].includes(s),
        )
      )
        fail(400, "Estado inválido.");
      where.status = { [Op.in]: status };
    }
    if (query.date) where.appointment_date = validDate(query.date);
    else if (query.date_from || query.date_to) {
      where.appointment_date = {
        ...(query.date_from ? { [Op.gte]: validDate(query.date_from) } : {}),
        ...(query.date_to ? { [Op.lte]: validDate(query.date_to) } : {}),
      };
      if (query.date_from && query.date_to && query.date_from > query.date_to)
        fail(400, "El rango de fechas es inválido.");
    }
    const sortBy = query.sort_by || "appointment_date";
    if (!["appointment_date", "start_time", "id"].includes(sortBy))
      fail(400, "Orden inválido.");
    const order = query.order === "DESC" ? "DESC" : "ASC";
    const limit = query.limit ? positiveId(query.limit) : 200;
    if (limit > 500) fail(400, "El límite máximo es 500.");
    return db.Cita.findAll({
      where,
      include: includes,
      order: [
        [sortBy, order],
        ["start_time", order],
        ["id", order],
      ],
      limit,
    });
  }
  getCitasPorPaciente(id, query) {
    return this.listFor(id, "patient", query);
  }
  getCitasPorDoctor(id, query) {
    return this.listFor(id, "doctor", query);
  }

  async getCitaById(id, userId, role) {
    const cita = await db.Cita.findByPk(positiveId(id), { include: includes });
    if (!cita) fail(404, "Turno no encontrado.");
    canManage(cita, userId, role);
    return cita.toJSON();
  }

  async updateStatusCita(id, status, userId, role) {
    const current = await this.getCitaById(id, userId, role);
    const allowed =
      role === "patient"
        ? ["canceled"]
        : ["confirmed", "canceled", "completed"];
    if (!allowed.includes(status)) fail(403, "Tu rol no permite esta acción.");
    await db.sequelize.transaction(async (transaction) => {
      await lockUsers(
        [current.doctor_user_id, current.patient_user_id],
        transaction,
      );
      const cita = await db.Cita.findByPk(current.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const transitions = {
        pending: ["confirmed", "canceled"],
        confirmed: ["canceled", "completed"],
        completed: [],
        canceled: [],
      };
      if (!transitions[cita.status].includes(status))
        fail(
          409,
          "El turno cambió o esta transición ya no está permitida. Actualizá la agenda.",
        );
      if (
        status === "completed" &&
        isFuture(cita.appointment_date, cita.start_time)
      )
        fail(
          400,
          "Podés marcar la consulta como atendida a partir de su horario de inicio.",
        );
      await cita.update({ status }, { transaction });
    });
    return this.getCitaById(id, userId, role);
  }

  async reschedule(id, data, userId, role) {
    const current = await this.getCitaById(id, userId, role);
    await db.sequelize.transaction(async (transaction) => {
      await lockUsers(
        [current.doctor_user_id, current.patient_user_id],
        transaction,
      );
      const cita = await db.Cita.findByPk(current.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (
        !["pending", "confirmed"].includes(cita.status) ||
        !isFuture(cita.appointment_date, cita.start_time)
      )
        fail(
          409,
          "Sólo se pueden reprogramar turnos pendientes o confirmados que aún no empezaron.",
        );
      const slot = await validateSlot(
        cita.doctor_user_id,
        cita.patient_user_id,
        data,
        transaction,
        cita.id,
      );
      if (
        slot.appointment_date === cita.appointment_date &&
        slot.start_time === cita.start_time.slice(0, 5)
      )
        fail(400, "Elegí un horario diferente.");
      await cita.update({ ...slot, status: "pending" }, { transaction });
    });
    return this.getCitaById(id, userId, role);
  }
}
export default new CitaService();
