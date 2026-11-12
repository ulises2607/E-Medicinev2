"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth, dashboardPath } from "@/context/AuthContext";
import { fetcher } from "@/lib/fetcher";
import { errorMessage } from "@/lib/axios";
import { dateLabel, statusLabels } from "@/lib/appointments";
import type { Appointment, AppConfig } from "@/app/types";
export default function AppointmentList() {
  const { user } = useAuth();
  const [status, setStatus] = useState(""),
    [date, setDate] = useState("");
  const isDoctor = user!.role === "doctor";
  const query = new URLSearchParams({
    order: "DESC",
    ...(status ? { status } : {}),
    ...(date ? { date } : {}),
  });
  const { data, error, isLoading, mutate } = useSWR<Appointment[]>(
    "/citas/" + (isDoctor ? "doctor" : "paciente") + "/me?" + query,
    fetcher,
  );
  const { data: config } = useSWR<AppConfig>("/config", fetcher);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Mis turnos</h1>
          <p className="muted">
            Consultá y gestioná cada reserva.
            {config && " Horarios: " + config.timeZone + "."}
          </p>
        </div>
        {!isDoctor && (
          <Link
            className="button primary"
            href={dashboardPath(user!) + "/agendar-turnos"}
          >
            Reservar turno
          </Link>
        )}
      </div>
      <div className="filters">
        <label>
          Estado
          <select
            aria-label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button
          className="button"
          onClick={() => {
            setStatus("");
            setDate("");
          }}
        >
          Limpiar filtros
        </button>
      </div>
      {isLoading && <p role="status">Cargando turnos…</p>}
      {error && (
        <p role="alert" className="error">
          {errorMessage(error)}{" "}
          <button className="text-button" onClick={() => void mutate()}>
            Reintentar
          </button>
        </p>
      )}
      {!isLoading && !error && data?.length === 0 && (
        <div className="card empty">
          <h2>No hay turnos para mostrar</h2>
          <p>Probá otros filtros o volvé después de reservar.</p>
        </div>
      )}
      <div className="stack">
        {data?.map((c) => (
          <article className="card appointment-card" key={c.id}>
            <div>
              <span className={"badge " + c.status}>
                {statusLabels[c.status]}
              </span>
              <h2>
                {isDoctor
                  ? c.paciente?.usuario.first_name +
                    " " +
                    c.paciente?.usuario.last_name
                  : c.doctor?.usuario.first_name +
                    " " +
                    c.doctor?.usuario.last_name}
              </h2>
              <p>
                {dateLabel(c.appointment_date)} · {c.start_time.slice(0, 5)}–
                {c.end_time.slice(0, 5)} h
              </p>
              <p className="muted">{c.doctor?.speciality}</p>
            </div>
            <Link className="button" href={"/citas/" + c.id}>
              Gestionar turno
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
