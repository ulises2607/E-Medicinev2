"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, dashboardPath } from "@/context/AuthContext";
import { fetcher } from "@/lib/fetcher";
import apiClient, { errorMessage } from "@/lib/axios";
import { dateLabel, nowIn, statusLabels } from "@/lib/appointments";
import type { Appointment, AppointmentStatus, AppConfig } from "@/app/types";
import BookingForm from "./BookingForm";
export default function AppointmentDetail() {
  const { citaId } = useParams();
  const { user } = useAuth();
  const {
    data: cita,
    error,
    isLoading,
    mutate,
  } = useSWR<Appointment>("/citas/" + citaId, fetcher, {
    refreshInterval: 30000,
  });
  const { data: config } = useSWR<AppConfig>("/config", fetcher);
  const [editing, setEditing] = useState(false),
    [canceling, setCanceling] = useState(false);
  const [pending, setPending] = useState(false),
    [actionError, setError] = useState(""),
    [message, setMessage] = useState("");
  async function changeStatus(status: AppointmentStatus) {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await apiClient.put("/citas/" + citaId + "/status", { status });
      setCanceling(false);
      setEditing(false);
      setMessage("Turno actualizado correctamente.");
      await mutate();
    } catch (error) {
      setError(errorMessage(error));
      void mutate();
    } finally {
      setPending(false);
    }
  }
  if (isLoading) return <p role="status">Cargando turno…</p>;
  if (error || !cita)
    return (
      <div className="card">
        <p role="alert" className="error">
          {errorMessage(error)}
        </p>
        <Link href={dashboardPath(user!) + "/agenda"}>Volver a mis turnos</Link>
      </div>
    );
  const isDoctor = user!.role === "doctor",
    active = ["pending", "confirmed"].includes(cita.status);
  const future = config
    ? cita.appointment_date + "T" + cita.start_time.slice(0, 5) >
      nowIn(config.timeZone)
    : true;
  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <Link href={dashboardPath(user!) + "/agenda"}>← Mis turnos</Link>
          <h1>Detalle del turno</h1>
        </div>
        <span className={"badge " + cita.status}>
          {statusLabels[cita.status]}
        </span>
      </div>
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      {actionError && (
        <p role="alert" className="error">
          {actionError}
        </p>
      )}
      <section className="card">
        <h2>
          {dateLabel(cita.appointment_date)} · {cita.start_time.slice(0, 5)} h
        </h2>
        <p className="muted">{config && "Horarios en " + config.timeZone}</p>
        <dl className="detail-grid">
          <div>
            <dt>Profesional</dt>
            <dd>
              {cita.doctor?.usuario.first_name} {cita.doctor?.usuario.last_name}
            </dd>
          </div>
          <div>
            <dt>Especialidad</dt>
            <dd>{cita.doctor?.speciality}</dd>
          </div>
          <div>
            <dt>Paciente</dt>
            <dd>
              {cita.paciente?.usuario.first_name}{" "}
              {cita.paciente?.usuario.last_name}
            </dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>
              {cita.start_time.slice(0, 5)}–{cita.end_time.slice(0, 5)} h
            </dd>
          </div>
        </dl>
        <h3>Motivo de la consulta</h3>
        <p
          className="muted"
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {cita.reason_for_consultation}
        </p>
        {cita.status === "pending" && (
          <p className="notice" style={{ marginTop: "1rem" }}>
            La reserva está guardada y espera la confirmación del profesional.
          </p>
        )}
        <div className="actions" style={{ marginTop: "1.5rem" }}>
          {isDoctor && cita.status === "pending" && (
            <button
              className="button primary"
              disabled={pending}
              onClick={() => void changeStatus("confirmed")}
            >
              Confirmar turno
            </button>
          )}
          {isDoctor && cita.status === "confirmed" && !future && (
            <button
              className="button primary"
              disabled={pending}
              onClick={() => void changeStatus("completed")}
            >
              Marcar como atendido
            </button>
          )}
          {active && future && (
            <button
              className="button"
              disabled={pending}
              onClick={() => {
                setEditing(!editing);
                setCanceling(false);
              }}
            >
              Reprogramar
            </button>
          )}
          {active && (
            <button
              className="button danger"
              disabled={pending}
              onClick={() => {
                setCanceling(true);
                setEditing(false);
              }}
            >
              Cancelar turno
            </button>
          )}
        </div>
        {canceling && active && (
          <div
            role="alertdialog"
            aria-label="Confirmar cancelación"
            className="notice"
            style={{ marginTop: "1rem" }}
          >
            <p>
              ¿Querés cancelar este turno? El horario volverá a estar
              disponible.
            </p>
            <div className="actions" style={{ marginTop: ".75rem" }}>
              <button
                className="button danger"
                disabled={pending}
                onClick={() => void changeStatus("canceled")}
              >
                Sí, cancelar
              </button>
              <button
                className="button"
                onClick={() => setCanceling(false)}
                disabled={pending}
              >
                Conservar turno
              </button>
            </div>
          </div>
        )}
      </section>
      {editing && active && (
        <BookingForm
          appointment={cita}
          onSaved={() => {
            setEditing(false);
            setMessage("Turno reprogramado correctamente.");
            void mutate();
          }}
        />
      )}
    </div>
  );
}
