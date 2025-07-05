"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; // Asegúrate que la ruta sea correcta
import { format } from "date-fns";
import Link from "next/link";
import { Appointment } from "@/app/types"; // O la ruta a tu archivo de tipos
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  XCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/solid"; // O outline según tu diseño

interface TodayDoctorAppointmentsProps {
  doctorId: string;
}

const TodayDoctorAppointments: React.FC<TodayDoctorAppointmentsProps> = ({
  doctorId,
}) => {
  const fechaActual = new Date();
  const fechaFormateadaParaAPI = format(fechaActual, "yyyy-MM-dd");

  const {
    data: citasDelDia, // SWR devuelve directamente el array de Appointment[]
    error,
    isLoading,
  } = useSWR<Appointment[]>(
    doctorId
      ? `/citas/doctor/me?date=${fechaFormateadaParaAPI}&status=pending,confirmed` // Endpoint para citas del doctor
      : null,
    fetcher,
    {
      refreshInterval: 60000, // Opcional: revalidar cada minuto
    }
  );

  const renderAppointmentActions = (cita: Appointment) => {
    // Lógica para determinar qué acciones mostrar según el diseño
    // Esto es una simplificación basada en tu Figma.
    // Por ejemplo, las primeras citas podrían tener "ingresar", las siguientes "reprogramar/cancelar"
    // Esto necesitará una lógica más robusta basada en el estado real de la cita y la hora.

    const ahora = new Date();
    // const horaCita = parseISO(`${cita.appointment_date}T${cita.start_time}`); // Necesitarías parseISO de date-fns
    // const esHoraDeIngresar = isAfter(ahora, subMinutes(horaCita, 15)) && isBefore(ahora, addMinutes(horaCita, 60)); // Ejemplo

    // Por ahora, una lógica simple basada en el mock del Figma (las primeras dos con "ingresar")
    if (cita.id === "mock1" || cita.id === "mock2") {
      // Reemplaza esto con lógica real
      return (
        <button
          onClick={() =>
            alert(
              `Ingresar a videollamada para cita con ${cita.paciente?.usuario?.first_name}`
            )
          }
          className="text-xs bg-[#35799F] text-white px-2.5 py-1 rounded-md hover:bg-[#2a6184] flex items-center gap-1 text-center"
        >
          <VideoCameraIcon className="w-3.5 h-3.5" />
          Ingresar
        </button>
      );
    }
    return (
      <>
        <button
          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full"
          title="Reprogramar (Próximamente)"
        >
          <CalendarDaysIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() =>
            alert(`Cancelar cita con ${cita.paciente?.usuario?.first_name}`)
          }
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full"
          title="Cancelar Cita"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>
      </>
    );
  };

  return (
    <section>
      {" "}
      {/* La <section> principal ya está en DoctorDashboardPage */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Citas programadas para Hoy
      </h2>
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg space-y-1">
        {" "}
        {/* Reducido el space-y */}
        {isLoading &&
          // Esqueleto de carga más representativo
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 animate-pulse"
            >
              <div className="flex flex-col w-2/3">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-1.5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        {error && (
          <p className="text-red-500 text-sm py-4 text-center">
            Error al cargar las citas.
          </p>
        )}
        {!isLoading &&
          !error &&
          citasDelDia &&
          citasDelDia.length > 0 &&
          citasDelDia.map((cita) => (
            <div
              key={cita.id}
              className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">
                  {cita.start_time.substring(0, 5)} hr
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {cita.paciente?.usuario?.first_name || "Paciente"}{" "}
                  {cita.paciente?.usuario?.last_name || ""}
                </span>
                <span className="text-xs text-gray-500">
                  Tipo de cita:{" "}
                  {cita.reason_for_consultation ||
                    cita.reason_for_consultation ||
                    "No especificado"}{" "}
                  {/* Usar un campo apropiado */}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {renderAppointmentActions(cita)}
              </div>
            </div>
          ))}
        {!isLoading && !error && (!citasDelDia || citasDelDia.length === 0) && (
          <p className="text-center text-sm text-gray-500 py-4">
            No hay citas programadas para el día de hoy.
          </p>
        )}
        {/* El mensaje "No hay mas citas..." se puede añadir si es una lista parcial y ya no hay más */}
        {/* {!isLoading && !error && citasDelDia && citasDelDia.length > 0 && (
          <p className="text-center text-sm text-gray-500 pt-4">
            No hay más citas programadas para el día de hoy
          </p>
        )} */}
      </div>
    </section>
  );
};

export default TodayDoctorAppointments;
