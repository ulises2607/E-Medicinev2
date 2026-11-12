"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import apiClient, { errorMessage } from "@/lib/axios";
import { todayIn } from "@/lib/appointments";
import type {
  Appointment,
  Doctor,
  AppConfig,
  SlotsResponse,
} from "@/app/types";
export default function BookingForm({
  appointment,
  onSaved,
}: {
  appointment?: Appointment;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState(
    appointment ? String(appointment.doctor_user_id) : "",
  );
  const [date, setDate] = useState(""),
    [start, setStart] = useState(""),
    [reason, setReason] = useState("");
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const { data: config, error: configError } = useSWR<AppConfig>(
    "/config",
    fetcher,
  );
  const {
    data: doctors,
    error: doctorsError,
    isLoading: doctorsLoading,
  } = useSWR<Doctor[]>(appointment ? null : "/doctors", fetcher);
  const slotKey =
    doctorId && date
      ? "/doctors/" +
        doctorId +
        "/horarios?" +
        new URLSearchParams({
          date,
          ...(appointment ? { excludeCitaId: String(appointment.id) } : {}),
        })
      : null;
  const {
    data,
    error: slotsError,
    isLoading: slotsLoading,
    mutate,
  } = useSWR<SlotsResponse>(slotKey, fetcher);
  const selected = data?.slots.find((s) => s.startTime === start);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !date) return;
    setPending(true);
    setError("");
    try {
      const payload = {
        doctorId: Number(doctorId),
        appointmentDate: date,
        startTime: selected.startTime,
        endTime: selected.endTime,
        reasonForConsultation: reason,
      };
      if (appointment) {
        await apiClient.put(
          "/citas/" + appointment.id + "/reprogramar",
          payload,
        );
        onSaved?.();
      } else {
        const { data: result } = await apiClient.post<{ cita: Appointment }>(
          "/citas",
          payload,
        );
        router.push("/citas/" + result.cita.id);
      }
    } catch (error) {
      setError(errorMessage(error));
      setStart("");
      void mutate();
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="card">
      <h2>
        {appointment ? "Elegir un nuevo horario" : "Elegí tu próxima consulta"}
      </h2>
      <p className="muted">
        Turnos de {config?.slotMinutes ?? 30} minutos.{" "}
        {config ? "Horarios en " + config.timeZone + "." : ""}
      </p>
      {(doctorsError || configError) && (
        <p className="error" role="alert">
          {errorMessage(doctorsError || configError)}
        </p>
      )}
      {doctorsLoading && <p role="status">Buscando profesionales…</p>}
      {!appointment && doctors?.length === 0 && (
        <p className="notice">
          Todavía no hay profesionales disponibles. Volvé a consultar más tarde.
        </p>
      )}
      <form className="form-stack" onSubmit={submit}>
        {!appointment && (
          <label>
            Profesional
            <select
              aria-label="Profesional"
              required
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setStart("");
              }}
              disabled={pending}
            >
              <option value="">Seleccioná un profesional</option>
              {doctors?.map((d) => (
                <option key={d.user_id} value={d.user_id}>
                  {d.usuario.first_name} {d.usuario.last_name} · {d.speciality}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Fecha del turno
          <input
            type="date"
            required
            value={date}
            min={config ? todayIn(config.timeZone) : undefined}
            disabled={!doctorId || pending}
            onChange={(e) => {
              setDate(e.target.value);
              setStart("");
            }}
          />
        </label>
        {slotsLoading && <p role="status">Buscando horarios libres…</p>}
        {slotsError && (
          <p role="alert" className="error">
            {errorMessage(slotsError)}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => void mutate()}
            >
              Reintentar
            </button>
          </p>
        )}
        {date && !slotsLoading && !slotsError && data?.slots.length === 0 && (
          <p className="notice">
            No hay horarios disponibles para esta fecha. Elegí otro día.
          </p>
        )}
        {data && data.slots.length > 0 && (
          <fieldset>
            <legend>Horarios disponibles</legend>
            <div className="slots">
              {data.slots.map((s) => (
                <button
                  type="button"
                  className="slot"
                  key={s.startTime}
                  aria-pressed={start === s.startTime}
                  disabled={pending}
                  onClick={() => setStart(s.startTime)}
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {!appointment && (
          <label>
            Motivo de la consulta
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={1000}
              required
              placeholder="Contanos brevemente el motivo del turno."
              disabled={pending}
            />
          </label>
        )}
        {appointment && (
          <p className="notice">
            Al reprogramar, el turno vuelve a quedar pendiente de confirmación
            del profesional.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={
            pending ||
            !selected ||
            slotsLoading ||
            Boolean(slotsError) ||
            !config
          }
        >
          {pending
            ? "Guardando…"
            : appointment
              ? "Guardar nuevo horario"
              : "Confirmar reserva"}
        </button>
      </form>
    </section>
  );
}
