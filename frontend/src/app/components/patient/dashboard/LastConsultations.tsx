"use client";

import React from "react";
import ConsultationCard from "./ConsultationCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"; // Para las flechas
import doc1 from "../../../../../public/doctores/doctor-1.png";
import doc2 from "../../../../../public/doctores/doctor-2.png";
import doc3 from "../../../../../public/doctores/doctora-3.png";
// Datos hardcodeados para el ejemplo

const mockConsultations = [
  {
    id: "1",
    doctorImage: doc1,
    doctorName: "Johan Doe",
    doctorSpeciality: "Ortopedia",
    rating: 4,
    diagnosis: "Desgarre inguinal",
    prescription: "Terapia física, naproxeno",
  },
  {
    id: "2",
    doctorImage: doc2,
    doctorName: "Ana Pérez",
    doctorSpeciality: "Cardiología",
    rating: 5,
    diagnosis: "Hipertensión controlada",
    prescription: "Losartán 50mg, dieta baja en sodio",
  },
  {
    id: "3",
    doctorImage: doc3,
    doctorName: "Carlos Sánchez",
    doctorSpeciality: "Pediatría",
    rating: 4,
    diagnosis: "Otitis media aguda",
    prescription: "Amoxicilina, paracetamol si fiebre",
  },
];

interface LastConsultationsProps {
  pacienteId: string; // Aunque no la usemos ahora, la necesitarás para SWR
}

const LastConsultations: React.FC<LastConsultationsProps> = ({
  pacienteId,
}) => {
  // Por ahora, no usamos SWR, solo los datos mock
  // const { data: ultimasConsultas, error, isLoading } = useSWR...

  const isLoading = false; // Simular que no está cargando
  const error = null; // Simular que no hay error
  const ultimasConsultas = mockConsultations; // Usar los datos hardcodeados

  return (
    <section className="mb-6 md:mb-8">
      <div className="flex justify-between items-center px-4 md:px-0 mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Últimas consultas
        </h2>
        {/* Controles de navegación del carrusel (solo visuales por ahora) */}
        {ultimasConsultas &&
          ultimasConsultas.length > 1 && ( // Mostrar solo si hay más de una
            <div className="flex space-x-2">
              <button
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Consulta anterior"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Siguiente consulta"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
      </div>
      {isLoading && (
        <div className="h-36 bg-gray-200 rounded-xl animate-pulse mx-4 md:mx-0"></div>
      )}{" "}
      {/* Esqueleto de carga */}
      {error && (
        <p className="text-red-500 text-sm px-4 md:px-0">
          Error al cargar últimas consultas.
        </p>
      )}
      {!isLoading &&
        !error &&
        (!ultimasConsultas || ultimasConsultas.length === 0) && (
          <div className="bg-gray-100 p-4 rounded-xl mx-4 md:mx-0">
            <p className="text-gray-600 text-sm text-center">
              No tienes consultas anteriores registradas.
            </p>
          </div>
        )}
      {!isLoading &&
        !error &&
        ultimasConsultas &&
        ultimasConsultas.length > 0 && (
          // Este div simulará un carrusel horizontal con scroll
          // Cuando implementes Swiper.js, lo reemplazarás por <Swiper> y <SwiperSlide>
          <div className="flex space-x-4 overflow-x-auto pb-4 pl-4 md:pl-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-thumb-rounded-full">
            {ultimasConsultas.map((consulta) => (
              <ConsultationCard
                key={consulta.id}
                doctorImage={consulta.doctorImage}
                doctorName={consulta.doctorName}
                doctorSpeciality={consulta.doctorSpeciality}
                rating={consulta.rating}
                diagnosis={consulta.diagnosis}
                prescription={consulta.prescription}
              />
            ))}
            {/* Añadir un elemento extra al final para que el scroll permita ver la última tarjeta completa sin pegarse al borde */}
            <div className="flex-shrink-0 w-1 md:w-0"></div>
          </div>
        )}
    </section>
  );
};

export default LastConsultations;
