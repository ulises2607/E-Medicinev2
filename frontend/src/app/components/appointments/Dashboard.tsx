"use client";
import useSWR from "swr";
import Link from "next/link";
import { dashboardPath, useAuth } from "@/context/AuthContext";
import { fetcher } from "@/lib/fetcher";
import { errorMessage } from "@/lib/axios";
import type { Appointment } from "@/app/types";
import { dateLabel, statusLabels } from "@/lib/appointments";
export default function Dashboard() {
  const { user } = useAuth();
  const home = dashboardPath(user!);
  const isDoctor = user!.role === "doctor";
  const { data, error, isLoading, mutate } = useSWR<Appointment[]>(
    "/citas/" + (isDoctor ? "doctor" : "paciente") + "/me",
    fetcher,
  );
  const open =
    data?.filter((c) => c.status === "pending" || c.status === "confirmed") ??
    [];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tu espacio de atención</p>
          <h1>Hola, {user!.first_name}</h1>
          <p className="muted">
            {isDoctor
              ? "Organizá tu disponibilidad y acompañá a tus pacientes."
              : "Encontrá un profesional y organizá tus próximas consultas."}
          </p>
        </div>
        <Link
          className="button accent"
          href={home + (isDoctor ? "/disponibilidad" : "/agendar-turnos")}
        >
          {isDoctor ? "Configurar disponibilidad" : "Reservar turno"}
        </Link>
      </div>
      {error && (
        <p role="alert" className="error">
          {errorMessage(error)}{" "}
          <button className="text-button" onClick={() => void mutate()}>
            Reintentar
          </button>
        </p>
      )}
      <div className="stat-grid">
        <div className="card">
          <strong>
            {isLoading || error
              ? "—"
              : (data?.filter((c) => c.status === "pending").length ?? 0)}
          </strong>
          <span>Pendientes</span>
        </div>
        <div className="card">
          <strong>
            {isLoading || error
              ? "—"
              : (data?.filter((c) => c.status === "confirmed").length ?? 0)}
          </strong>
          <span>Confirmados</span>
        </div>
        <div className="card">
          <strong>
            {isLoading || error
              ? "—"
              : (data?.filter((c) => c.status === "completed").length ?? 0)}
          </strong>
          <span>Atendidos</span>
        </div>
      </div>
      <div className="page-heading">
        <h2>Turnos por atender</h2>
        <Link href={home + "/agenda"}>Ver todos los turnos →</Link>
      </div>
      {isLoading ? (
        <p role="status">Cargando turnos…</p>
      ) : !error && open.length === 0 ? (
        <div className="card empty">
          <h2>Tu agenda está libre</h2>
          <p>
            {isDoctor
              ? "Configurá los días y horarios en los que atendés para recibir reservas."
              : "Cuando reserves un turno, vas a encontrarlo acá."}
          </p>
        </div>
      ) : (
        <div className="stack">
          {open.slice(0, 5).map((c) => (
            <article key={c.id} className="card appointment-card">
              <div>
                <span className={"badge " + c.status}>
                  {statusLabels[c.status]}
                </span>
                <h3>
                  {isDoctor
                    ? c.paciente?.usuario.first_name +
                      " " +
                      c.paciente?.usuario.last_name
                    : c.doctor?.usuario.first_name +
                      " " +
                      c.doctor?.usuario.last_name}
                </h3>
                <p>
                  {dateLabel(c.appointment_date)} · {c.start_time.slice(0, 5)} h
                </p>
                <p className="muted">{c.doctor?.speciality}</p>
              </div>
              <Link className="button" href={"/citas/" + c.id}>
                Ver turno
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
