"use client";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import apiClient, { errorMessage } from "@/lib/axios";
import type { Availability, AppConfig } from "@/app/types";
const days = [
  ["Monday", "Lunes"],
  ["Tuesday", "Martes"],
  ["Wednesday", "Miércoles"],
  ["Thursday", "Jueves"],
  ["Friday", "Viernes"],
  ["Saturday", "Sábado"],
  ["Sunday", "Domingo"],
];
function AvailabilityForm({
  initial,
  onSaved,
}: {
  initial: Availability[];
  onSaved: () => void;
}) {
  const [rows, setRows] = useState(() =>
    days.map(([day]) => {
      const existing = initial.find((r) => r.day_of_week === day);
      return {
        enabled: Boolean(existing),
        day_of_week: day,
        start_time_morning: existing
          ? (existing.start_time_morning?.slice(0, 5) ?? "")
          : "09:00",
        end_time_morning: existing
          ? (existing.end_time_morning?.slice(0, 5) ?? "")
          : "12:00",
        start_time_afternoon: existing?.start_time_afternoon?.slice(0, 5) ?? "",
        end_time_afternoon: existing?.end_time_afternoon?.slice(0, 5) ?? "",
      };
    }),
  );
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  function update(index: number, key: string, value: string | boolean) {
    setRows((current) =>
      current.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
    setMessage("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      await apiClient.put(
        "/doctors/me/disponibilidad",
        rows
          .filter((r) => r.enabled)
          .map((r) => ({
            day_of_week: r.day_of_week,
            start_time_morning: r.start_time_morning || null,
            end_time_morning: r.end_time_morning || null,
            start_time_afternoon: r.start_time_afternoon || null,
            end_time_afternoon: r.end_time_afternoon || null,
          })),
      );
      setMessage(
        "Disponibilidad guardada. Tus pacientes ya pueden reservar estos horarios.",
      );
      onSaved();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit}>
      {rows.map((row, index) => (
        <div className="schedule-row" key={row.day_of_week}>
          <label className="day-toggle">
            <input
              type="checkbox"
              checked={row.enabled}
              disabled={pending}
              onChange={(e) => update(index, "enabled", e.target.checked)}
            />
            {days[index][1]}
          </label>
          <div className="time-pair">
            <label>
              {days[index][1]}: mañana desde
              <input
                type="time"
                step={60}
                disabled={!row.enabled || pending}
                value={row.start_time_morning}
                onChange={(e) =>
                  update(index, "start_time_morning", e.target.value)
                }
              />
            </label>
            <label>
              Hasta
              <input
                aria-label={days[index][1] + ": mañana hasta"}
                type="time"
                step={60}
                disabled={!row.enabled || pending}
                value={row.end_time_morning}
                onChange={(e) =>
                  update(index, "end_time_morning", e.target.value)
                }
              />
            </label>
          </div>
          <div className="time-pair">
            <label>
              {days[index][1]}: tarde desde
              <input
                type="time"
                step={60}
                disabled={!row.enabled || pending}
                value={row.start_time_afternoon}
                onChange={(e) =>
                  update(index, "start_time_afternoon", e.target.value)
                }
              />
            </label>
            <label>
              Hasta
              <input
                aria-label={days[index][1] + ": tarde hasta"}
                type="time"
                step={60}
                disabled={!row.enabled || pending}
                value={row.end_time_afternoon}
                onChange={(e) =>
                  update(index, "end_time_afternoon", e.target.value)
                }
              />
            </label>
          </div>
        </div>
      ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <button
        className="button primary"
        style={{ marginTop: "1.5rem" }}
        disabled={pending}
      >
        {pending ? "Guardando…" : "Guardar disponibilidad"}
      </button>
    </form>
  );
}
export default function AvailabilityEditor() {
  const { data, error, isLoading, mutate } = useSWR<Availability[]>(
    "/doctors/me/disponibilidad",
    fetcher,
  );
  const { data: config } = useSWR<AppConfig>("/config", fetcher);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Mi disponibilidad</h1>
          <p className="muted">
            Definí tus días y horarios de atención.{" "}
            {config && "Zona horaria: " + config.timeZone + "."}
          </p>
        </div>
      </div>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        Las consultas duran 30 minutos. Podés habilitar una o dos franjas por
        día. Los cambios se aplican a las próximas reservas; para quitar un
        horario ocupado, primero reprogramá o cancelá sus turnos.
      </p>
      {isLoading && <p role="status">Cargando disponibilidad…</p>}
      {error && (
        <p role="alert" className="error">
          {errorMessage(error)}{" "}
          <button className="text-button" onClick={() => void mutate()}>
            Reintentar
          </button>
        </p>
      )}
      {data && !error && (
        <section className="card">
          <AvailabilityForm initial={data} onSaved={() => void mutate()} />
        </section>
      )}
    </>
  );
}
