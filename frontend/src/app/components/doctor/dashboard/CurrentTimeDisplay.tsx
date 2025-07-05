"use client";

import React, { useState, useEffect } from "react";
import { format, getDate, getYear } from "date-fns";
import { es } from "date-fns/locale";

const CurrentTimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 30); // Actualizar cada 30 segundos para la hora
    return () => clearInterval(timerId);
  }, []);

  const dayOfWeek = format(currentTime, "EEEE", { locale: es });
  const dayOfMonth = getDate(currentTime);
  const month = format(currentTime, "MMMM", { locale: es });
  const year = getYear(currentTime);
  const time = format(currentTime, "HH:mm"); // Formato 24h, puedes usar 'hh:mm aa' para AM/PM
  const ampm = format(currentTime, "aa", { locale: es }); // am/pm

  return (
    <section className="text-center py-6 px-4 bg-white shadow-md md:shadow-none md:bg-transparent relative">
      {/* Círculos decorativos (similares a los del Figma) */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-1.5 z-0">
        <div className="w-2.5 h-2.5 bg-[#812B75] rounded-full opacity-80"></div>{" "}
        {/* Morado */}
        <div className="w-2.5 h-2.5 bg-[#EAB8DE] rounded-full opacity-80"></div>{" "}
        {/* Rosado/Púrpura claro */}
      </div>

      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-600 capitalize">
          {dayOfWeek}
        </p>
        <div className="flex items-baseline justify-center my-1">
          <p className="text-6xl md:text-7xl font-bold text-gray-800">
            {dayOfMonth}
          </p>
          <p className="text-5xl md:text-6xl font-light text-gray-700 ml-2">
            {time}
          </p>
          <span className="text-lg md:text-xl font-medium text-gray-600 ml-1 self-end pb-1">
            {ampm}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-600 capitalize">
          {month} {year}
        </p>
      </div>
    </section>
  );
};

export default CurrentTimeDisplay;
