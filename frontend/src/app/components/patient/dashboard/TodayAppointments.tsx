// src/components/paciente/dashboard/TodayAppointments.tsx
"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; // Asegúrate que la ruta sea correcta
import { format, getDate, getYear } from "date-fns"; // Solo lo necesario
import { es } from "date-fns/locale"; // Para nombres en español
import Link from "next/link";
import { useRouter } from "next/navigation";
import Calendar from "../../ui/Calendar"; // ¡IMPORTANTE! Asegúrate que la ruta a tu Calendar.tsx sea correcta
// La puse en ui/ por ser un componente genérico
import { Appointment } from "@/app/types"; // O donde tengas definida tu interfaz Appointment

interface TodayAppointmentsProps {
  pacienteId: string;
  // Ya no pasamos fechaActual como prop, la calculamos aquí
}

const TodayAppointments: React.FC<TodayAppointmentsProps> = ({
  pacienteId,
}) => {
  const router = useRouter();
  const fechaActual = new Date(); // Fecha actual para el calendario y la query

  const fechaFormateadaParaAPI = format(fechaActual, "yyyy-MM-dd");

  // Preparar datos para tu componente Calendar
  const diaSemanaStr = format(fechaActual, "EEEE", { locale: es }); // ej. "martes"
  const diaMesNum = getDate(fechaActual); // ej. 17
  const mesStr = format(fechaActual, "MMMM", { locale: es }); // ej. "julio"
  const anioNum = getYear(fechaActual); // ej. 2024

  // Formato esperado por tu Calendar.tsx: [DIA_SEMANA, '', MES, DIA_NUM, '', AÑO]
  const calendarDataParaComponente = [
    diaSemanaStr.toUpperCase(),
    "", // Placeholder si tu componente espera 6 elementos y usa índices específicos
    mesStr.toUpperCase(),
    diaMesNum.toString(),
    "", // Placeholder
    anioNum.toString(),
  ];

  const {
    data: citasDelDia, // SWR devuelve directamente el array de Appointment[] si el fetcher y backend están bien
    error,
    isLoading,
  } = useSWR<Appointment[]>(
    pacienteId
      ? `/citas/paciente/me?date=${fechaFormateadaParaAPI}&status=pending,confirmed`
      : null,
    fetcher
  );

  console.log("Las fechas del dia correspondiente: ", citasDelDia);

  const handleAgendarCita = () => {
    router.push(`/paciente/${pacienteId}/agendar-turnos`); // Ajusta la ruta si es necesario
  };

  // Estilos para el contenedor del mini-calendario como en Figma
  const calendarContainerStyles = "text-center w-20 md:w-24"; // Ajusta el ancho según necesites
  const calendarCardStyles =
    "bg-white p-2 rounded-lg shadow-md border border-gray-200"; // Estilo de la tarjeta del calendario

  return (
    <section className="mb-8 flex">
      {" "}
      {/* Sección de "Citas del Día" */}
      {/* El título "Citas programadas para el día de hoy" puede ir aquí o ser implícito */}
      <div
        className={`flex w-full flex-row sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-lg`}
      >
        <div className="flex-1 space-y-3 w-full">
          {" "}
          {/* Contenedor de la lista de citas y botón */}
          {isLoading && (
            // Esqueleto de carga para las citas
            <>
              <div className="h-12 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>
            </>
          )}
          {error && (
            <p className="text-red-500 text-sm">
              Error al cargar las citas del día.
            </p>
          )}
          {!isLoading &&
            !error &&
            (!citasDelDia || citasDelDia.length === 0) && (
              <p className="text-gray-600 text-sm">
                No hay citas programadas para el día de hoy.
              </p>
            )}
          {!isLoading && !error && citasDelDia && citasDelDia.length > 0 && (
            <div className="space-y-2 ">
              {citasDelDia.map((cita) => (
                <div
                  key={cita.id}
                  className="pb-2 border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-semibold text-sm text-[#35799F]">
                    {" "}
                    {/* Azul Oscuro */}
                    Cita para {cita.doctor?.speciality || "Especialidad"}{" "}
                    {/* Acceder a la especialidad del doctor */}
                  </p>
                  <p className="text-xs text-gray-700">
                    Dr {cita.doctor?.usuario?.first_name || ""}{" "}
                    {cita.doctor?.usuario?.last_name || ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Horas: {cita.start_time.substring(0, 5)}
                  </p>{" "}
                  {/* Mostrar solo HH:MM */}
                  <Link
                    href={`/citas/${cita.id}`} // Necesitarás una página para el detalle de la cita
                    className="text-xs text-[#812B75] hover:underline font-medium" // Morado Oscuro
                  >
                    Ver más
                  </Link>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleAgendarCita}
            className="bg-[#35799F] text-white text-sm font-semibold py-2.5 px-6 rounded-lg shadow hover:bg-[#2a6184] active:bg-[#23516f] transition-colors mt-3"
          >
            Agendar cita
          </button>
        </div>

        {/* Mini Calendario a la derecha */}
        <div className={calendarContainerStyles}>
          <div className={calendarCardStyles}>
            {" "}
            {/* Tarjeta para el calendario */}
            <Calendar
              calendar={calendarDataParaComponente}
              // Props de tamaño para que se vea como el mini calendario de Figma
              sizeCalendar="w-full h-auto" // Dejar que el contenedor padre defina el tamaño
              sizeDate="text-[10px] sm:text-xs"
              sizeDay="text-2xl sm:text-3xl"
              sizeMonthAndYear="text-[10px] sm:text-xs"
              twClass="shadow-none border-none" // Quitar sombras/bordes si la tarjeta ya los tiene
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodayAppointments;
