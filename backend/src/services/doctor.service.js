import { Op } from "sequelize";
import db from "../daos/models/index.js";
import { fail, positiveId } from "../utils/errors.js";
import {
  dayOfWeek,
  intervals,
  minutes,
  nowLocal,
  validateAvailability,
} from "../utils/schedule.js";
import { lockUsers } from "./cita.service.js";
const publicUser = [
  "id",
  "first_name",
  "last_name",
  "photo_url",
  "country",
  "city",
];
const publicDoctor = [
  "user_id",
  "speciality",
  "consultation_value",
  "availability_status",
];
class DoctorService {
  async findAllDoctors(query = {}) {
    const where = { availability_status: "available" };
    if (query.speciality) {
      if (typeof query.speciality !== "string" || query.speciality.length > 255)
        fail(400, "Especialidad inválida.");
      where.speciality = { [Op.iLike]: "%" + query.speciality + "%" };
    }
    return db.Doctor.findAll({
      where,
      attributes: publicDoctor,
      include: [{ model: db.Usuario, as: "usuario", attributes: publicUser }],
      order: [["user_id", "ASC"]],
    });
  }
  async findDoctorProfileById(id) {
    const doctor = await db.Doctor.findByPk(positiveId(id), {
      attributes: publicDoctor,
      include: [
        { model: db.Usuario, as: "usuario", attributes: publicUser },
        { model: db.DisponibilidadDoctor, as: "disponibilidades" },
      ],
    });
    if (!doctor) fail(404, "Profesional no encontrado.");
    return doctor;
  }
  async getDoctorDisponibilidad(id) {
    return db.DisponibilidadDoctor.findAll({ where: { doctor_user_id: id } });
  }
  async updateDoctorDisponibilidad(id, data) {
    const rows = validateAvailability(data);
    await db.sequelize.transaction(async (transaction) => {
      await lockUsers([id], transaction);
      const future = await db.Cita.findAll({
        where: {
          doctor_user_id: id,
          appointment_date: { [Op.gte]: nowLocal().slice(0, 10) },
          status: { [Op.in]: ["pending", "confirmed"] },
        },
        transaction,
      });
      for (const cita of future) {
        if (
          cita.appointment_date + "T" + cita.start_time.slice(0, 5) <=
          nowLocal()
        )
          continue;
        const row = rows.find(
          (r) => r.day_of_week === dayOfWeek(cita.appointment_date),
        );
        if (
          !intervals(row).some(
            ([from, to]) =>
              minutes(cita.start_time) >= from && minutes(cita.end_time) <= to,
          )
        ) {
          fail(
            409,
            "La nueva disponibilidad deja turnos vigentes fuera de horario. Reprogramalos o cancelalos primero.",
          );
        }
      }
      await db.DisponibilidadDoctor.destroy({
        where: { doctor_user_id: id },
        transaction,
      });
      await db.DisponibilidadDoctor.bulkCreate(
        rows.map((row) => ({ ...row, doctor_user_id: id })),
        { transaction },
      );
    });
    return this.getDoctorDisponibilidad(id);
  }
}
export default new DoctorService();
