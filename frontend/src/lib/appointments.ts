import type { AppointmentStatus } from "@/app/types";
export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Atendido",
  canceled: "Cancelado",
};
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
export function todayIn(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return parts.year + "-" + parts.month + "-" + parts.day;
}
export function nowIn(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return todayIn(timeZone) + "T" + parts.hour + ":" + parts.minute;
}
