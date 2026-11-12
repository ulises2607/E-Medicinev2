import { fail } from "./errors.js";
export const TIME_ZONE =
  process.env.APPOINTMENT_TIME_ZONE || "America/Argentina/Buenos_Aires";
export const SLOT_MINUTES = 30;
export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const clock = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function nowLocal() {
  const p = Object.fromEntries(
    clock.formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute;
}
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(400, "La fecha debe tener formato AAAA-MM-DD.");
  const date = new Date(value + "T12:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    fail(400, "La fecha no existe.");
  return value;
}
export function minutes(value) {
  if (
    typeof value !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(value)
  )
    fail(400, "La hora debe tener formato HH:MM.");
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}
export const timeString = (v) =>
  String(Math.floor(v / 60)).padStart(2, "0") +
  ":" +
  String(v % 60).padStart(2, "0");
export const dayOfWeek = (date) =>
  DAYS[new Date(validDate(date) + "T12:00:00Z").getUTCDay()];
export const isFuture = (date, time) =>
  date + "T" + time.slice(0, 5) > nowLocal();
export const overlaps = (start, end, otherStart, otherEnd) =>
  start < minutes(otherEnd) && end > minutes(otherStart);
export function intervals(row) {
  if (!row) return [];
  return ["morning", "afternoon"].flatMap((period) => {
    const start = row["start_time_" + period],
      end = row["end_time_" + period];
    return start && end ? [[minutes(start), minutes(end)]] : [];
  });
}
export function validateAvailability(rows) {
  if (!Array.isArray(rows) || rows.length > 7)
    fail(400, "Enviá hasta siete días de disponibilidad.");
  const days = new Set();
  return rows.map((row) => {
    if (!row || !DAYS.includes(row.day_of_week) || days.has(row.day_of_week))
      fail(400, "Los días deben ser válidos y no pueden repetirse.");
    days.add(row.day_of_week);
    const cleaned = { day_of_week: row.day_of_week };
    for (const period of ["morning", "afternoon"]) {
      const start = row["start_time_" + period] || null,
        end = row["end_time_" + period] || null;
      if (Boolean(start) !== Boolean(end))
        fail(400, "Completá inicio y fin de cada franja horaria.");
      if (start && minutes(end) - minutes(start) < SLOT_MINUTES)
        fail(400, "Cada franja debe durar al menos 30 minutos.");
      cleaned["start_time_" + period] = start
        ? timeString(minutes(start))
        : null;
      cleaned["end_time_" + period] = end ? timeString(minutes(end)) : null;
    }
    const ranges = intervals(cleaned);
    if (!ranges.length)
      fail(400, "Cada día seleccionado debe tener al menos una franja.");
    if (ranges.length === 2 && ranges[0][1] > ranges[1][0])
      fail(400, "Las franjas horarias no deben superponerse.");
    return cleaned;
  });
}
